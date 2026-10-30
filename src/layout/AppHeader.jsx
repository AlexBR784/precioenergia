/* eslint-disable react/prop-types */
import { AppBar, Box, Container, Stack, Toolbar, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Mascot from "../components/Mascot";
import ThemeToggle from "./ThemeToggle";
import InstallButton from "./InstallButton";
import LanguageMenu from "./LanguageMenu";
import AdminButton from "./AdminButton";
import { HeaderNav } from "./SectionNav";
import { t } from "../i18n";
import { rich } from "../i18n/rich";

/**
 * Cabecera fija con la marca, la navegación (en escritorio) y los ajustes
 * generales. En móvil la navegación va abajo (`BottomNav`), al alcance del
 * pulgar, y la cabecera se queda en una sola fila.
 *
 * Antes eran pestañas (`role="tablist"`) en una segunda fila: semántica de
 * paneles de un mismo contenido, sin dirección propia por sección y, en móvil,
 * 44 px más de cabecera en la zona más difícil de alcanzar.
 */
export function AppHeader({ section }) {
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
        <Toolbar sx={{ gap: 1, minHeight: { xs: 60, sm: 68 }, px: { xs: 2, sm: 3 } }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: { xs: 1, md: 0 }, flexShrink: 0, minWidth: 0 }}
          >
            <Mascot size={{ xs: 36, sm: 40 }} />
            {/* El logotipo (design/marca): peso medio y la palabra clave en negrita. */}
            <Typography
              variant="h1"
              noWrap
              sx={{ fontSize: { xs: "1.0625rem", sm: "1.25rem" }, fontWeight: 500, letterSpacing: "-0.02em" }}
            >
              {rich(
                t("layout.brand", {
                  strong: (text) => (
                    <Box component="strong" key="brand" sx={{ fontWeight: 700 }}>
                      {text}
                    </Box>
                  ),
                })
              )}
            </Typography>
          </Stack>

          <HeaderNav section={section} />

          <AdminButton />
          <InstallButton />
          <LanguageMenu />
          <ThemeToggle />
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default AppHeader;
