/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getPriceTier, PRICE_TIER_LABELS } from "../theme/tokens";
import { hourOf } from "../hooks/usePriceStats";

const TICKS = [0, 6, 12, 18, 24];

/**
 * Resumen textual del día para lectores de pantalla: agrupa horas
 * consecutivas del mismo tramo en frases del tipo "barato de 10:00 a 16:00".
 */
const describeDay = (hours) => {
  if (!hours.length) return "Sin datos del día.";

  const blocks = [];
  let current = { tier: hours[0].tier, from: hourOf(hours[0].datetime) };

  hours.forEach((item, index) => {
    const hour = hourOf(item.datetime);
    if (item.tier !== current.tier) {
      blocks.push({ ...current, to: hour });
      current = { tier: item.tier, from: hour };
    }
    if (index === hours.length - 1) {
      blocks.push({ ...current, to: hour + 1 });
    }
  });

  return blocks
    .map(
      (block) =>
        `${PRICE_TIER_LABELS[block.tier].toLowerCase()} de ${String(block.from).padStart(2, "0")}:00 a ${String(block.to % 24).padStart(2, "0")}:00`
    )
    .join("; ");
};

/**
 * Franja horizontal con un segmento por hora, coloreada con la misma escala
 * de tramos que la tabla de precios, y la ventana recomendada recuadrada.
 *
 * Es una barra de N segmentos: se dibuja con CSS, sin ECharts.
 */
export function DayTimeline({ energyCost, range, isToday }) {
  const { hours, description } = useMemo(() => {
    if (!energyCost?.length) return { hours: [], description: "" };

    const values = energyCost.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const withTier = energyCost.map((item) => ({
      ...item,
      tier: getPriceTier(item.value, min, max),
    }));

    return { hours: withTier, description: describeDay(withTier) };
  }, [energyCost]);

  if (!hours.length) return null;

  const currentHour = new Date().getHours();
  const total = hours.length;

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        role="img"
        aria-label={`Precio a lo largo del día: ${description}.`}
        sx={{ position: "relative", display: "flex", gap: "2px", height: 34 }}
      >
        {hours.map((item) => {
          const hour = hourOf(item.datetime);
          const inRange =
            range && hour >= range.startHour && hour < range.endHour;

          return (
            <Box
              key={item.datetime}
              aria-hidden="true"
              sx={{
                flex: 1,
                borderRadius: 0.75,
                bgcolor: `price.${item.tier}`,
                // Fuera de la ventana el color baja de intensidad para que la
                // recomendación destaque sin perder la forma del día.
                opacity: !range || inRange ? 1 : 0.45,
                transition: "opacity .15s ease",
              }}
            />
          );
        })}

        {/* Recuadro de la ventana recomendada */}
        {range && (
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: -4,
              bottom: -4,
              left: `${(range.startHour / total) * 100}%`,
              width: `${((range.endHour - range.startHour) / total) * 100}%`,
              border: 2,
              borderColor: "primary.main",
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              pointerEvents: "none",
            }}
          />
        )}

        {/* Hora actual */}
        {isToday && (
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: -7,
              bottom: -7,
              left: `${(currentHour / total) * 100}%`,
              width: "2px",
              bgcolor: "text.primary",
              borderRadius: 1,
            }}
          />
        )}
      </Box>

      <Box
        aria-hidden="true"
        sx={{ position: "relative", height: 16, mt: 1.25 }}
      >
        {TICKS.map((tick) => (
          <Typography
            key={tick}
            variant="caption"
            sx={{
              position: "absolute",
              left: `${(tick / 24) * 100}%`,
              transform:
                tick === 0
                  ? "none"
                  : tick === 24
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
              color: "text.secondary",
              fontSize: "0.6875rem",
            }}
          >
            {/* La última marca es el final del día: "24:00", no "00:00". */}
            {String(tick).padStart(2, "0")}:00
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default DayTimeline;
