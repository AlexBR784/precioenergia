import { alpha } from "@mui/material/styles";

/**
 * Fragmentos de opciones de ECharts derivados del tema de MUI.
 *
 * Los gráficos usaban antes el sans-serif por defecto de ECharts y colores
 * literales ("red", "green"), así que desentonaban con el resto de la app y
 * eran ilegibles en modo oscuro. Todo sale ahora del tema.
 */
export const getEChartsBase = (theme) => {
  const { palette } = theme;
  const axisColor = palette.text.secondary;
  const gridColor = palette.divider;

  return {
    backgroundColor: "transparent",
    textStyle: {
      fontFamily: theme.typography.fontFamily,
      color: palette.text.primary,
    },
    tooltip: {
      backgroundColor: palette.background.paper,
      borderColor: palette.divider,
      borderWidth: 1,
      textStyle: {
        color: palette.text.primary,
        fontFamily: theme.typography.fontFamily,
        fontSize: 12,
      },
      extraCssText: `border-radius:${theme.shape.borderRadius}px; box-shadow:${theme.shadows[2]};`,
    },
    axisCommon: {
      axisLine: { lineStyle: { color: gridColor } },
      axisTick: { show: false },
      axisLabel: { color: axisColor, fontSize: 11 },
      splitLine: { lineStyle: { color: gridColor, type: "dashed" } },
    },
  };
};

/**
 * ¿Debe el gráfico animarse? Respeta la preferencia de movimiento reducido
 * del sistema; las flechas del mapa y las transiciones se apagan si procede.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Color de un tramo de precio con transparencia, para áreas y rellenos. */
export const priceAlpha = (theme, tier, opacity) =>
  alpha(theme.palette.price[tier], opacity);
