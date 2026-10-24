import { useCallback, useState } from "react";
import { DEFAULT_FUEL, FUELS } from "../features/fuel/fuelData";

/**
 * Preferencias de la pestaña de carburantes, persistidas. Como la pestaña se
 * desmonta al cambiar de sección, sin esto el usuario tendría que volver a
 * elegir provincia y combustible cada vez que mirase la luz y volviese.
 */

export const FUEL_PREFS_KEY = "precioenergia:fuel-prefs";

export const MODES = { AREA: "area", NEARBY: "nearby" };
export const RADIUS_OPTIONS = [5, 10, 25, 50];

export const DEFAULT_PREFS = {
  mode: MODES.AREA,
  provinceId: "",
  municipalityId: "",
  fuel: DEFAULT_FUEL,
  liters: 50,
  radiusKm: 10,
};

const sanitize = (raw) => {
  const prefs = { ...DEFAULT_PREFS };
  if (!raw || typeof raw !== "object") return prefs;

  if (Object.values(MODES).includes(raw.mode)) prefs.mode = raw.mode;
  if (typeof raw.provinceId === "string") prefs.provinceId = raw.provinceId;
  if (typeof raw.municipalityId === "string") prefs.municipalityId = raw.municipalityId;
  if (raw.fuel in FUELS) prefs.fuel = raw.fuel;
  if (Number.isFinite(raw.liters) && raw.liters > 0 && raw.liters <= 500) {
    prefs.liters = raw.liters;
  }
  if (RADIUS_OPTIONS.includes(raw.radiusKm)) prefs.radiusKm = raw.radiusKm;
  return prefs;
};

const readPrefs = () => {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(FUEL_PREFS_KEY)));
  } catch {
    // Sin localStorage (modo privado, permisos) o JSON corrupto: valores por defecto.
    return { ...DEFAULT_PREFS };
  }
};

export const useFuelPrefs = () => {
  const [prefs, setPrefs] = useState(readPrefs);

  const updatePrefs = useCallback((patch) => {
    setPrefs((prev) => {
      const next = sanitize({ ...prev, ...patch });
      try {
        window.localStorage.setItem(FUEL_PREFS_KEY, JSON.stringify(next));
      } catch {
        // Persistir es opcional; la preferencia sigue viva en esta sesión.
      }
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
};

export default useFuelPrefs;
