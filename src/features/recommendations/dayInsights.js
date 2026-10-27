import { findRanges, formatRangeLabel } from "../prices/cheapRanges";
import { formatPriceWithUnits } from "../prices/priceFormat";
import { hourOf } from "../../hooks/usePriceStats";
import { PRICE_TIER_LABELS } from "../../theme/tokens";
import { t } from "../../i18n";
import { fixed } from "../../i18n/format";

/**
 * Traduce los precios de un día a frases accionables.
 *
 * Módulo puro: no importa React ni MUI y no lee el reloj por su cuenta (`now`
 * entra por parámetro). Cada consejo es una regla con condición, así que un día
 * plano, uno con excedente solar y uno con pico de tarde producen textos
 * distintos — que es justo lo que hace que la sección merezca la pena.
 *
 * Los iconos se nombran con una clave, no con un componente, para que la
 * lógica quede independiente de la capa visual.
 *
 * Cada consejo lleva además un `kind` que decide dónde se pinta:
 *  - "now": lo que conviene hacer ahora mismo (el titular de la sección).
 *  - "moment": una franja horaria concreta, con `label`, `when` (la hora, que
 *    es lo que se escanea), `detail` y opcionalmente `status`.
 *
 * "La mejor franja" y "lo que cambia en euros" ya no son reglas: los responde
 * la calculadora "¿Cuándo lo enciendo?", y repetirlos aquí daba la misma
 * respuesta dos veces en la misma pantalla.
 *  - "fact": contexto que no pide acción inmediata (euros, partes del día…).
 * `title` y `body` se mantienen como versión en prosa del mismo consejo.
 */

/** Ventana de referencia para "la mejor franja del día". */
const VALLEY_HOURS = 3;

/**
 * Por debajo de esta variación relativa ((max - min) / media), elegir la hora
 * deja de importar.
 *
 * Calibrado sobre 123 días reales de PVPC: la mediana ronda 0,8 en invierno y
 * 1,5 en verano, y el día más plano encontrado (27-dic-2025) da 0,353. Con el
 * 0,15 que parecía razonable a ojo, esta regla no habría saltado nunca.
 */
const FLAT_THRESHOLD = 0.4;

/** Por debajo de esta relación pico/valle no hay nada que "evitar". */
const AVOID_RATIO = 1.5;

/** Diferencia mínima entre franjas del día para que merezca mencionarse. */
const BLOCK_RATIO = 0.85;

/**
 * Umbral de "hora casi regalada", en €/MWh (= 1 céntimo por kWh).
 *
 * No se busca precio cero: la serie es PVPC, que lleva peajes y cargos dentro y
 * por eso tiene suelo. En 169 días revisados no hubo ni una hora a 0 o menos,
 * pero sí 5 días con horas por debajo de 10 €/MWh, todos en pleno verano solar.
 */
const ALMOST_FREE = 10;

// Nombre de cada parte del día como sujeto ("La tarde es…") y como
// complemento ("…de la tarde"): en otros idiomas cambian distinto.
const DAY_BLOCKS = [
  { key: "madrugada", from: 0, to: 7 },
  { key: "manana", from: 7, to: 14 },
  { key: "tarde", from: 14, to: 20 },
  { key: "noche", from: 20, to: 24 },
];

const padHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

const formatMultiplier = (times) => (times >= 10 ? `${Math.round(times)}` : fixed(times, 1));

const formatPercent = (fraction) => `${Math.round(Math.abs(fraction) * 100)} %`;

/** Agrupa horas sueltas en tramos contiguos: [1,2,3,7] -> "01:00–04:00 y 07:00–08:00". */
const describeHourGroups = (hours) => {
  if (!hours.length) return "";

  const groups = [];
  let start = hours[0];
  let previous = hours[0];

  hours.slice(1).forEach((hour) => {
    if (hour !== previous + 1) {
      groups.push([start, previous + 1]);
      start = hour;
    }
    previous = hour;
  });
  groups.push([start, previous + 1]);

  const labels = groups.map(([from, to]) => `${padHour(from)}–${padHour(to)}`);
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")}${t("tips.insights.and")}${labels[labels.length - 1]}`;
};

const averageOfBlock = (energyCost, { from, to }) => {
  const inBlock = energyCost.filter((item) => {
    const hour = hourOf(item.datetime);
    return hour >= from && hour < to;
  });
  if (!inBlock.length) return null;
  return inBlock.reduce((sum, item) => sum + item.value, 0) / inBlock.length;
};

/** "En curso" / "Empieza en 3 h" / "Ya ha pasado", o null si no es hoy. */
const windowStatus = (range, currentHour, isToday) => {
  if (!isToday || !range) return null;
  if (range.endHour <= currentHour) return t("tips.insights.status.past");
  if (range.startHour <= currentHour) return t("tips.insights.status.running");
  return t("tips.insights.status.startsIn", { hours: range.startHour - currentHour });
};

