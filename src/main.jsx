import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import App from "./App.jsx";
import ColorModeProvider from "./theme/ColorModeProvider.jsx";
import "./theme/fonts.css";
import "./index.css";
import { LANGUAGES, detectLanguage, loadLanguage } from "./i18n";
import LanguageProvider from "./i18n/LanguageProvider.jsx";


// Service worker solo en producción: en desarrollo cachearía lo que Vite
// recarga en caliente. Si el navegador no lo admite, la web funciona igual.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}

// El diccionario del idioma se carga antes de pintar (el castellano ya va en
// el paquete; los demás son un archivo aparte). El título con la fecha lo pone
// `useLiveTitle` en el idioma elegido.
loadLanguage(detectLanguage()).then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <ColorModeProvider>
        <LanguageProvider>
          {(language) => (
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={LANGUAGES[language].dayjs}>
              {/* key: al cambiar de idioma se vuelve a montar todo con los textos nuevos. */}
              <App key={language} />
            </LocalizationProvider>
          )}
        </LanguageProvider>
      </ColorModeProvider>
    </StrictMode>
  );
});
