/* eslint-disable react/prop-types */
import { Box, Paper, Stack, Typography } from "@mui/material";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStationOutlined";

import { formatEuros } from "../prices/priceFormat";
import { fillCost } from "./fuelData";
import { formatDistance, formatLiterPrice, LITER_UNITS } from "./fuelFormat";

/**
 * El titular de la pestaña: dónde está el combustible más barato y cuánto se
 * ahorra al llenar el depósito allí, con la media de la zona como cifra de
 * apoyo. Mismo patrón que `DayVerdict` en la pestaña de consejos.
 */
export function FuelVerdict({ fuelLabel, stats, liters, scopeLabel }) {
  const { cheapest, average, count } = stats;

  const cheapestCost = fillCost(cheapest.price, liters);
  const averageCost = fillCost(average, liters);
  const saving = averageCost - cheapestCost;
  // Menos de 1 céntimo de ahorro no es una noticia: se omite la frase.
  const showSaving = count > 2 && saving >= 0.01;

  const where = [
    cheapest.brand,
    cheapest.locality,
    cheapest.distanceKm != null ? `a ${formatDistance(cheapest.distanceKm)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Paper
      component="section"
      aria-labelledby="fuel-verdict-heading"
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        borderWidth: { xs: 1, sm: 2 },
        borderColor: "price.cheapest",
        bgcolor: "priceSoft.cheapest",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 3 }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "background.paper",
              color: "price.cheapest",
            }}
          >
            <LocalGasStationIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h2"
              component="h2"
              id="fuel-verdict-heading"
              sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
            >
              {fuelLabel} más barata {scopeLabel}: {formatLiterPrice(cheapest.price)} {LITER_UNITS}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {where}.
              {showSaving &&
                ` Llenar ${liters.toLocaleString("es-ES")} L allí cuesta ${formatEuros(
                  cheapestCost
                )}: ${formatEuros(saving)} menos que en una gasolinera de precio medio.`}
            </Typography>
          </Box>
        </Stack>

        {/* Mismo pie que el veredicto de la luz: en móvil, una fila con la
            etiqueta a la izquierda y la cifra a la derecha. */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: { xs: "row", sm: "column" },
            alignItems: { xs: "baseline", sm: "flex-end" },
            justifyContent: "space-between",
            gap: { xs: 1, sm: 0 },
            pt: { xs: 1.5, sm: 0 },
            borderTop: { xs: 1, sm: 0 },
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Precio medio
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: "block", sm: "none" } }}
            >
              {count.toLocaleString("es-ES")} gasolineras
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="baseline">
            <Typography
              className="tabular"
              sx={{ fontSize: { xs: "1.25rem", sm: "1.75rem" }, fontWeight: 700, lineHeight: 1.1 }}
            >
              {formatLiterPrice(average)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {LITER_UNITS}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            {count.toLocaleString("es-ES")} gasolineras
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default FuelVerdict;
