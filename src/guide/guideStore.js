import { useEffect, useState } from "react";
import { MAINTENANCE_HASH } from "../hooks/useAdmin";

/**
 * Memoria de la guía (pistas, novedades y recorrido), por dispositivo.
 *
 * Reglas, para que ayude sin estorbar:
 * - Cada pista se enseña una sola vez, y como mucho una por visita.
 * - En la primera visita, ninguna pista hasta pasados unos segundos: primero
 *   la respuesta (el precio de ahora), luego la ayuda.
 * - Si la primera visita llega por un enlace a una sección (`#/carburantes`),
 *   esa visita va sin pistas: quien llega así ya sabe a qué viene.
 * - Quien ya usaba la web antes de las novedades (tiene ajustes guardados de
 *   entonces) ve una vez la tarjeta de novedades, y esa visita va sin pistas.
 *
 * Todo se guarda en el navegador (`precioenergia:guide`); no sale de él.
 */

const KEY = "precioenergia:guide";
const SESSION_KEY = "precioenergia:session";
/** Ajustes que solo existen si se usó la web antes de las novedades. */
const LEGACY_KEYS = [
  "precioenergia:units",
  "precioenergia:color-mode",
  "precioenergia:power-kw",
  "precioenergia:fuel-prefs",
  "precioenergia:average-style",
];
/** Espera mínima en la primera visita antes de la primera pista. */
export const FIRST_VISIT_DELAY = 8000;

const readStored = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const persist = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sin localStorage la guía vive lo que dure la pestaña.
  }
};

const hasLegacySettings = () => {
  try {
    return LEGACY_KEYS.some((key) => window.localStorage.getItem(key) != null);
  } catch {
    return false;
  }
};

const startsNewSession = () => {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Sin sessionStorage cada carga cuenta como visita.
  }
  return true;
};

const stored = readStored();
let state = {
  seen: {},
  visits: 0,
  // "pending": toca enseñar las novedades; "seen" o "none": no.
  whatsNew: stored ? "none" : hasLegacySettings() ? "pending" : "none",
  ...stored,
};
if (startsNewSession()) {
  state.visits += 1;
  // Las novedades se enseñan en una sola visita: si se cerró la pestaña sin
  // pulsar "Entendido", no vuelven a salir.
  if (state.whatsNew === "pending" && state.whatsNewVisit && state.whatsNewVisit < state.visits) {
    state.whatsNew = "seen";
  }
}
persist();

/** Lo que solo vale para esta visita. */
const session = {
  startedAt: Date.now(),
  hintShown: false,
  whatsNewThisVisit: state.whatsNew === "pending",
  deepLinkFirstVisit:
    state.visits === 1 && /^#\/(consejos|factura|carburantes)/.test(window.location.hash),
  tourOpen: false,
};

const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener({ ...state, tourOpen: session.tourOpen }));

/** ¿Puede enseñarse ya esta pista? (sin contar la visibilidad del elemento) */
export const hintAllowed = (id) =>
  window.location.hash !== MAINTENANCE_HASH &&
  !state.seen[id] && !session.hintShown && !session.whatsNewThisVisit && !session.deepLinkFirstVisit;

/** Milisegundos que quedan hasta poder enseñar pistas en la primera visita. */
export const hintWait = () =>
  state.visits > 1 ? 0 : Math.max(0, FIRST_VISIT_DELAY - (Date.now() - session.startedAt));

/** Reserva la pista: queda vista para siempre y ocupa el hueco de esta visita. */
export const claimHint = (id) => {
  if (!hintAllowed(id)) return false;
  session.hintShown = true;
  state = { ...state, seen: { ...state.seen, [id]: true } };
  persist();
  notify();
  return true;
};

/** Apunta en qué visita se enseñaron las novedades. */
export const markWhatsNewShown = () => {
  if (state.whatsNew !== "pending" || state.whatsNewVisit === state.visits) return;
  state = { ...state, whatsNewVisit: state.visits };
  persist();
};

export const dismissWhatsNew = () => {
  state = { ...state, whatsNew: "seen" };
  persist();
  notify();
};

export const openTour = () => {
  session.tourOpen = true;
  notify();
};

export const closeTour = () => {
  session.tourOpen = false;
  notify();
};

export const useGuide = () => {
  const [snapshot, setSnapshot] = useState(() => ({ ...state, tourOpen: session.tourOpen }));
  useEffect(() => {
    listeners.add(setSnapshot);
    return () => listeners.delete(setSnapshot);
  }, []);
  return snapshot;
};
