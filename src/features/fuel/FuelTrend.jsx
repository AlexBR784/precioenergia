/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

import { useFuelTrend } from "../../hooks/useFuelTrend";
import { formatEuros } from "../prices/priceFormat";
import { summarizeTrend } from "./fuelData";
import { formatLiterPrice, LITER_UNITS } from "./fuelFormat";

const VERDICTS = {
  down: { title: "Bajando: si no tienes prisa, espera unos días", color: "price.cheapest", Icon: TrendingDownIcon },
  up: { title: "Subiendo: mejor llena ahora", color: "price.high", Icon: TrendingUpIcon },
  flat: { title: "Estable: llena cuando te venga bien", color: "text.secondary", Icon: TrendingFlatIcon },
};

/** La línea se descubre de izquierda a derecha, una sola vez. */
const reveal = keyframes`
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
`;

const shortDate = (date) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);

const cents = (euros) =>
  `${Math.abs(euros * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })} céntimos`;

/** "1,529 €/L, 2,1 céntimos menos que hace dos semanas (50 L: 1,05 € menos)". */
const comparison = (trend, liters) => {
  const { change } = trend;
  if (Math.abs(change) < 0.001) return "casi igual que hace dos semanas";
  const word = change < 0 ? "menos" : "más";
  return `${cents(change)} ${word} por litro que hace dos semanas (${formatEuros(
    Math.abs(change) * liters
  )} ${word} al llenar ${liters.toLocaleString("es-ES")} L)`;
};

/**
 * Minigráfica del precio medio. La línea se estira al ancho disponible
 * (`preserveAspectRatio="none"` con trazo que no escala) y el punto de hoy va
 * en HTML para que no se deforme.
 */
function Sparkline({ trend, color }) {
  const { points, min, max } = trend;
  const padding = Math.max((max - min) * 0.15, 0.002);
  const low = min - padding;
  const high = max + padding;
  const start = points[0].date.getTime();
  const span = points[points.length - 1].date.getTime() - start || 1;

  const coords = points.map((point) => [
    ((point.date.getTime() - start) / span) * 100,
    (1 - (point.average - low) / (high - low)) * 100,
  ]);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,100 ${line} 100,100`;
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <Box
      role="img"
      aria-label={`Precio medio de ${formatLiterPrice(points[0].average)} ${LITER_UNITS} el ${shortDate(
        points[0].date
      )} a ${formatLiterPrice(trend.last.average)} ${LITER_UNITS} hoy.`}
      sx={{ width: "100%" }}
    >
      <Box
        sx={{
          position: "relative",
          height: 72,
          // Que el punto de hoy no quede cortado por el borde.
          mx: "6px",
          color,
          animation: `${reveal} 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          aria-hidden="true"
          style={{ display: "block", overflow: "visible" }}
        >
          <polygon points={area} fill="currentColor" opacity="0.1" />
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: `${lastX}%`,
            top: `${lastY}%`,
            width: 10,
            height: 10,
            ml: "-5px",
            mt: "-5px",
            borderRadius: "50%",
            bgcolor: "currentColor",
            boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.background.paper, 1)}`,
          }}
        />
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
        <Typography variant="caption" color="text.secondary" className="tabular">
          {shortDate(points[0].date)} · {formatLiterPrice(points[0].average)}
        </Typography>
        <Typography variant="caption" className="tabular" sx={{ fontWeight: 700 }}>
          Hoy · {formatLiterPrice(trend.last.average)}
        </Typography>
      </Stack>
    </Box>
  );
}

/**
 * "¿Lleno ahora o espero?": cómo ha ido el precio medio de la provincia en las
 * dos últimas semanas y qué hacer con eso.
 *
 * Compara siempre medias de provincia (el histórico del Ministerio va por
 * provincia), así que el punto de hoy es la media de toda la provincia y no la
 * de la zona filtrada. Es la tendencia reciente, no una predicción, y la nota
 * lo dice. Si el histórico no carga, la tarjeta no aparece.
 */
export function FuelTrend({ provinceId, provinceLabel, productId, todayAverage, liters }) {
  const { points } = useFuelTrend(provinceId, productId);

  const trend = useMemo(() => {
    if (!points?.length || !Number.isFinite(todayAverage)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return summarizeTrend([...points, { date: today, average: todayAverage }]);
  }, [points, todayAverage]);

  if (!trend) return null;

  const verdict = VERDICTS[trend.direction];
  const { Icon } = verdict;

  return (
    <Card component="section" aria-labelledby="fuel-trend-heading">
      <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 4 }}
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: verdict.color }}>
              <Icon sx={{ fontSize: 18 }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                ¿Lleno ahora o espero?
              </Typography>
            </Stack>
            <Typography variant="h2" component="h2" id="fuel-trend-heading" sx={{ mt: 0.75 }}>
              {verdict.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              La media en {provinceLabel} está hoy a{" "}
              <Box component="span" className="tabular" sx={{ color: "text.primary", fontWeight: 600 }}>
                {formatLiterPrice(trend.last.average)} {LITER_UNITS}
              </Box>
              , {comparison(trend, liters)}.
            </Typography>
          </Box>

          <Box sx={{ flexShrink: 0, width: { xs: "100%", md: 300 } }}>
            <Sparkline trend={trend} color={verdict.color} />
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          Media de las gasolineras de {provinceLabel} en los últimos 14 días. Es la tendencia
          reciente, no una predicción.
        </Typography>
      </CardContent>
    </Card>
  );
}

export default FuelTrend;
