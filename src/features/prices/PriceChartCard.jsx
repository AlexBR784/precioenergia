/* eslint-disable react/prop-types */
import { lazy, Suspense } from "react";
import { Box, Stack, Typography } from "@mui/material";
import PeriodStrip from "../../components/PeriodStrip";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { t } from "../../i18n";
import { useNow } from "../../hooks/useNow";

// ECharts es lo más pesado de la app: va en su propio archivo y se descarga
// a la vez que el resto, así el resumen del precio no lo espera.
const HourlyPriceChart = lazy(() => import("../../components/HourlyPriceChart"));

function LegendItem({ swatch, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {swatch}
      <Typography variant="caption" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  );
}

/** Sección del gráfico de precio por hora, con su leyenda y los tramos de la tarifa. */
export function PriceChartCard({ data, units, isToday, date }) {
  const { region } = useEnergyPrefs();
  const now = useNow();
  return (
    <Box component="section" aria-labelledby="chart-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h2" component="h2" id="chart-heading" sx={{ mb: 1 }}>
        {t("prices.chart.title")}
      </Typography>

      <Suspense fallback={<Box sx={{ height: { xs: 260, md: 340 } }} aria-busy="true" />}>
        <HourlyPriceChart data={data} units={units} isToday={isToday} />
      </Suspense>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: 1, columnGap: 2, rowGap: 0.75 }}
      >
        <LegendItem
          swatch={
            <Box
              aria-hidden="true"
              sx={{
                width: 40,
                height: 6,
                borderRadius: 999,
                background: (theme) => {
                  const { price } = theme.palette;
                  return `linear-gradient(90deg, ${price.cheapest}, ${price.low}, ${price.medium}, ${price.high})`;
                },
              }}
            />
          }
        >
          {t("prices.chart.legendGradient")}
        </LegendItem>
        <LegendItem
          swatch={
            <Box
              aria-hidden="true"
              sx={{ width: 16, borderTop: "1px dashed", borderColor: "text.secondary" }}
            />
          }
        >
          {t("prices.chart.legendAverage")}
        </LegendItem>
        {isToday && (
          <LegendItem
            swatch={
              <Box
                aria-hidden="true"
                sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "text.primary" }}
              />
            }
          >
            {t("prices.chart.legendNow")}
          </LegendItem>
        )}
      </Stack>

      {/* Los tramos 2.0TD explican por qué la tarde es cara y, con precio por
          tramos, son lo único que decide la factura. */}
      <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
        <PeriodStrip date={date} region={region} nowHour={isToday ? now.getHours() : null} />
      </Box>
    </Box>
  );
}

export default PriceChartCard;
