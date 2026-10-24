import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  normalizeStation,
  parseUpdatedAt,
} from "../features/fuel/fuelData";

const FUEL_ENDPOINT =
  "https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroProvincia";

// Una provincia grande son ~1 MB; el servicio es lento a veces.
const TIMEOUT_MS = 20_000;

// El Ministerio actualiza varias veces al día, no minuto a minuto: quince
// minutos de caché evitan bajar otro megabyte cada vez que se vuelve a la
// pestaña (se desmonta al cambiar de sección) sin enseñar datos rancios.
const CACHE_TTL_MS = 15 * 60_000;

// Caché a nivel de módulo, por provincia. `inflight` evita dos peticiones
// idénticas si dos efectos piden lo mismo a la vez (StrictMode lo hace).
const cache = new Map();
const inflight = new Map();

const loadProvince = (provinceId, { force = false } = {}) => {
  const cached = cache.get(provinceId);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Promise.resolve(cached);
  }
  if (inflight.has(provinceId)) return inflight.get(provinceId);

  const request = axios
    .get(`${FUEL_ENDPOINT}/${provinceId}`, {
      withCredentials: false,
      timeout: TIMEOUT_MS,
      headers: { Accept: "application/json" },
    })
    .then((response) => {
      const list = response?.data?.ListaEESSPrecio;
      if (!Array.isArray(list)) throw new Error("Respuesta inesperada");

      const entry = {
        at: Date.now(),
        stations: list.map(normalizeStation),
        updatedAt: parseUpdatedAt(response.data.Fecha),
      };
      cache.set(provinceId, entry);
      return entry;
    })
    .finally(() => inflight.delete(provinceId));

  inflight.set(provinceId, request);
  return request;
};

/**
 * Gasolineras de una o varias provincias (varias para "Cerca de mí", donde la
 * más próxima puede estar al otro lado de un límite provincial).
 *
 * Devuelve las estaciones ya normalizadas y la fecha de actualización más
 * antigua de las provincias pedidas, que es la que hay que enseñar para no
 * prometer más frescura de la que hay.
 */
export const useFuelPrices = (provinceIds) => {
  const [state, setState] = useState({
    stations: [],
    updatedAt: null,
    loading: false,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);

  // La lista llega como array nuevo en cada render: se compara por contenido.
  const idsKey = (provinceIds ?? []).join(",");
  const ids = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);

  useEffect(() => {
    if (!ids.length) {
      setState({ stations: [], updatedAt: null, loading: false, error: null });
      return undefined;
    }

    let cancelled = false;
    const force = reloadToken > 0;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all(ids.map((id) => loadProvince(id, { force })))
      .then((entries) => {
        if (cancelled) return;
        const dates = entries.map((entry) => entry.updatedAt).filter(Boolean);
        setState({
          stations: entries.flatMap((entry) => entry.stations),
          updatedAt: dates.length ? new Date(Math.min(...dates)) : null,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({
          stations: [],
          updatedAt: null,
          loading: false,
          error: "No se han podido cargar las gasolineras.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [ids, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, reload };
};

export default useFuelPrices;
