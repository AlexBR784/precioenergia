/* eslint-disable react/prop-types */
import { Box, Container } from "@mui/material";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import { BottomNav } from "./SectionNav";
import TourDialog from "../guide/TourDialog";
import OfflineNotice from "./OfflineNotice";
import SectionErrorBoundary from "./SectionErrorBoundary";
import { t } from "../i18n";

/**
 * Estructura semántica de la página: enlace de salto, <header>, <main>, <footer>
 * y, en móvil, la barra de navegación inferior.
 *
 * `<main>` lleva el nombre de la sección y se puede enfocar: al cambiar de
 * sección, App le pasa el foco para que un lector de pantalla anuncie dónde se
 * está ("Factura, principal") y el teclado siga desde el contenido nuevo.
 */
export function AppShell({ section, sectionLabel, children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        // Hueco para la barra inferior fija (68 px + borde) y la barra de
        // inicio del iPhone.
        pb: { xs: "calc(72px + env(safe-area-inset-bottom))", md: 0 },
      }}
    >
      <Box
        component="a"
        href="#contenido"
        className="skip-link"
        sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        {t("layout.skipLink")}
      </Box>

      <AppHeader section={section} />

      <Container
        component="main"
        id="contenido"
        tabIndex={-1}
        aria-label={sectionLabel}
        maxWidth="lg"
        sx={{ flexGrow: 1, py: { xs: 2, sm: 3 }, "&:focus": { outline: "none" } }}
      >
        <OfflineNotice />
        <SectionErrorBoundary resetKey={section}>{children}</SectionErrorBoundary>
      </Container>

      <AppFooter />
      <BottomNav section={section} />
      <TourDialog />
    </Box>
  );
}

export default AppShell;
