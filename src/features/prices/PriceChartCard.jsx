/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import HourlyPriceChart from "../../components/HourlyPriceChart";
import PeriodStrip from "../../components/PeriodStrip";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { t } from "../../i18n";
import { useNow } from "../../hooks/useNow";

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

/** Tarjeta del gráfico de precio por hora, con su leyenda. */
export function PriceChartCard({ data, units, isToday, date }) {
  const { region } = useEnergyPrefs();
  const now = useNow();
  return (
    <Card component="section" aria-labelledby="chart-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <ShowChartIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="chart-heading">
            {t("prices.chart.title")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t("prices.chart.body")}
        </Typography>

        <HourlyPriceChart data={data} units={units} isToday={isToday} />

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
      </CardContent>
    </Card>
  );
}

export default PriceChartCard;
