import { hourOf } from "../../hooks/usePriceStats";

/**
 * Búsqueda de las ventanas de N horas consecutivas más baratas del día.
 *
 * Vivía dentro del componente del diálogo; extraerla permite calcular además
 * la ventana más cara, que es la referencia que da sentido a la recomendación
 * ("un 72 % más barato que el peor momento").
 */

/**
 * @param {Array<{datetime: string, value: number}>} energyCost precios horarios
 * @param {object} options
 * @param {number} options.hours duración de la ventana
 * @param {boolean} options.onlyFuture descartar ventanas ya empezadas
 * @param {number} options.currentHour hora actual (0-23)
 * @param {number} [options.topN=3] cuántas ventanas baratas devolver
 * @returns {{best: Array, worst: object|null, total: number}}
 */
export const findRanges = (
  energyCost,
  { hours, onlyFuture = false, currentHour = 0, topN = 3 } = {}
) => {
  const empty = { best: [], worst: null, total: 0 };

  if (!energyCost?.length) return empty;
  if (!Number.isInteger(hours) || hours <= 0 || hours > energyCost.length) {
    return empty;
  }

  const ranges = [];

  // Se recorre la longitud real del array, no un 24 fijo: en los días de
  // cambio de hora hay 23 o 25 entradas.
  for (let i = 0; i <= energyCost.length - hours; i++) {
    const slice = energyCost.slice(i, i + hours);
    const startHour = hourOf(slice[0].datetime);

    if (onlyFuture && startHour < currentHour) continue;

    const sumPrice = slice.reduce((sum, item) => sum + item.value, 0);

    ranges.push({
      startHour,
      // Hora de fin exclusiva: un tramo 11:00-13:00 de 2 h termina a las 13.
      endHour: hourOf(slice[slice.length - 1].datetime) + 1,
      hours: slice.map((item) => item.datetime),
      // Solo clave de ordenación; no se muestra como precio.
      sumPrice,
      avgPrice: sumPrice / slice.length,
    });
  }

  if (ranges.length === 0) return empty;

  const sorted = [...ranges].sort((a, b) => a.sumPrice - b.sumPrice);

  return {
    best: sorted.slice(0, topN),
    // Con una sola ventana posible no hay comparación que hacer.
    worst: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    total: sorted.length,
  };
};

/** Ahorro porcentual de la mejor ventana frente a la peor. */
export const savingPercent = (best, worst) => {
  if (!best || !worst || worst.sumPrice <= 0) return null;
  const saving = ((worst.sumPrice - best.sumPrice) / worst.sumPrice) * 100;
  return saving > 0 ? saving : null;
};

/**
 * Formatea una ventana como "11:00 – 14:00".
 *
 * La hora de fin no se reduce módulo 24: una ventana que cubre el día entero
 * termina a las "24:00", no a las "00:00" (que la haría parecer de duración
 * cero).
 */
export const formatRangeLabel = (range) => {
  if (!range) return "—";
  const pad = (hour) => `${String(hour).padStart(2, "0")}:00`;
  return `${pad(range.startHour)} – ${pad(range.endHour)}`;
};

/** Situación de la ventana respecto a la hora actual. */
export const rangeStatus = (range, currentHour, isToday) => {
  if (!range || !isToday) return null;
  if (currentHour >= range.startHour && currentHour < range.endHour) {
    return { label: "En curso ahora", color: "price.cheapest" };
  }
  if (currentHour < range.startHour) {
    const remaining = range.startHour - currentHour;
    return {
      label: `Empieza en ${remaining} h`,
      color: "primary.main",
    };
  }
  return { label: "Ya ha pasado", color: "text.secondary" };
};
