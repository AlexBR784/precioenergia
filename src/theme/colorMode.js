import { createContext, useContext } from "react";

export const STORAGE_KEY = "precioenergia:color-mode";

/** Preferencias que el usuario puede elegir. `system` sigue al sistema operativo. */
export const COLOR_MODE_OPTIONS = ["light", "dark", "system"];

export const ColorModeContext = createContext({
  /** Preferencia elegida: "light" | "dark" | "system" */
  preference: "system",
  /** Modo realmente aplicado tras resolver "system": "light" | "dark" */
  mode: "light",
  setPreference: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export const readStoredPreference = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return COLOR_MODE_OPTIONS.includes(stored) ? stored : "system";
  } catch {
    // Modo privado o almacenamiento bloqueado: se cae a la preferencia del sistema.
    return "system";
  }
};

export const storePreference = (preference) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Persistir es opcional; si falla, el modo sigue funcionando en esta sesión.
  }
};
