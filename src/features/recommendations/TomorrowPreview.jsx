/* eslint-disable react/prop-types */
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import EventIcon from "@mui/icons-material/EventOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

import { useTomorrowForecast } from "../../hooks/useTomorrowForecast";
import { formatRangeLabel } from "../prices/cheapRanges";
import { t } from "../../i18n";

/** Diferencias menores no cambian la decisión: "parecida a hoy". */
const SIMILAR = 5;

const headline = ({ changePct, todayAverage, tomorrowAverage }) => {
  if (changePct == null) {
    return tomorrowAverage < todayAverage ? t("tips.tomorrow.cheaper") : t("tips.tomorrow.dearer");
  }
  if (Math.abs(changePct) < SIMILAR) return t("tips.tomorrow.similar");
  return t("tips.tomorrow.change", { percent: Math.round(Math.abs(changePct)), cheaper: changePct < 0 });
};

/**
 * Una flecha y no una carita: la carita es el veredicto de hoy, y dos en la
 * misma pantalla competían. Mañana es un apunte, no otro veredicto.
 */
const TRENDS = {
  down: { Icon: TrendingDownIcon, color: "price.cheapest" },
  up: { Icon: TrendingUpIcon, color: "price.high" },
  flat: { Icon: TrendingFlatIcon, color: "text.secondary" },
};

const trendOf = ({ changePct, todayAverage, tomorrowAverage }) => {
  const delta = changePct ?? (tomorrowAverage < todayAverage ? -SIMILAR : SIMILAR);
  if (delta <= -SIMILAR) return TRENDS.down;
  if (delta >= SIMILAR) return TRENDS.up;
  return TRENDS.flat;
};


/**
 * Mañana en una línea, al final de "Qué hacer hoy" (con el estilo de las filas
 * de "Para tener en cuenta"): cómo pinta y sus mejores horas. El detalle está
 * al elegir "Mañana" en el selector de día.
 */
export function TomorrowNote({ forecast, onShowTomorrow }) {
  const { Icon, color } = trendOf(forecast);
  const { cheapest, pvpcPublished } = forecast;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2 }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      sx={{ py: 1.5 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
        <Icon aria-hidden="true" sx={{ fontSize: 20, mt: "1px", color }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" component="h3" sx={{ fontWeight: 600 }}>
            {headline(forecast)}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="tabular" sx={{ mt: 0.25 }}>
            {pvpcPublished ? t("tips.tomorrow.official") : t("tips.tomorrow.market")}
            {cheapest ? t("tips.tomorrow.bestHours", { range: formatRangeLabel(cheapest) }) : ""}
          </Typography>
        </Box>
      </Stack>
      {onShowTomorrow && (
        <Button
          size="small"
          endIcon={<ArrowForwardIcon />}
          onClick={onShowTomorrow}
          sx={{ flexShrink: 0, ml: { xs: 3.5, sm: 0 } }}
        >
          {t("tips.tomorrow.show")}
        </Button>
      )}
    </Stack>
  );
}

function Stat({ label, value, color }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ color }}>
        {label}
      </Typography>
      <Typography className="tabular" sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * "Mañana" en detalle: lo que se ve al elegir mañana antes de que salga el PVPC.
 *
 * Se apoya en el precio del mercado mayorista, que REE publica hacia mediodía
 * (el PVPC llega sobre las 20:15). Solo se dice en relativo —más barata, más
 * cara, mejores horas— porque el mercado no es el precio que paga un
 * particular: el PVPC le suma peajes y cargos. Si aún no hay avance, se pinta
 * `fallback` (el aviso de "todavía no hay precios").
 */
export function TomorrowPreview({ fallback = null }) {
  const { loading, forecast } = useTomorrowForecast();
  if (loading) return null;
  if (!forecast?.available) return fallback;

  const { Icon, color } = trendOf(forecast);
  const { cheapest, priciest } = forecast;

  return (
    <Card component="section" aria-labelledby="tomorrow-heading">
      <CardContent>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
            <EventIcon sx={{ fontSize: 16 }} aria-hidden="true" />
            <Typography variant="subtitle2" sx={{ color: "inherit" }}>
              {t("tips.tomorrow.label")}
            </Typography>
          </Stack>
          <Chip
            size="small"
            variant="outlined"
            label={t("tips.tomorrow.preview")}
            sx={{ height: 20, fontSize: "0.75rem", borderColor: "divider", color: "text.secondary" }}
          />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          <Icon aria-hidden="true" sx={{ color, fontSize: 28 }} />
          <Typography variant="h2" component="h2" id="tomorrow-heading">
            {headline(forecast)}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 2,
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: "surfaceMuted",
          }}
        >
          {cheapest && <Stat label={t("tips.tomorrow.best")} value={formatRangeLabel(cheapest)} color="price.cheapest" />}
          {priciest && <Stat label={t("tips.tomorrow.avoid")} value={formatRangeLabel(priciest)} color="price.high" />}
        </Box>

        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {t("tips.tomorrow.note")}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default TomorrowPreview;
