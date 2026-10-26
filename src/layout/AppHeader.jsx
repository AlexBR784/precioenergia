/* eslint-disable react/prop-types */
import {
  AppBar,
  Box,
  Container,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import Mascot from "../components/Mascot";
import ThemeToggle from "./ThemeToggle";

// La etiqueta es "Consejos" y no "Recomendaciones" por una razón medible: con
// `variant="fullWidth"` las tres pestañas se reparten ~124 px en un móvil de
// 390 px, y "Recomendaciones" partiría en dos líneas. Hubo una cuarta,
// "Intercambios" (mapa de importaciones y exportaciones con otros países), que
// se quitó: no ayudaba a un particular a gastar menos y obligaba a desplazar
// la barra en móvil.
const TABS = [
  { value: "prices", label: "Precios" },
  { value: "tips", label: "Consejos" },
  { value: "fuel", label: "Carburantes" },
];

/**
 * Cabecera fija con la marca, la navegación entre pestañas y el selector de tema.
 * Antes la app arrancaba directamente con unos Tabs pegados al borde superior,
 * sin <header> ni <h1>: el primer encabezado del documento era un h6.
 */
export function AppHeader({ activeTab, onTabChange }) {
  return (
    <AppBar
      component="header"
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.85),
        backdropFilter: "blur(8px)",
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{ gap: 1, minHeight: { xs: 60, sm: 68 }, px: { xs: 2, sm: 3 } }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            {/* Reacciona al cambiar de pestaña: vuelve a saltar y a dar el pulgar.
                El salto sube ~16 % de su alto y gira un poco, así que la barra
                deja holgura por encima (12 px) para que no se salga de la página. */}
            <Mascot size={{ xs: 36, sm: 44 }} playKey={activeTab} />
            <Typography variant="h1" noWrap sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>
              Precio de la luz
            </Typography>
          </Stack>

          <ThemeToggle />
        </Toolbar>

        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => onTabChange(value)}
            aria-label="Secciones de la aplicación"
            variant="fullWidth"
            sx={{
              minHeight: 44,
              "& .MuiTabs-flexContainer": { justifyContent: { sm: "flex-start" } },
              // El padding por defecto (16 px por lado) deja "Carburantes" al
              // filo en un móvil de 375 px.
              "& .MuiTab-root": {
                minHeight: 44,
                maxWidth: { sm: 180 },
                px: { xs: 1, sm: 2 },
              },
              "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            {TABS.map(({ value, label }) => (
              <Tab key={value} value={value} label={label} />
            ))}
          </Tabs>
        </Box>
      </Container>
    </AppBar>
  );
}

export default AppHeader;
