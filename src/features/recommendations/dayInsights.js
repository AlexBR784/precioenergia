import { findRanges, formatRangeLabel } from "../prices/cheapRanges";
import { formatPriceWithUnits } from "../prices/priceFormat";
import { hourOf } from "../../hooks/usePriceStats";
import { PRICE_TIER_LABELS } from "../../theme/tokens";

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

const DAY_BLOCKS = [
  { key: "madrugada", from: 0, to: 7, subject: "La madrugada", object: "la madrugada" },
  { key: "manana", from: 7, to: 14, subject: "La mañana", object: "la mañana" },
  { key: "tarde", from: 14, to: 20, subject: "La tarde", object: "la tarde" },
  { key: "noche", from: 20, to: 24, subject: "La noche", object: "la noche" },
];

const padHour = (hour) => `${String(hour).padStart(2, "0")}:00`;

const formatMultiplier = (times) =>
  times >= 10
    ? `${Math.round(times)}`
    : times.toLocaleString("es-ES", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });

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
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
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
  if (range.endHour <= currentHour) return "Ya ha pasado";
  if (range.startHour <= currentHour) return "En curso";
  return `Empieza en ${range.startHour - currentHour} h`;
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
    title: "La hora apenas importa",
    body: `Entre la hora más barata y la más cara solo hay ${formatPriceWithUnits(
      spread,
      units
    )}. Mover los electrodomésticos de hora apenas cambia la factura.`,
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
      kicker: `Ahora · ${current.datetime} h`,
      tone: "success",
      icon: "clock",
      title: "Buen momento para consumir",
      body: `La hora actual está a ${price}, dentro del tramo ${PRICE_TIER_LABELS[
        tier
      ].toLowerCase()} del día.`,
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
    ? `A partir de las ${cheapest.datetime} baja a ${formatPriceWithUnits(
        cheapest.value,
        units
      )}, un ${formatPercent(
        (current.value - cheapest.value) / current.value
      )} menos.`
    : "No quedan horas apreciablemente más baratas hoy.";

  return {
    id: "now",
    kind: "now",
    kicker: `Ahora · ${current.datetime} h`,
    tone: tier === "high" ? "danger" : "warning",
    icon: "clock",
    title: "Ahora mismo no es buen momento",
    body: `La hora actual está a ${price}. ${advice}`,
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
      ? `${formatMultiplier(ratio)} veces lo que cuesta la franja más barata.`
      : `frente a ${formatPriceWithUnits(best.avgPrice, units)} de la más barata.`;

  return {
    id: "worst-window",
    kind: "moment",
    tone: "danger",
    icon: "avoid",
    label: "Evita",
    when: formatRangeLabel(worst),
    detail:
      ratio !== null
        ? `${formatPriceWithUnits(worst.avgPrice, units)} de media · ${formatMultiplier(
            ratio
          )} veces la franja más barata`
        : `${formatPriceWithUnits(worst.avgPrice, units)} de media`,
    status: windowStatus(worst, currentHour, stats.isToday),
    title: `Evita ${formatRangeLabel(worst)}`,
    body: `Media de ${formatPriceWithUnits(worst.avgPrice, units)}, ${comparison}`,
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
    label: hours.length === 1 ? "Casi gratis (1 h)" : `Casi gratis (${hours.length} h)`,
    when: describeHourGroups(hours),
    detail: `Hasta ${formatPriceWithUnits(peak, units)} · suele ser excedente solar`,
    title:
      hours.length === 1
        ? "Una hora casi regalada"
        : `${hours.length} horas casi regaladas`,
    body: `De ${describeHourGroups(hours)} el precio no pasa de ${formatPriceWithUnits(
      peak,
      units
    )}. Suele ser excedente solar: dentro de ese tramo da casi igual la hora que elijas.`,
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
    title: `${cheapest.subject} es la parte más barata del día`,
    body: `Media de ${formatPriceWithUnits(
      cheapest.average,
      units
    )}, frente a ${formatPriceWithUnits(expensive.average, units)} de ${
      expensive.object
    }.`,
  };
};

const tomorrow = ({ isFuture }) => {
  if (!isFuture) return null;
  return {
    id: "tomorrow",
    kind: "fact",
    tone: "info",
    icon: "calendar",
    title: "Estás viendo precios de mañana",
    body: "Los precios del día siguiente se publican sobre las 20:15 h, así que puedes planificar con ellos desde la tarde anterior.",
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

/**
 * El titular tiene que concordar con la fecha que se está mirando: decir "Hoy
 * es un día caro" mientras se consulta el martes pasado es sencillamente falso.
 */
const VERDICT_TITLES = {
  cheap: {
    today: "Hoy es un día barato",
    past: "Fue un día barato",
    future: "Va a ser un día barato",
  },
  expensive: {
    today: "Hoy es un día caro",
    past: "Fue un día caro",
    future: "Va a ser un día caro",
  },
  normal: {
    today: "Hoy es un día normal",
    past: "Fue un día normal",
    future: "Va a ser un día normal",
  },
};

const buildVerdict = ({ stats, baseline, sampleDays, units, when }) => {
  const average = stats.average;

  if (!Number.isFinite(baseline) || baseline <= 0 || !sampleDays) {
    return {
      level: "unknown",
      average,
      deltaPct: null,
      title: "Sin referencia para comparar",
      body: "No se han podido cargar los precios de los días anteriores, así que no hay con qué compararlo.",
    };
  }

  const delta = (average - baseline) / baseline;
  const reference = `la media de los ${sampleDays} días previos (${formatPriceWithUnits(
    baseline,
    units
  )})`;

  const level =
    delta <= CHEAP_DELTA
      ? "cheap"
      : delta >= EXPENSIVE_DELTA
      ? "expensive"
      : "normal";

  const body =
    level === "normal"
      ? `Prácticamente igual que ${reference}.`
      : `Un ${formatPercent(delta)} por ${
          level === "cheap" ? "debajo" : "encima"
        } de ${reference}.`;

  return {
    level,
    average,
    deltaPct: delta,
    title: VERDICT_TITLES[level][when],
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
