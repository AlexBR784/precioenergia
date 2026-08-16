/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import BoltIcon from "@mui/icons-material/Bolt";
import SavingsIcon from "@mui/icons-material/SavingsOutlined";
import { formatPrice, formatHour } from "./priceFormat";
import PriceTierBadge from "../../components/PriceTierBadge";

function KpiCard({ label, value, units, context, icon, tier, highlight }) {
  return (
    <Card
      sx={{
        height: "100%",
        ...(highlight && {
          borderColor: "primary.main",
          bgcolor: "primarySoft",
        }),
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
          <Box
            aria-hidden="true"
            sx={{ display: "flex", color: tier ? `price.${tier}` : "text.secondary" }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary" noWrap>
            {label}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={0.5} flexWrap="wrap">
          <Typography
            className="tabular"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 700,
              lineHeight: 1.1,
              color: tier ? `price.${tier}` : "text.primary",
            }}
          >
            {value}
          </Typography>
          {units && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {units}
            </Typography>
          )}
        </Stack>

        <Box sx={{ mt: 0.75, minHeight: 20 }}>
          {tier ? (
            <PriceTierBadge tier={tier} compact />
          ) : (
            <Typography variant="caption" color="text.secondary">
              {context}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Fila de métricas destacadas del día.
 *
 * Esta información existía antes, pero enterrada en <Alert> de texto corrido;
 * es lo primero que quiere ver quien entra en la página.
 */
export function PriceSummaryCards({ stats, units }) {
  const { current, min, max, average, savingPct, isToday, tierOf } = stats;

  const cards = [];

  if (isToday) {
    cards.push({
      key: "now",
      label: "Ahora",
      value: formatPrice(current?.value, units),
      units,
      icon: <BoltIcon fontSize="small" />,
      tier: current ? tierOf(current.value) : null,
      context: current ? formatHour(current.hour) : "Sin dato para esta hora",
      highlight: true,
    });
  }

  cards.push(
    {
      key: "min",
      label: "Mínimo",
      value: formatPrice(min?.value, units),
      units,
      icon: <TrendingDownIcon fontSize="small" />,
      context: `a las ${formatHour(min?.hour)}`,
    },
    {
      key: "max",
      label: "Máximo",
      value: formatPrice(max?.value, units),
      units,
      icon: <TrendingUpIcon fontSize="small" />,
      context: `a las ${formatHour(max?.hour)}`,
    },
    {
      key: "avg",
      label: "Media del día",
      value: formatPrice(average, units),
      units,
      icon: <ShowChartIcon fontSize="small" />,
      context: "24 horas",
    },
    {
      key: "saving",
      label: "Ahorro potencial",
      value:
        savingPct == null
          ? "—"
          : `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(savingPct)} %`,
      units: null,
      icon: <SavingsIcon fontSize="small" />,
      context: "de la más cara a la más barata",
    }
  );

  return (
    <Box
      component="section"
      aria-label="Resumen del día"
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: `repeat(${cards.length}, minmax(0, 1fr))`,
        },
      }}
    >
      {cards.map(({ key, ...card }) => (
        <Box key={key} sx={{ gridColumn: { xs: key === "saving" ? "span 2" : "auto", md: "auto" } }}>
          <KpiCard {...card} />
        </Box>
      ))}
    </Box>
  );
}

export default PriceSummaryCards;
