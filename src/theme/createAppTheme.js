import { createTheme, alpha } from "@mui/material/styles";
import { palette, radius, shadow, fontFamily } from "./tokens";

/**
 * Construye el tema de MUI para un modo concreto.
 *
 * Además de la paleta estándar expone dos claves propias, `price` y `flow`,
 * de modo que los componentes puedan escribir `sx={{ color: 'price.high' }}`
 * en vez de literales hex.
 */
export const createAppTheme = (mode = "light") => {
  const t = palette[mode] ?? palette.light;
  const isDark = mode === "dark";
  const shadows = isDark ? shadow.dark : shadow.light;

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        dark: t.primaryDark,
        light: t.primaryLight,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: t.accent,
        dark: t.accentDark,
        contrastText: isDark ? "#0B1220" : "#3A2C10",
      },
      success: { main: t.price.cheapest },
      warning: { main: t.price.medium },
      error: { main: t.price.high },
      info: { main: t.primary },
      background: {
        default: t.bg,
        paper: t.paper,
      },
      text: {
        primary: t.text,
        secondary: t.textMuted,
      },
      divider: t.divider,

      // Claves propias
      price: t.price,
      priceSoft: t.priceSoft,
      flow: t.flow,
      map: t.map,
      surfaceMuted: t.paperMuted,
      primarySoft: t.primarySoft,
      accentSoft: t.accentSoft,
    },

    shape: { borderRadius: radius.md },

    typography: {
      fontFamily,
      h1: { fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em" },
      h3: { fontSize: "1rem", fontWeight: 600 },
      subtitle2: {
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      },
      body2: { fontSize: "0.875rem" },
      caption: { fontSize: "0.75rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.bg,
            color: t.text,
          },
          // Foco visible y consistente en toda la app: antes no había ninguno propio.
          "*:focus-visible": {
            outline: `2px solid ${t.primary}`,
            outlineOffset: 2,
            borderRadius: 4,
          },
          // Las cifras no deben bailar al actualizarse.
          ".tabular": { fontVariantNumeric: "tabular-nums" },
        },
      },

      MuiTypography: {
        defaultProps: {
          // `subtitle2` se usa para etiquetas (KPIs, secciones de panel), no
          // para encabezados. Sin esto MUI las renderiza como <h6> y rompen
          // la jerarquía del documento (h1 → h6 → h2).
          variantMapping: {
            subtitle1: "div",
            subtitle2: "div",
            body1: "p",
            body2: "p",
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },

      MuiCard: {
        defaultProps: { variant: "outlined" },
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            borderColor: t.divider,
            boxShadow: shadows.sm,
          },
        },
      },

      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 20,
            "&:last-child": { paddingBottom: 20 },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: t.divider,
            paddingTop: 10,
            paddingBottom: 10,
          },
          head: {
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: t.textMuted,
            backgroundColor: t.paperMuted,
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color .15s ease",
            "&:hover": { backgroundColor: alpha(t.primary, isDark ? 0.1 : 0.04) },
            "&:last-child td, &:last-child th": { border: 0 },
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: radius.sm },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            textTransform: "none",
            fontWeight: 600,
            borderColor: t.divider,
            "&.Mui-selected": {
              backgroundColor: alpha(t.primary, isDark ? 0.22 : 0.1),
              color: isDark ? t.primaryLight : t.primaryDark,
              "&:hover": { backgroundColor: alpha(t.primary, isDark ? 0.3 : 0.16) },
            },
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: radius.md, alignItems: "center" },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.sm, fontWeight: 600 },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            minHeight: 48,
          },
        },
      },

      MuiTooltip: {
        defaultProps: { arrow: true },
        styleOverrides: {
          tooltip: { borderRadius: radius.sm, fontSize: "0.75rem" },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radius.lg, backgroundImage: "none" },
          // A pantalla completa no puede haber esquinas redondeadas: el
          // override de `paper` pisaba el `borderRadius: 0` que MUI aplica a
          // paperFullScreen, así que se veía el fondo de la página asomando
          // por las cuatro esquinas.
          paperFullScreen: {
            borderRadius: 0,
            // Zona segura del dispositivo (notch, barra de estado, barra de
            // gestos). Vale 0 en navegador normal y solo entra en juego con
            // `viewport-fit=cover` o con la app instalada como PWA.
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            paddingLeft: "env(safe-area-inset-left)",
            paddingRight: "env(safe-area-inset-right)",
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: radius.sm },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: radius.pill, height: 10 },
          bar: { borderRadius: radius.pill },
        },
      },
    },
  });

  // Sombras propias en los tres primeros niveles; el resto se deja el de MUI.
  theme.shadows[1] = shadows.sm;
  theme.shadows[2] = shadows.md;
  theme.shadows[3] = shadows.lg;

  return theme;
};

export default createAppTheme;
