/* eslint-disable react/prop-types */
import { Box } from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStationOutlined";

import { KpiCard } from "../prices/PriceSummaryCards";
import { formatEuros } from "../prices/priceFormat";
import { fillCost } from "./fuelData";
import { formatLiterPrice, LITER_UNITS } from "./fuelFormat";

const where = (station) => `${station.brand} · ${station.locality}`;

/** Las cuatro cifras clave de la zona, con el mismo estilo que las del día de la luz. */
export function FuelSummaryCards({ stats, liters }) {
  const { cheapest, priciest, average, median } = stats;

  const cards = [
    {
      key: "min",
      label: "Más barata",
      value: formatLiterPrice(cheapest.price),
      units: LITER_UNITS,
      icon: <TrendingDownIcon fontSize="small" />,
      context: where(cheapest),
      highlight: true,
    },
    {
      key: "avg",
      label: "Precio medio",
      value: formatLiterPrice(average),
      units: LITER_UNITS,
      icon: <ShowChartIcon fontSize="small" />,
      context: `Mediana ${formatLiterPrice(median)} ${LITER_UNITS}`,
    },
    {
      key: "max",
      label: "Más cara",
      value: formatLiterPrice(priciest.price),
      units: LITER_UNITS,
      icon: <TrendingUpIcon fontSize="small" />,
      context: where(priciest),
    },
    {
      key: "fill",
      label: `Llenar ${liters.toLocaleString("es-ES")} L`,
      value: formatEuros(fillCost(cheapest.price, liters)),
      units: null,
      icon: <LocalGasStationIcon fontSize="small" />,
      context: `en la más barata (${formatEuros(fillCost(priciest.price, liters))} en la más cara)`,
    },
  ];

  return (
    <Box
      component="section"
      aria-label="Resumen de precios de la zona"
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {cards.map(({ key, ...card }) => (
        <KpiCard key={key} {...card} />
      ))}
    </Box>
  );
}

export default FuelSummaryCards;
