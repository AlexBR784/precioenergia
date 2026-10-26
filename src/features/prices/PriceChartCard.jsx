/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import HourlyPriceChart from "../../components/HourlyPriceChart";

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
export function PriceChartCard({ data, units, isToday }) {
  return (
    <Card component="section" aria-labelledby="chart-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <ShowChartIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="chart-heading">
            Precio por hora
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          El precio de cada hora. El color va de frío (barato) a caliente (caro).
          Pasa el ratón o toca la gráfica para ver el precio de una hora.
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
            De más barato a más caro
          </LegendItem>
          <LegendItem
            swatch={
              <Box
                aria-hidden="true"
                sx={{ width: 16, borderTop: "1px dashed", borderColor: "text.secondary" }}
              />
            }
          >
            Media del día
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
              Hora actual
            </LegendItem>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default PriceChartCard;
