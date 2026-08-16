/* eslint-disable react/prop-types */
import { useCallback, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { createAppTheme } from "./createAppTheme";
import {
  ColorModeContext,
  readStoredPreference,
  storePreference,
} from "./colorMode";

/**
 * Provee el tema y el control de modo claro/oscuro.
 *
 * Guarda la preferencia en localStorage y resuelve "system" contra
 * `prefers-color-scheme`, de forma que cambiar el tema del SO se refleja
 * en vivo cuando el usuario no ha elegido nada explícitamente.
 */
export function ColorModeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

  const mode =
    preference === "system" ? (prefersDark ? "dark" : "light") : preference;

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    storePreference(next);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({ preference, mode, setPreference }),
    [preference, mode, setPreference]
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default ColorModeProvider;