// --- Reglas -----------------------------------------------------------------
// Cada una devuelve un Insight o null. Devolver null es lo normal.

const flatDay = ({ isFlat, spread, units }) => {
  if (!isFlat) return null;
  return {
    id: "flat-day",
    kind: "fact",
    tone: "info",
    icon: "flat",
    title: t("tips.insights.flatTitle"),
    body: t("tips.insights.flatBody", { spread: formatPriceWithUnits(spread, units) }),
  };
};

const rightNow = ({ stats, units, currentHour, energyCost }) => {
  if (!stats.isToday) return null;

  // La hora actual se busca aquí en vez de tomar `stats.current`: ese lo
  // memoiza `usePriceStats` con el reloj del primer render, así que con la
  // pestaña abierta un rato se quedaría anclado a la hora de entrada.
  const current = energyCost.find((item) => hourOf(item.datetime) === currentHour);
  if (!current) return null;

  const tier = stats.tierOf(current.value);
  const cheap = tier === "cheapest" || tier === "low";
  const price = formatPriceWithUnits(current.value, units);

  if (cheap) {
    return {
      id: "now",
      kind: "now",
      kicker: t("tips.insights.nowKicker", { hour: current.datetime }),
      tone: "success",
      icon: "clock",
      title: t("tips.insights.goodNowTitle"),
      body: t("tips.insights.goodNowBody", { price, tier: PRICE_TIER_LABELS[tier].toLowerCase() }),
    };
  }

  // Solo tiene sentido decir "espera" si queda algo apreciablemente más barato.
  const later = energyCost.filter((item) => hourOf(item.datetime) > currentHour);
  const cheapest = later.reduce(
    (best, item) => (best === null || item.value < best.value ? item : best),
    null
  );
  const worthWaiting =
    cheapest && current.value > 0 && cheapest.value < current.value * 0.9;

  const advice = worthWaiting
    ? t("tips.insights.waitAdvice", {
        hour: cheapest.datetime,
        price: formatPriceWithUnits(cheapest.value, units),
        percent: formatPercent((current.value - cheapest.value) / current.value),
      })
    : t("tips.insights.noWaitAdvice");

  return {
    id: "now",
    kind: "now",
    kicker: t("tips.insights.nowKicker", { hour: current.datetime }),
    tone: tier === "high" ? "danger" : "warning",
    icon: "clock",
    title: t("tips.insights.badNowTitle"),
    body: t("tips.insights.badNowBody", { price, advice }),
  };
};


const worstWindow = ({ valley, isFlat, units, currentHour, stats }) => {
  const best = valley.best[0];
  const { worst } = valley;
  if (isFlat || !best || !worst) return null;

  const ratio = best.avgPrice > 0 ? worst.avgPrice / best.avgPrice : null;
  if (ratio !== null && ratio < AVOID_RATIO) return null;

  const comparison =
    ratio !== null
      ? t("tips.insights.avoidTimes", { times: formatMultiplier(ratio) })
      : t("tips.insights.avoidVs", { price: formatPriceWithUnits(best.avgPrice, units) });

  return {
    id: "worst-window",
    kind: "moment",
    tone: "danger",
    icon: "avoid",
    label: t("tips.insights.avoidLabel"),
    when: formatRangeLabel(worst),
    detail:
      ratio !== null
        ? t("tips.insights.avoidDetail", { price: formatPriceWithUnits(worst.avgPrice, units), times: formatMultiplier(ratio) })
        : t("tips.insights.avoidDetailShort", { price: formatPriceWithUnits(worst.avgPrice, units) }),
    status: windowStatus(worst, currentHour, stats.isToday),
    past: stats.isToday && worst.endHour <= currentHour,
    title: t("tips.insights.avoidTitle", { range: formatRangeLabel(worst) }),
    body: t("tips.insights.avoidBody", { price: formatPriceWithUnits(worst.avgPrice, units), comparison }),
  };
};


const freeHours = ({ energyCost, units }) => {
  const cheapEnough = energyCost.filter((item) => item.value <= ALMOST_FREE);
  if (!cheapEnough.length) return null;

  const hours = cheapEnough
    .map((item) => hourOf(item.datetime))
    .sort((a, b) => a - b);
  const peak = Math.max(...cheapEnough.map((item) => item.value));

  return {
    id: "free-hours",
    kind: "moment",
    tone: "success",
    icon: "solar",
    label: t("tips.insights.freeLabel", { hours: hours.length }),
    when: describeHourGroups(hours),
    detail: t("tips.insights.freeDetail", { price: formatPriceWithUnits(peak, units) }),
    title: t("tips.insights.freeTitle", { hours: hours.length }),
    body: t("tips.insights.freeBody", { hours: describeHourGroups(hours), price: formatPriceWithUnits(peak, units) }),
  };
};

