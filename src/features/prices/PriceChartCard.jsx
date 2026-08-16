/* eslint-disable react/prop-types */
import { Card, CardContent, Stack, Typography } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import DistributionChart from "../../components/DistributionChart";

/** Tarjeta contenedora del gráfico de evolución horaria. */
export function PriceChartCard({ data, units }) {
  return (
    <Card component="section" aria-labelledby="chart-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <ShowChartIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="chart-heading">
            Evolución del precio
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Precio por hora a lo largo del día. Los tramos marcados en rojo señalan
          subidas bruscas respecto a la hora anterior.
        </Typography>

        <DistributionChart data={data} units={units} />
      </CardContent>
    </Card>
  );
}

export default PriceChartCard;
