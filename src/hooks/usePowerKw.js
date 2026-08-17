import { useCallback, useEffect, useState } from "react";

/**
 * Potencia del aparato (kW), compartida por toda la app y persistida.
 *
 * Vivía dentro de `CheapRangesDialog`, pero la pestaña de consejos necesita el
 * mismo dato: una vez le has dicho a la calculadora que tu coche son 7,4 kW, no
 * tiene sentido que el consejo del día siga hablando de una lavadora.
 *
 * `isCustom` distingue "el usuario nunca ha tocado esto" de "ha elegido este
 * valor", que no es lo mismo aunque el número coincida: sin elección explícita
 * los consejos prefieren una carga de referencia reconocible.
 */

export const POWER_KEY = "precioenergia:power-kw";
export const DEFAULT_POWER = 2;

export const readStoredPower = () => {
  try {
    const raw = window.localStorage.getItem(POWER_KEY);
    const parsed = parseFloat(raw);
    if (raw !== null && Number.isFinite(parsed) && parsed > 0) {
      return { value: parsed, isCustom: true };
    }
  } catch {
    // Sin localStorage (modo privado, permisos) se usa el valor por defecto.
  }
  return { value: DEFAULT_POWER, isCustom: false };
};

// Quien escribe (el diálogo de la calculadora) y quien lee (la tarjeta de
// consejos "Lo que cambia en euros") son componentes distintos y hermanos, así
// que el cambio tiene que propagarse sin pasar por props ni recargar.
const listeners = new Set();

export const usePowerKw = () => {
  const [state, setState] = useState(readStoredPower);

  useEffect(() => {
    listeners.add(setState);
    // Cambio hecho en otra pestaña del navegador.
    const onStorage = (event) => {
      if (event.key === POWER_KEY) setState(readStoredPower());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(setState);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setPowerKw = useCallback((value) => {
    if (!Number.isFinite(value) || value <= 0) return;

    try {
      window.localStorage.setItem(POWER_KEY, String(value));
    } catch {
      // Persistir es opcional; el valor sigue vivo en esta sesión.
    }

    const next = { value, isCustom: true };
    listeners.forEach((listener) => listener(next));
  }, []);

  return { powerKw: state.value, isCustom: state.isCustom, setPowerKw };
};

export default usePowerKw;