const dayBlocks = ({ energyCost, isFlat, units }) => {
  if (isFlat) return null;

  const withAverage = DAY_BLOCKS.map((block) => ({
    ...block,
    average: averageOfBlock(energyCost, block),
  })).filter((block) => block.average !== null);

  if (withAverage.length < 2) return null;

  const sorted = [...withAverage].sort((a, b) => a.average - b.average);
  const cheapest = sorted[0];
  const expensive = sorted[sorted.length - 1];

  if (expensive.average <= 0) return null;
  if (cheapest.average > expensive.average * BLOCK_RATIO) return null;

  return {
    id: "blocks",
    kind: "fact",
    tone: "info",
    icon: "info",
    title: t("tips.insights.blocksTitle", { subject: t(`tips.insights.blocks.${cheapest.key}.subject`) }),
    body: t("tips.insights.blocksBody", {
      cheap: formatPriceWithUnits(cheapest.average, units),
      expensive: formatPriceWithUnits(expensive.average, units),
      object: t(`tips.insights.blocks.${expensive.key}.object`),
    }),
  };
};

const tomorrow = ({ isFuture }) => {
  if (!isFuture) return null;
  return {
    id: "tomorrow",
    kind: "fact",
    tone: "info",
    icon: "calendar",
    title: t("tips.insights.tomorrowTitle"),
    body: t("tips.insights.tomorrowBody"),
  };
};

// El orden es fijo y explícito: si se ordenara por severidad, el layout
// bailaría al cambiar de día.
const RULES = [
  flatDay,
  rightNow,
  worstWindow,
  freeHours,
  dayBlocks,
  tomorrow,
];

// --- Veredicto del día ------------------------------------------------------

const CHEAP_DELTA = -0.1;
const EXPENSIVE_DELTA = 0.1;

/*
 * El titular tiene que concordar con la fecha que se está mirando: decir "Hoy
 * es un día caro" mientras se consulta el martes pasado es sencillamente falso.
 * Los títulos están en `tips.verdict.{nivel}.{today|past|future}`.
 */

const buildVerdict = ({ stats, baseline, sampleDays, units, when }) => {
  const average = stats.average;

  if (!Number.isFinite(baseline) || baseline <= 0 || !sampleDays) {
    return {
      level: "unknown",
      average,
      deltaPct: null,
      title: t("tips.verdict.noReference"),
      body: t("tips.verdict.noReferenceBody"),
    };
  }

  const delta = (average - baseline) / baseline;
  const reference = t("tips.verdict.reference", { days: sampleDays, price: formatPriceWithUnits(baseline, units) });

  const level =
    delta <= CHEAP_DELTA
      ? "cheap"
      : delta >= EXPENSIVE_DELTA
      ? "expensive"
      : "normal";

  const body =
    level === "normal"
      ? t("tips.verdict.similar", { reference })
      : t("tips.verdict.delta", { percent: formatPercent(delta), below: level === "cheap", reference });

  return {
    level,
    average,
    deltaPct: delta,
    title: t(`tips.verdict.${level}.${when}`),
    body,
  };
};

// --- Entrada pública --------------------------------------------------------

/**
 * @param {object} params
 * @param {Array<{datetime: string, value: number}>} params.energyCost
 * @param {object} params.stats resultado de `usePriceStats`
 * @param {number|null} params.baseline media de los días previos
 * @param {number} params.sampleDays días que componen el baseline
 * @param {string} params.units unidad de visualización (UNITS.MWH | UNITS.KWH)
 * @param {boolean} params.isFuture la fecha mostrada es posterior a hoy
 * @param {Date} params.now reloj inyectado, para que el texto no envejezca solo
 * @returns {{verdict: object|null, insights: Array}}
 */
export const buildInsights = ({
  energyCost,
  stats,
  baseline = null,
  sampleDays = 0,
  units,
  isFuture = false,
  now = new Date(),
}) => {
  if (!energyCost?.length || !stats?.min || !stats?.max) {
    return { verdict: null, insights: [] };
  }

  const spread = stats.max.value - stats.min.value;
  const currentHour = now.getHours();

  const context = {
    energyCost,
    stats,
    baseline,
    sampleDays,
    units,
    isFuture,
    when: stats.isToday ? "today" : isFuture ? "future" : "past",
    currentHour,
    spread,
    isFlat: stats.average > 0 && spread / stats.average < FLAT_THRESHOLD,
    valley: findRanges(energyCost, { hours: VALLEY_HOURS, topN: 1 }),
  };

  return {
    verdict: buildVerdict(context),
    insights: RULES.map((rule) => rule(context)).filter(Boolean),
  };
};

export default buildInsights;
