/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import CalendarIcon from "@mui/icons-material/CalendarViewWeekOutlined";
import LuggageIcon from "@mui/icons-material/LuggageOutlined";

import { fetchFuelDays, useFuelTrend } from "../../hooks/useFuelTrend";
import { upcomingTravelPeak } from "../../utils/holidays";
import { formatEuros } from "../prices/priceFormat";
import { cheapestWeekday, summarizeTrend } from "./fuelData";
import { formatLiterPrice, LITER_UNITS } from "./fuelFormat";
import { t } from "../../i18n";
import { formatDate, formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";

const VERDICTS = {
  down: { color: "price.cheapest", Icon: TrendingDownIcon },
  up: { color: "price.high", Icon: TrendingUpIcon },
  flat: { color: "text.secondary", Icon: TrendingFlatIcon },
};

/** La línea se descubre de izquierda a derecha, una sola vez. */
const reveal = keyframes`
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
`;

const shortDate = (date) => formatDate(date, { day: "numeric", month: "short" });

const cents = (euros) => formatNumber(Math.abs(euros * 100), { maximumFractionDigits: 1 });

/** "2,1 céntimos menos por litro que hace dos semanas (1,05 € menos al llenar 50 L)". */
const comparison = (trend, liters) => {
  const { change } = trend;
  if (Math.abs(change) < 0.001) return t("fuel.trend.almostSame");
  return t("fuel.trend.change", {
    cents: cents(change),
    cheaper: change < 0,
    amount: formatEuros(Math.abs(change) * liters),
    liters: formatNumber(liters),
  });
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
      aria-label={t("fuel.trend.sparkAria", {
        from: formatLiterPrice(points[0].average),
        to: formatLiterPrice(trend.last.average),
        units: LITER_UNITS,
        date: shortDate(points[0].date),
      })}
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
          {t("fuel.trend.today", { price: formatLiterPrice(trend.last.average) })}
        </Typography>
      </Stack>
    </Box>
  );
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
// Inicial del día en el idioma activo ("L", "M"… en castellano usa "X" para el miércoles).
const shortDay = (day) => t(`fuel.trend.shortDays.${day}`);
const centsText = (euros) => formatNumber(Math.abs(euros * 100), { maximumFractionDigits: 1 });

/**
 * "¿Qué día de la semana sale más barato?": en España se repite que los lunes,
 * pero varía por provincia. Se comprueba con las cuatro últimas semanas del
 * histórico, bajo demanda (son 28 peticiones pequeñas).
 */
function WeekdayInsight({ provinceId, productId, provinceLabel }) {
  const [state, setState] = useState({ loading: false, result: undefined });

  const analyze = async () => {
    setState({ loading: true, result: undefined });
    try {
      const points = await fetchFuelDays(provinceId, productId, 28);
      setState({ loading: false, result: cheapestWeekday(points) });
    } catch {
      setState({ loading: false, result: null });
    }
  };

  if (state.result === undefined) {
    return (
      <Button
        size="small"
        startIcon={state.loading ? <CircularProgress size={14} color="inherit" /> : <CalendarIcon />}
        onClick={analyze}
        disabled={state.loading || !provinceId}
        sx={{ ml: -0.5 }}
      >
        {state.loading ? t("fuel.trend.weekdayLoading") : t("fuel.trend.weekdayButton")}
      </Button>
    );
  }

  if (!state.result) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("fuel.trend.weekdayNoData")}
      </Typography>
    );
  }

  const { byDay, cheapest, priciest, spread } = state.result;
  const max = Math.max(...byDay.map((entry) => Math.abs(entry.delta)), 0.0005);

  return (
    <Box>
      <Typography variant="body2">
        {spread < 0.003
          ? t("fuel.trend.weekdayFlat", { province: provinceLabel })
          : rich(
              t("fuel.trend.weekdayResult", {
                province: provinceLabel,
                cheapest: <strong>{cheapest.name}</strong>,
                cents: centsText(cheapest.delta),
                priciest: <strong>{priciest.name}</strong>,
              })
            )}
      </Typography>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        role="img"
        aria-label={byDay
          .map((entry) => t("fuel.trend.weekdayAria", { day: entry.name, cheaper: entry.delta < 0, cents: centsText(entry.delta) }))
          .join(", ")}
        sx={{ mt: 1.25 }}
      >
        {WEEK_ORDER.map((day) => {
          const entry = byDay.find((item) => item.day === day);
          const bar = (
            <Box
              sx={{
                height: 2 + (Math.abs(entry.delta) / max) * 22,
                width: "100%",
                borderRadius: "3px",
                bgcolor: day === cheapest.day ? "price.cheapest" : day === priciest.day ? "price.high" : "text.disabled",
              }}
            />
          );
          return (
            <Stack key={day} alignItems="center" spacing={0.5} sx={{ flex: 1, maxWidth: 40 }} aria-hidden="true">
              {/* Barras que salen de una línea central: arriba, más caro; abajo, más barato. */}
              <Box sx={{ height: 52, width: "100%", display: "grid", gridTemplateRows: "1fr 1fr" }}>
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>{entry.delta > 0 && bar}</Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", borderTop: 1, borderColor: "divider" }}>
                  {entry.delta < 0 && bar}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {shortDay(day)}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
        {t("fuel.trend.weekdayLegend")}
      </Typography>
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

  const peak = upcomingTravelPeak();
  const verdict = VERDICTS[trend.direction];
  const { Icon } = verdict;

  return (
    <Box component="section" aria-labelledby="fuel-trend-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2, md: 4 }}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
            <Icon sx={{ fontSize: 18, color: verdict.color }} aria-hidden="true" />
            <Typography sx={{ color: "inherit" }}>{t("fuel.trend.kicker")}</Typography>
          </Stack>
          <Typography variant="h2" component="h2" id="fuel-trend-heading" sx={{ mt: 0.75 }}>
            {t(`fuel.trend.${trend.direction}`)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {rich(
              t("fuel.trend.average", {
                province: provinceLabel,
                price: (
                  <Box component="span" className="tabular" sx={{ color: "text.primary", fontWeight: 600 }}>
                    {formatLiterPrice(trend.last.average)} {LITER_UNITS}
                  </Box>
                ),
                comparison: comparison(trend, liters),
              })
            )}
          </Typography>
        </Box>

        <Box sx={{ flexShrink: 0, width: { xs: "100%", md: 300 } }}>
          <Sparkline trend={trend} color={verdict.color} />
        </Box>
      </Stack>

      {peak && (
        <Alert severity="info" icon={<LuggageIcon fontSize="inherit" />} sx={{ mt: 2 }}>
          {t("fuel.trend.peak", { date: formatDate(peak.date, { weekday: "long", day: "numeric" }), name: peak.name })}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <WeekdayInsight provinceId={provinceId} productId={productId} provinceLabel={provinceLabel} />
      </Box>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("fuel.trend.note", { province: provinceLabel })}
      </Typography>
    </Box>
  );
}

export default FuelTrend;
