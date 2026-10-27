/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";

import PriceTierBadge from "../../components/PriceTierBadge";
import { formatHour, formatPrice } from "./priceFormat";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { useNow } from "../../hooks/useNow";
import { t } from "../../i18n";
import { rich } from "../../i18n/rich";
import { PERIODS, currentPeriod } from "../../utils/tariffPeriods";

const hhmm = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/**
 * Tramo 2.0TD de ahora ("Valle hasta las 08:00"). Le sirve a todo el mundo:
 * con PVPC explica el precio y con precio por tramos es lo que se paga.
 */
function PeriodNow() {
  const { region } = useEnergyPrefs();
  const now = useNow();
  const { period, until } = currentPeriod(now, region);
  const tone = { P1: "price.high", P2: "price.medium", P3: "price.cheapest" }[period];

  return (
    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
      {rich(
        t("prices.headline.period", {
          period: (
            <Box component="span" sx={{ color: tone, fontWeight: 700 }}>
              {PERIODS[period].label.toLowerCase()}
            </Box>
          ),
          until: until ? hhmm(until) : null,
        })
      )}
    </Typography>
  );
}

function Stat({ label, value, units, context }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="baseline" flexWrap="wrap">
        <Typography className="tabular" sx={{ fontSize: { xs: "1.0625rem", sm: "1.25rem" }, fontWeight: 700, lineHeight: 1.3 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "inline" } }}>
          {units}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" className="tabular" noWrap>
        {context}
      </Typography>
    </Box>
  );
}

/**
 * Cabecera de la pestaña de precios: el precio de ahora en grande y, al lado,
 * mínimo, máximo y media del día en una línea.
 *
 * Sustituye a cinco tarjetas y un aviso. Repetían el mínimo hasta cuatro veces
 * en pantalla (tarjeta, aviso, gráfica, desglose), ocupaban casi dos pantallas
 * en móvil y daban un "ahorro potencial" engañoso: la diferencia entre la hora
 * más cara y la más barata en %, que con mínimos bajos salía del 90 % aunque
 * en euros fueran céntimos. El aviso de "la hora más barata ya ha pasado" era
 * un consejo; esos viven en la pestaña de Consejos.
 */
export function PriceHeadline({ stats, units }) {
  const { isToday, current, min, max, average, tierOf } = stats;
  const showNow = isToday && current;

  const vsAverage = (() => {
    if (!showNow || !average) return null;
    const diff = ((current.value - average) / Math.abs(average)) * 100;
    if (Math.abs(diff) < 1) return t("prices.headline.atAverage");
    return t("prices.headline.vsAverage", { percent: Math.abs(Math.round(diff)), below: diff < 0 });
  })();

  const stats3 = [
    { key: "min", label: t("prices.headline.min"), value: formatPrice(min?.value, units), context: t("prices.headline.atHour", { hour: formatHour(min?.hour) }) },
    { key: "max", label: t("prices.headline.max"), value: formatPrice(max?.value, units), context: t("prices.headline.atHour", { hour: formatHour(max?.hour) }) },
    { key: "avg", label: t("prices.headline.average"), value: formatPrice(average, units), context: t("prices.headline.ofDay") },
  ];

  return (
    <Card component="section" aria-label={t("prices.headline.summary")}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "text.secondary" }}>
              {showNow && <BoltIcon sx={{ fontSize: 16 }} aria-hidden="true" />}
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {showNow ? t("prices.headline.now", { hour: formatHour(current.hour) }) : t("prices.headline.dayAverage")}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="baseline" flexWrap="wrap">
              <Typography
                className="tabular"
                sx={{
                  fontSize: { xs: "2rem", sm: "2.375rem" },
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: showNow ? `price.${tierOf(current.value)}` : "text.primary",
                }}
              >
                {formatPrice(showNow ? current.value : average, units)}
              </Typography>
              <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                {units}
              </Typography>
            </Stack>
            {showNow && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                <PriceTierBadge tier={tierOf(current.value)} compact />
                <Typography variant="caption" color="text.secondary">
                  {vsAverage}
                </Typography>
              </Stack>
            )}
            {showNow && <PeriodNow />}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: { xs: 1.5, sm: 2 },
              pt: { xs: 2, md: 0 },
              pl: { md: 4 },
              borderTop: { xs: 1, md: 0 },
              borderLeft: { md: 1 },
              borderColor: "divider",
            }}
          >
            {stats3.map(({ key, ...stat }) => (
              <Stat key={key} units={units} {...stat} />
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default PriceHeadline;
