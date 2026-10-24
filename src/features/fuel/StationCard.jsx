/* eslint-disable react/prop-types */
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import DirectionsIcon from "@mui/icons-material/DirectionsOutlined";

import PriceTierBadge from "../../components/PriceTierBadge";
import { formatEuros } from "../prices/priceFormat";
import { directionsUrl, formatDistance, formatLiterPrice, LITER_UNITS } from "./fuelFormat";
import { fillCost } from "./fuelData";

/** Abierta / cerrada con texto (no solo color); nada si no se entiende el horario. */
export function OpenStatus({ open }) {
  if (open == null) return null;
  return (
    <Chip
      size="small"
      variant="outlined"
      color={open ? "success" : "default"}
      label={open ? "Abierta ahora" : "Cerrada ahora"}
    />
  );
}

export function DirectionsButton({ station, compact = false }) {
  const label = `Cómo llegar a ${station.brand}, ${station.address}, ${station.locality}`;
  return (
    <Button
      component="a"
      href={directionsUrl(station)}
      target="_blank"
      rel="noopener noreferrer"
      size="small"
      variant="outlined"
      startIcon={<DirectionsIcon />}
      aria-label={label}
      disabled={station.lat == null || station.lon == null}
      sx={{ minHeight: 44, flexShrink: 0 }}
    >
      {compact ? "Ir" : "Cómo llegar"}
    </Button>
  );
}

/** Gasolinera en formato tarjeta, para pantallas estrechas. */
export function StationCard({ station, rank, tier, liters, open, showDistance }) {
  return (
    <Card component="li" sx={{ listStyle: "none" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" className="tabular">
              {rank}.
            </Typography>
            <Typography variant="h3" component="h3" noWrap>
              {station.brand}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {station.address}, {station.locality}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "right", flexShrink: 0 }}>
            <Typography
              className="tabular"
              sx={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.1 }}
            >
              {formatLiterPrice(station.price)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {LITER_UNITS}
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <PriceTierBadge tier={tier} compact />
            </Box>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1.5 }}
        >
          <Typography variant="body2" className="tabular">
            Llenar {liters.toLocaleString("es-ES")} L: <strong>{formatEuros(fillCost(station.price, liters))}</strong>
          </Typography>
          {showDistance && station.distanceKm != null && (
            <Typography variant="body2" color="text.secondary">
              · a {formatDistance(station.distanceKm)}
            </Typography>
          )}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1.5 }}
        >
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <OpenStatus open={open} />
            {station.schedule && (
              <Typography variant="caption" color="text.secondary">
                {station.schedule}
              </Typography>
            )}
          </Stack>
          <DirectionsButton station={station} />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default StationCard;
