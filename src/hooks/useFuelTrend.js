import { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { parseNumber } from "../features/fuel/fuelData";

const HIST_ENDPOINT =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/FiltroProvinciaProducto";

/**
 * Días hacia atrás que se consultan: uno de cada dos en las dos últimas
 * semanas. Cada día filtrado por provincia y combustible son ~27 KB (el
 * histórico sin filtrar pesa 12 MB/día y no es opción), así que siete
 * peticiones dan la tendencia por menos de 200 KB.
 */
const DAYS_BACK = [13, 11, 9, 7, 5, 3, 1];

// Lo de días pasados no cambia: caché de módulo para toda la sesión.
const cache = new Map();

/** Precio medio de las gasolineras de venta al público de un día del histórico. */
const loadDay = async (day, provinceId, productId) => {
  const key = `${provinceId}|${productId}|${day.format("YYYY-MM-DD")}`;
  if (cache.has(key)) return cache.get(key);

  // El histórico quiere la fecha con guiones: con "/" responde 404.
  const url = `${HIST_ENDPOINT}/${day.format("DD-MM-YYYY")}/${provinceId}/${productId}`;
  const request = axios
    .get(url, { withCredentials: false, timeout: 15_000, headers: { Accept: "application/json" } })
    .then((response) => {
      const prices = (response?.data?.ListaEESSPrecio ?? [])
        .filter((station) => station["Tipo Venta"] !== "R")
        .map((station) => parseNumber(station.PrecioProducto))
        .filter((price) => price != null);
      return prices.length
        ? { date: day.toDate(), average: prices.reduce((sum, p) => sum + p, 0) / prices.length }
        : null;
    })
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, request);
  return request;
};

/**
 * Evolución del precio medio de un combustible en una provincia durante las
 * dos últimas semanas, para responder a "¿lleno ahora o espero?".
 *
 * Devuelve los puntos del histórico; el de hoy lo añade quien lo usa con los
 * precios en vivo, que ya tiene cargados.
 */
export const useFuelTrend = (provinceId, productId) => {
  const [state, setState] = useState({ loading: false, points: null, error: false });

  useEffect(() => {
    if (!provinceId || !productId) {
      setState({ loading: false, points: null, error: false });
      return undefined;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: false }));

    const today = dayjs().startOf("day");
    Promise.all(DAYS_BACK.map((back) => loadDay(today.subtract(back, "day"), provinceId, productId)))
      .then((points) => {
        if (!cancelled) setState({ loading: false, points: points.filter(Boolean), error: false });
      })
      // Es un extra: si el histórico falla, la sección simplemente no aparece.
      .catch(() => !cancelled && setState({ loading: false, points: null, error: true }));

    return () => {
      cancelled = true;
    };
  }, [provinceId, productId]);

  return state;
};

export default useFuelTrend;
