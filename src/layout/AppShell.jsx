/* eslint-disable react/prop-types */
import { Box, Container } from "@mui/material";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

/**
 * Estructura semántica de la página: enlace de salto, <header>, <main> y <footer>,
 * con el contenido acotado a un ancho legible. Antes no había landmarks y el
 * contenido se estiraba de borde a borde en pantallas grandes.
 */
export function AppShell({ activeTab, onTabChange, children }) {
  return (
    <Box
      sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Box
        component="a"
        href="#contenido"
        className="skip-link"
        sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}
      >
        Saltar al contenido
      </Box>

      <AppHeader activeTab={activeTab} onTabChange={onTabChange} />

      <Container
        component="main"
        id="contenido"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: { xs: 2, sm: 3 } }}
      >
        {children}
      </Container>

      <AppFooter />
    </Box>
  );
}

export default AppShell;
