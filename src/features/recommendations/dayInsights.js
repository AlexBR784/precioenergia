import { findRanges, formatRangeLabel } from "../prices/cheapRanges";
import {
  euroCost,
  formatEuros,
  formatPriceWithUnits,
} from "../prices/priceFormat";
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
 */

/** Ventana de referencia para "la mejor franja del día". */
const VALLEY_HOURS = 3;

/**
 * Carga tangible con la que poner una cifra absoluta al lado de los %.
 *
 * Se usa mientras el usuario no haya fijado su propia potencia en la
 * calculadora: una lavadora es reconocible, "2 kW" no.
 */
const LAUNDRY = { hours: 2, kw: 1.5, label: "Una lavadora de 2 h (1,5 kW)" };

const formatKw = (kw) =>
  kw.toLocaleString("es-ES", { maximumFractionDigits: 2 });

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

// --- Reglas -----------------------------------------------------------------
// Cada una devuelve un Insight o null. Devolver null es lo normal.

const flatDay = ({ isFlat, spread, units }) => {
  if (!isFlat) return null;
  return {
    id: "flat-day",
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
    tone: tier === "high" ? "danger" : "warning",
    icon: "clock",
    title: "Ahora mismo no es buen momento",
    body: `La hora actual está a ${price}. ${advice}`,
  };
};

const bestWindow = ({ valley, units, energyCost, currentHour, stats }) => {
  const best = valley.best[0];
  if (!best) return null;

  let body = `Media de ${formatPriceWithUnits(
    best.avgPrice,
    units
  )}: es el tramo de ${VALLEY_HOURS} horas seguidas más barato del día.`;

  // Si ya ha pasado, la recomendación es inservible tal cual: se añade la mejor
  // ventana de lo que queda de día.
  if (stats.isToday && best.endHour <= currentHour) {
    const remaining = findRanges(energyCost, {
      hours: VALLEY_HOURS,
      onlyFuture: true,
      currentHour,
      topN: 1,
    }).best[0];

    // A última hora "lo mejor que queda" puede ser justamente el tramo que la
    // regla de al lado manda evitar. Recomendarlo sería contradecirse: cuando
    // lo que resta no mejora al peor tramo del día, se dice y punto.
    const worthIt =
      remaining &&
      (!valley.worst || remaining.avgPrice < valley.worst.avgPrice * 0.95);

    if (worthIt) {
      body += ` Ya ha pasado; de lo que queda de día lo mejor es ${formatRangeLabel(
        remaining
      )}, a ${formatPriceWithUnits(remaining.avgPrice, units)}.`;
    } else {
      body +=
        " Ya ha pasado, y lo que queda de día está entre lo más caro: si puedes, deja el consumo para mañana.";
    }
  }

  return {
    id: "best-window",
    tone: "success",
    icon: "best",
    title: `Mejor franja: ${formatRangeLabel(best)}`,
    body,
  };
};

const worstWindow = ({ valley, isFlat, units }) => {
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
    tone: "danger",
    icon: "avoid",
    title: `Evita ${formatRangeLabel(worst)}`,
    body: `Media de ${formatPriceWithUnits(worst.avgPrice, units)}, ${comparison}`,
  };
};

const realCost = ({ laundry, isFlat, powerKw, powerIsCustom }) => {
  const best = laundry.best[0];
  const { worst } = laundry;
  if (isFlat || !best || !worst) return null;

  // Si el usuario ya le dijo su potencia a la calculadora, el consejo habla de
  // su aparato en vez de seguir con la lavadora de ejemplo.
  const kw = powerIsCustom ? powerKw : LAUNDRY.kw;
  const subject = powerIsCustom
    ? `${LAUNDRY.hours} horas a ${formatKw(kw)} kW cuestan`
    : `${LAUNDRY.label} cuesta`;

  const cheapCost = euroCost(best.sumPrice, kw);
  const expensiveCost = euroCost(worst.sumPrice, kw);
  if (cheapCost === null || expensiveCost === null) return null;

  const disclaimer =
    "Término de energía PVPC. No incluye el término fijo de potencia, el IVA ni el impuesto eléctrico.";

  return {
    id: "real-cost",
    tone: "info",
    icon: "money",
    title: "Lo que cambia en euros",
    body: `${subject} ≈ ${formatEuros(cheapCost)} empezando a las ${padHour(
      best.startHour
    )} y ≈ ${formatEuros(expensiveCost)} a las ${padHour(worst.startHour)}.`,
    note: powerIsCustom
      ? `Potencia tomada de la calculadora de tramos. ${disclaimer}`
      : disclaimer,
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
    tone: "success",
    icon: "solar",
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
  bestWindow,
  worstWindow,
  realCost,
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
 * @param {number} params.powerKw potencia elegida en la calculadora
 * @param {boolean} params.powerIsCustom si esa potencia la ha fijado el usuario
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
  powerKw = LAUNDRY.kw,
  powerIsCustom = false,
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
    powerKw,
    powerIsCustom,
    currentHour,
    spread,
    isFlat: stats.average > 0 && spread / stats.average < FLAT_THRESHOLD,
    valley: findRanges(energyCost, { hours: VALLEY_HOURS, topN: 1 }),
    laundry: findRanges(energyCost, { hours: LAUNDRY.hours, topN: 1 }),
  };

  return {
    verdict: buildVerdict(context),
    insights: RULES.map((rule) => rule(context)).filter(Boolean),
  };
};

export default buildInsights;
