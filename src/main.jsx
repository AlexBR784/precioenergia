import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

import App from "./App.jsx";
import ColorModeProvider from "./theme/ColorModeProvider.jsx";
import "./theme/fonts.css";
import "./index.css";

// Título con la fecha ("Precio de la luz · 24 de octubre"). Vivía en un
// <script> en línea del index.html, que la política de seguridad de contenido
// (ver vite.config.js) ya no permite.
document.title = `Precio de la luz · ${new Date().toLocaleDateString("es-ES", {
  month: "long",
  day: "numeric",
})}`;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ColorModeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <App />
      </LocalizationProvider>
    </ColorModeProvider>
  </StrictMode>
);
