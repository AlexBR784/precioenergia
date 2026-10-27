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
import InstallButton from "./InstallButton";
import LanguageMenu from "./LanguageMenu";
import AdminButton from "./AdminButton";
import { t } from "../i18n";

// La etiqueta es "Consejos" y no "Recomendaciones" por una razón medible: con
// `variant="fullWidth"` las tres pestañas se reparten ~124 px en un móvil de
// 390 px, y "Recomendaciones" partiría en dos líneas. Hubo una cuarta,
// "Intercambios" (mapa de importaciones y exportaciones con otros países), que
// se quitó: no ayudaba a un particular a gastar menos y obligaba a desplazar
// la barra en móvil.
const TABS = ["prices", "tips", "bill", "fuel"];

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
              {t("common.appName")}
            </Typography>
          </Stack>

          <AdminButton />
          <InstallButton />
          <LanguageMenu />
          <ThemeToggle />
        </Toolbar>

        <Box sx={{ px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => onTabChange(value)}
            aria-label={t("layout.sections")}
            variant="fullWidth"
            sx={{
              minHeight: 44,
              "& .MuiTabs-flexContainer": { justifyContent: { sm: "flex-start" } },
              // El padding por defecto (16 px por lado) deja "Carburantes" al
              // filo en un móvil de 375 px.
              // Con cuatro pestañas en 375 px tocan a ~86 px: sin el mínimo de
              // 90 px de MUI y con letra algo menor, "Carburantes" cabe entera.
              "& .MuiTab-root": {
                minHeight: 44,
                minWidth: 0,
                maxWidth: { sm: 180 },
                px: { xs: 0.5, sm: 2 },
                fontSize: { xs: "0.8125rem", sm: "0.875rem" },
              },
              "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
            }}
          >
            {TABS.map((value) => (
              <Tab key={value} value={value} label={t(`layout.tabs.${value}`)} />
            ))}
          </Tabs>
        </Box>
      </Container>
    </AppBar>
  );
}

export default AppHeader;
