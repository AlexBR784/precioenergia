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
import BoltIcon from "@mui/icons-material/Bolt";
import ThemeToggle from "./ThemeToggle";

const TABS = [
  { value: "prices", label: "Precios" },
  { value: "interchanges", label: "Intercambios" },
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
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(19, 28, 46, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar
          sx={{ gap: 1, minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            <BoltIcon sx={{ color: "secondary.main" }} aria-hidden="true" />
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
              "& .MuiTab-root": { minHeight: 44, maxWidth: { sm: 180 } },
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
