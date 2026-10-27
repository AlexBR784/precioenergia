/**
 * Fuente única de verdad del color y la forma de la aplicación.
 *
 * Nada de color debe escribirse a mano en un componente: todo sale de aquí,
 * se inyecta en el tema de MUI (`createAppTheme`) y se consume vía
 * `sx={{ color: 'price.cheapest' }}` o `theme.palette.*`.
 */

import { t } from "../i18n";

/** Tramos de precio, de más barato a más caro. El orden importa. */
export const PRICE_TIERS = ["cheapest", "low", "medium", "high"];

/**
 * Etiqueta visible de cada tramo: el color nunca es el único canal. Son
 * getters para que salgan en el idioma activo.
 */
export const PRICE_TIER_LABELS = {
  get cheapest() {
    return t("common.tiers.cheapest");
  },
  get low() {
    return t("common.tiers.low");
  },
  get medium() {
    return t("common.tiers.medium");
  },
  get high() {
    return t("common.tiers.high");
  },
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

/**
 * Paleta sobria con la mascota como único acento.
 *
 * Regla 60-30-10: superficies neutras (gris frío casi blanco / gris pizarra
 * oscuro) para el 60 %, la tinta azul marino del contorno de la mascota para
 * texto y acciones (30 %) y el dorado como acento puntual (10 %): banda de la
 * mejor franja, foco en oscuro, el propio personaje. Nada de fondos amarillos
 * grandes ni tonos saturados: una herramienta de precios tiene que transmitir
 * fiabilidad, y el color llamativo se reserva para lo que pide atención.
 *
 * El amarillo puro de la mascota (#FFD60A) no aparece en la interfaz: se usa
 * un dorado apagado de la misma familia, para que el personaje sea lo único
 * que brilla.
 *
 * Los tramos de precio van de frío a caliente (verde azulado → azul acero →
 * ocre → teja), desaturados para que se lean sin gritar y sin pasar por el
 * verde lima, que choca con el amarillo de la mascota. Lo que significa cada
 * tramo lo dice siempre su etiqueta, no el color.
 */
export const palette = {
  light: {
    primary: "#1F2A3C",
    primaryDark: "#121A27",
    primaryLight: "#475569",
    /** Gris azulado muy tenue: tarjeta destacada y selección. */
    primarySoft: "#EEF1F5",

    accent: "#D9A92E",
    accentDark: "#B8891A",
    accentSoft: "#FBF3DC",

    info: "#3C5A85",

    bg: "#F6F7F9",
    paper: "#FFFFFF",
    paperMuted: "#F1F3F5",

    text: "#161B22",
    textMuted: "#5A6472",
    divider: "#E3E6EA",

    price: {
      cheapest: "#2B7A78",
      low: "#4A7BA7",
      medium: "#B7791F",
      high: "#B83A3A",
    },
    /** Fondo tenue del mismo tramo, para chips y barras. */
    priceSoft: {
      cheapest: "#E3F0EF",
      low: "#E6EEF6",
      medium: "#F7EEDD",
      high: "#F7E4E2",
    },
  },

  dark: {
    // En oscuro el dorado sí contrasta (10:1) y es el color de acción.
    primary: "#E2C25B",
    primaryDark: "#C9A845",
    primaryLight: "#EED68A",
    primarySoft: "#20252D",

    accent: "#D9B44A",
    accentDark: "#C29B33",
    accentSoft: "#2A2619",

    info: "#8FA9CC",

    bg: "#0F1216",
    paper: "#161A20",
    paperMuted: "#1D222A",

    text: "#E7E9EC",
    textMuted: "#9AA3AF",
    divider: "#2A3039",

    price: {
      cheapest: "#5FB3AD",
      low: "#7FA6CC",
      medium: "#D9A55A",
      high: "#D97A73",
    },
    priceSoft: {
      cheapest: "#17302F",
      low: "#1A2735",
      medium: "#33291A",
      high: "#362020",
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
    sm: "0 1px 2px rgba(22, 27, 34, 0.07)",
    md: "0 4px 16px rgba(22, 27, 34, 0.09)",
    lg: "0 12px 32px rgba(22, 27, 34, 0.14)",
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
