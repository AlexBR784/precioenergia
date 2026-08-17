import { useState, useEffect } from "react";
import axios from "axios";

/**
 * Media de precio de los días anteriores, como referencia para poder decir si
 * el día que se está mirando es caro o barato.
 *
 * Sin esta referencia "137 €/MWh" no le dice nada a nadie: solo cobra sentido
 * comparado con lo que ha venido costando la última semana.
 *
 * La API no admite `time_trunc=day` en este endpoint (responde 400), así que se
 * piden las horas del rango completo y se promedia en cliente. Son 7 × 24 = 168
 * valores en una sola petición.
 */

const ENDPOINT =
  "https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real";

const DEFAULT_DAYS = 7;

const formatDay = (date) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/**
 * La respuesta trae dos series: PVPC (horaria) y precio del mercado spot
 * (cuartohoraria). `useEnergyCost` se queda con `included[0]`, que es la PVPC;
 * aquí se busca por título para que la comparación no dependa del orden en que
 * la API decida devolverlas.
 */
const pickPvpcSeries = (included = []) =>
  included.find((series) => /pvpc/i.test(series?.type ?? series?.attributes?.title ?? "")) ??
  included[0];

/** Clave de día local ("2026-08-16") a partir del datetime ISO con offset. */
const dayKeyOf = (isoDatetime) => formatDay(new Date(isoDatetime));

/**
 * @param {Date} referenceDate día que se está mirando; la ventana son los N días previos
 * @param {{enabled?: boolean, days?: number}} options
 * @returns {{baseline: number|null, sampleDays: number, loading: boolean, error: boolean}}
 */
export const useDailyBaseline = (
  referenceDate,
  { enabled = true, days = DEFAULT_DAYS } = {}
) => {
  const [state, setState] = useState({
    baseline: null,
    sampleDays: 0,
    loading: false,
    error: false,
  });

  // `referenceDate` es un Date nuevo en cada render de App, así que la
  // dependencia real es el día, no la identidad del objeto.
  const dayKey = referenceDate ? formatDay(referenceDate) : null;

  useEffect(() => {
    if (!enabled || !dayKey) return;

    let cancelled = false;
    const reference = new Date(`${dayKey}T12:00:00`);
    const start = formatDay(shiftDays(reference, -days));
    const end = formatDay(shiftDays(reference, -1));

    setState((prev) => ({ ...prev, loading: true, error: false }));

    axios
      .get(
        `${ENDPOINT}?start_date=${start}T00:00&end_date=${end}T23:59&time_trunc=hour`,
        { withCredentials: false, timeout: 8000 }
      )
      .then((response) => {
        if (cancelled) return;

        const values =
          pickPvpcSeries(response?.data?.included)?.attributes?.values ?? [];

        if (!values.length) {
          setState({ baseline: null, sampleDays: 0, loading: false, error: true });
          return;
        }

        // Media de medias diarias, no media de todas las horas: así los días de
        // cambio de hora (23 o 25 valores) no pesan distinto que el resto.
        const byDay = new Map();
        values.forEach((item) => {
          const key = dayKeyOf(item.datetime);
          const entry = byDay.get(key) ?? { sum: 0, count: 0 };
          entry.sum += item.value;
          entry.count += 1;
          byDay.set(key, entry);
        });

        const dailyAverages = [...byDay.values()]
          .filter((entry) => entry.count > 0)
          .map((entry) => entry.sum / entry.count);

        if (!dailyAverages.length) {
          setState({ baseline: null, sampleDays: 0, loading: false, error: true });
          return;
        }

        setState({
          baseline:
            dailyAverages.reduce((sum, value) => sum + value, 0) /
            dailyAverages.length,
          sampleDays: dailyAverages.length,
          loading: false,
          error: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Que falle la referencia no es un error de pantalla: la sección se
        // muestra igual, solo sin el veredicto comparativo.
        setState({ baseline: null, sampleDays: 0, loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [dayKey, days, enabled]);

  return state;
};

export default useDailyBaseline;
