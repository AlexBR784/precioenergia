import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const ENDPOINT = "https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real";

/**
 * REE no acepta más de un mes por petición con detalle horario (con rangos más
 * largos responde 400, y `time_trunc=day/month` tampoco existe en este
 * endpoint), así que los rangos largos se piden por trozos de 28 días.
 */
const CHUNK_DAYS = 28;

// Los días pasados no cambian: caché de módulo por trozo durante la sesión.
const cache = new Map();

const loadChunk = (start, end) => {
  const key = `${start}|${end}`;
  if (cache.has(key)) return cache.get(key);

  const request = axios
    .get(`${ENDPOINT}?start_date=${start}T00:00&end_date=${end}T23:59&time_trunc=hour`, {
      withCredentials: false,
      timeout: 20_000,
    })
    .then((response) => {
      const series = (response?.data?.included ?? []).find((item) =>
        /pvpc/i.test(item?.type ?? item?.attributes?.title ?? "")
      );
      // Día y hora tal cual los publica REE: el PVPC se aplica en hora local.
      return (series?.attributes?.values ?? []).map(({ value, datetime = "" }) => ({
        date: datetime.slice(0, 10),
        hour: Number(datetime.slice(11, 13)),
        value,
      }));
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, request);
  return request;
};

/**
 * Precios PVPC horarios (€/MWh, sin impuestos) entre dos días incluidos:
 * `[{ date: "2026-10-01", hour: 0..23, value }]`.
 */
export const fetchPvpcRange = async (startDate, endDate) => {
  const chunks = [];
  let cursor = dayjs(startDate).startOf("day");
  const last = dayjs(endDate).startOf("day");
  while (!cursor.isAfter(last)) {
    const chunkEnd = cursor.add(CHUNK_DAYS - 1, "day");
    const end = chunkEnd.isAfter(last) ? last : chunkEnd;
    chunks.push([cursor.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")]);
    cursor = end.add(1, "day");
  }
  const parts = await Promise.all(chunks.map(([start, end]) => loadChunk(start, end)));
  return parts.flat();
};

/** Media simple de una lista de precios horarios (€/MWh), o null. */
export const averageOf = (rows) =>
  rows?.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : null;

/**
 * Hook sobre `fetchPvpcRange`. `start`/`end` son "YYYY-MM-DD"; con
 * `enabled = false` no pide nada (para cargar solo cuando hace falta).
 */
export const usePvpcRange = (start, end, enabled = true) => {
  const [state, setState] = useState({ loading: false, rows: null, error: false });

  useEffect(() => {
    if (!enabled || !start || !end) return undefined;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    fetchPvpcRange(start, end)
      .then((rows) => !cancelled && setState({ loading: false, rows, error: false }))
      .catch(() => !cancelled && setState({ loading: false, rows: null, error: true }));
    return () => {
      cancelled = true;
    };
  }, [start, end, enabled]);

  return state;
};

export default usePvpcRange;
