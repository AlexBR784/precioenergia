import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { findRanges } from "../features/prices/cheapRanges";

const ENDPOINT =
  "https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real";

// El mercado mayorista de mañana se publica hacia mediodía y no cambia: basta
// con pedirlo de vez en cuando. La caché es de módulo porque el avance se
// enseña en dos pestañas que se desmontan al cambiar.
const CACHE_TTL_MS = 15 * 60_000;
let cache = null; // { key, at, value }
let inflight = null;

/**
 * Medias horarias de una serie cuartohoraria, agrupadas por día. Día y hora se
 * leen tal cual los publica REE (hora peninsular), igual que el PVPC: en
 * Canarias se aplican a su hora local.
 */
const hourlyByDay = (values = []) => {
  const days = new Map();
  values.forEach(({ value, datetime = "" }) => {
    const dayKey = datetime.slice(0, 10);
    const hour = Number(datetime.slice(11, 13));
    if (!days.has(dayKey)) days.set(dayKey, new Map());
    const hours = days.get(dayKey);
    const bucket = hours.get(hour) ?? { sum: 0, count: 0 };
    bucket.sum += value;
    bucket.count += 1;
    hours.set(hour, bucket);
  });

  const result = new Map();
  days.forEach((hours, dayKey) => {
    result.set(
      dayKey,
      [...hours.entries()]
        .sort(([a], [b]) => a - b)
        .map(([hour, { sum, count }]) => ({
          datetime: `${String(hour).padStart(2, "0")}:00`,
          value: sum / count,
        }))
    );
  });
  return result;
};

const average = (rows) =>
  rows.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : null;

const load = async (today) => {
  const tomorrow = today.add(1, "day");
  const url = `${ENDPOINT}?start_date=${today.format("YYYY-MM-DD")}T00:00&end_date=${tomorrow.format(
    "YYYY-MM-DD"
  )}T23:59&time_trunc=hour`;

  const response = await axios.get(url, { withCredentials: false, timeout: 10_000 });
  const included = response?.data?.included ?? [];
  const spot = included.find((item) => /spot/i.test(item?.type ?? item?.attributes?.title ?? ""));
  const pvpc = included.find((item) => /pvpc/i.test(item?.type ?? item?.attributes?.title ?? ""));

  const byDay = hourlyByDay(spot?.attributes?.values);
  const todayRows = byDay.get(today.format("YYYY-MM-DD")) ?? [];
  const tomorrowRows = byDay.get(tomorrow.format("YYYY-MM-DD")) ?? [];

  // Un día completo tiene 23-25 horas; con menos, aún no está publicado.
  if (tomorrowRows.length < 23 || !todayRows.length) {
    return { available: false };
  }

  const tomorrowKey = tomorrow.format("YYYY-MM-DD");
  const pvpcPublished = (pvpc?.attributes?.values ?? []).some(
    (item) => item.datetime?.slice(0, 10) === tomorrowKey
  );

  const todayAverage = average(todayRows);
  const tomorrowAverage = average(tomorrowRows);
  const ranges = findRanges(tomorrowRows, { hours: 3, topN: 1 });

  return {
    available: true,
    pvpcPublished,
    todayAverage,
    tomorrowAverage,
    // Con medias de hoy casi a cero (excedente solar), el % se dispara y no
    // dice nada: entonces solo se habla de "más barata" o "más cara".
    changePct:
      Math.abs(todayAverage) >= 5 ? ((tomorrowAverage - todayAverage) / Math.abs(todayAverage)) * 100 : null,
    cheapest: ranges.best[0] ?? null,
    priciest: ranges.worst,
    tomorrowRows,
  };
};

/**
 * Avance de la luz de mañana a partir del precio del mercado mayorista (spot).
 *
 * REE publica el mercado de mañana hacia mediodía, pero el PVPC no sale hasta
 * las 20:15. El PVPC sigue de cerca al mercado (le suma peajes y cargos), así
 * que comparar el mercado de mañana con el de hoy anticipa si mañana será más
 * barata o más cara y cuáles serán sus horas buenas. No son precios PVPC: la
 * interfaz lo presenta siempre como avance y en términos relativos.
 */
export const useTomorrowForecast = (enabled = true) => {
  const [state, setState] = useState(() => ({
    loading: enabled && !cache,
    forecast: cache?.value ?? null,
  }));

  useEffect(() => {
    if (!enabled) return undefined;
    const today = dayjs().startOf("day");
    const key = today.format("YYYY-MM-DD");

    if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
      setState({ loading: false, forecast: cache.value });
      return undefined;
    }

    let cancelled = false;
    inflight =
      inflight ??
      load(today)
        .then((value) => {
          cache = { key, at: Date.now(), value };
          return value;
        })
        .finally(() => {
          inflight = null;
        });

    inflight
      .then((value) => !cancelled && setState({ loading: false, forecast: value }))
      // Es un extra: si falla, simplemente no se enseña.
      .catch(() => !cancelled && setState({ loading: false, forecast: { available: false } }));

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
};

export default useTomorrowForecast;
