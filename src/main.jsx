import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/es";

import App from "./App.jsx";
import ColorModeProvider from "./theme/ColorModeProvider.jsx";
import "./theme/fonts.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ColorModeProvider>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <App />
      </LocalizationProvider>
    </ColorModeProvider>
  </StrictMode>
);
