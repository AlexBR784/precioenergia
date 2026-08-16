/**
 * Fuente única de verdad del color y la forma de la aplicación.
 *
 * Nada de color debe escribirse a mano en un componente: todo sale de aquí,
 * se inyecta en el tema de MUI (`createAppTheme`) y se consume vía
 * `sx={{ color: 'price.cheapest' }}` o `theme.palette.*`.
 */

/** Tramos de precio, de más barato a más caro. El orden importa. */
export const PRICE_TIERS = ["cheapest", "low", "medium", "high"];

/** Etiqueta visible de cada tramo: el color nunca es el único canal. */
export const PRICE_TIER_LABELS = {
  cheapest: "Barato",
  low: "Moderado",
  medium: "Alto",
  high: "Muy alto",
};

/**
 * Clasifica un precio según su posición relativa dentro del rango del día.
 *
 * La versión anterior (`getColor` en App.jsx) usaba múltiplos del mínimo:
 * con un mínimo de 4 €/MWh, cualquier hora por encima de 8 caía en el tramo
 * más caro, así que un día normal salía entero en rojo. Como aquel color no
 * llegaba a pintarse en ninguna parte, el fallo pasaba desapercibido.
 */
export const getPriceTier = (price, minPrice, maxPrice) => {
  if (!Number.isFinite(price) || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) {
    return "medium";
  }

  const span = maxPrice - minPrice;
  // Día plano: sin variación relevante, todo cuenta como barato.
  if (span <= 0) return "cheapest";

  const position = (price - minPrice) / span;
  if (position <= 0.25) return "cheapest";
  if (position <= 0.5) return "low";
  if (position <= 0.75) return "medium";
  return "high";
};

export const palette = {
  light: {
    primary: "#0B5FFF",
    primaryDark: "#0A47B8",
    primaryLight: "#5B8DEF",
    primarySoft: "#E8F0FF",

    accent: "#FFB020",
    accentDark: "#B87A08",
    accentSoft: "#FFF4E0",

    bg: "#F8FAFC",
    paper: "#FFFFFF",
    paperMuted: "#F1F5F9",

    text: "#0B1220",
    textMuted: "#52606D",
    divider: "#E2E8F0",

    price: {
      cheapest: "#059669",
      low: "#65A30D",
      medium: "#D97706",
      high: "#DC2626",
    },
    /** Fondo tenue del mismo tramo, para chips y barras. */
    priceSoft: {
      cheapest: "#D1FAE5",
      low: "#ECFCCB",
      medium: "#FEF3C7",
      high: "#FEE2E2",
    },

    flow: {
      export: "#0B5FFF",
      import: "#D97706",
    },
    /** Relleno de los países del mapa de intercambios. */
    map: {
      land: "#E9EEF5",
      landBorder: "#CBD5E1",
      spain: "#DCE8FF",
      spainBorder: "#0B5FFF",
    },
  },

  dark: {
    primary: "#5B8DEF",
    primaryDark: "#3B6FD4",
    primaryLight: "#93B4F7",
    primarySoft: "#152A52",

    accent: "#FFC24D",
    accentDark: "#FFB020",
    accentSoft: "#3A2C10",

    bg: "#0B1220",
    paper: "#131C2E",
    paperMuted: "#1B2740",

    text: "#E8EDF5",
    textMuted: "#9AA7BA",
    divider: "#26334D",

    price: {
      cheapest: "#34D399",
      low: "#A3E635",
      medium: "#FBBF24",
      high: "#F87171",
    },
    priceSoft: {
      cheapest: "#0C3D2E",
      low: "#2A3B10",
      medium: "#3F2E0A",
      high: "#43191B",
    },

    flow: {
      export: "#7EA8FF",
      import: "#FFC24D",
    },
    map: {
      land: "#1B2740",
      landBorder: "#33415C",
      spain: "#1E3363",
      spainBorder: "#5B8DEF",
    },
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

/**
 * Sombras propias, suaves y teñidas. En oscuro casi no se ven, así que la
 * jerarquía allí la marca el borde y el color de superficie.
 */
export const shadow = {
  light: {
    sm: "0 1px 2px rgba(11, 18, 32, 0.06)",
    md: "0 4px 16px rgba(11, 18, 32, 0.08)",
    lg: "0 12px 32px rgba(11, 18, 32, 0.12)",
  },
  dark: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 4px 16px rgba(0, 0, 0, 0.5)",
    lg: "0 12px 32px rgba(0, 0, 0, 0.6)",
  },
};

/**
 * IBM Plex Sans (ver `theme/fonts.css`), con la pila del sistema de reserva
 * para el instante previo a que cargue la fuente y para cualquier carácter
 * fuera del subconjunto latino.
 */
export const fontFamily =
  '"IBM Plex Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
