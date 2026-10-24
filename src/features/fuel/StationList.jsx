/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import PriceTierBadge from "../../components/PriceTierBadge";
import { getPriceTier } from "../../theme/tokens";
import { formatEuros } from "../prices/priceFormat";
import { fillCost, isOpenNow } from "./fuelData";
import { formatDistance, formatLiterPrice, LITER_UNITS } from "./fuelFormat";
import { DirectionsButton, OpenStatus, StationCard } from "./StationCard";

const PAGE_SIZE = 10;

/**
 * Ranking de gasolineras: tabla en pantallas anchas, tarjetas en estrechas
 * (mismo corte `md` que `PricesTab`).
 *
 * El tramo de color se calcula con los percentiles 5-95 de la zona, no con su
 * mínimo y máximo: ver `computeStats`.
 */
export function StationList({ stations, stats, liters, showDistance, now, resetKey }) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Al cambiar de combustible, zona o filtro se vuelve al principio del ranking.
  useEffect(() => setVisible(PAGE_SIZE), [resetKey]);

  const shown = stations.slice(0, visible);
  const rows = shown.map((station, index) => ({
    station,
    rank: index + 1,
    tier: getPriceTier(station.price, stats.low, stats.high),
    open: isOpenNow(station.schedule, now),
  }));

  return (
    <Box component="section" aria-labelledby="ranking-heading">
      <Typography variant="h2" component="h2" id="ranking-heading" sx={{ mb: 1.5 }}>
        Las más baratas
      </Typography>

      {isCompact ? (
        <Stack component="ol" spacing={1.5} sx={{ m: 0, p: 0 }}>
          {rows.map((row) => (
            <StationCard
              key={row.station.id}
              {...row}
              liters={liters}
              showDistance={showDistance}
            />
          ))}
        </Stack>
      ) : (
        <TableContainer
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            // Cifras, estado y botón no se parten; solo la dirección envuelve.
            "& th, & td:not(:nth-of-type(2))": { whiteSpace: "nowrap" },
          }}
        >
          <Table aria-label="Gasolineras ordenadas" size="medium">
            <TableHead>
              <TableRow>
                <TableCell scope="col">#</TableCell>
                <TableCell scope="col">Gasolinera</TableCell>
                <TableCell scope="col" align="right">
                  Precio
                </TableCell>
                <TableCell scope="col" align="right">
                  Llenar {liters.toLocaleString("es-ES")} L
                </TableCell>
                {showDistance && (
                  <TableCell scope="col" align="right">
                    Distancia
                  </TableCell>
                )}
                <TableCell scope="col">Horario</TableCell>
                <TableCell scope="col">
                  <Box component="span" sx={{ position: "absolute", left: -9999 }}>
                    Cómo llegar
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ station, rank, tier, open }) => (
                <TableRow key={station.id} hover>
                  <TableCell className="tabular">{rank}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{station.brand}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {station.address}, {station.locality}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography className="tabular" sx={{ fontWeight: 700 }}>
                      {formatLiterPrice(station.price)} {LITER_UNITS}
                    </Typography>
                    <PriceTierBadge tier={tier} compact />
                  </TableCell>
                  <TableCell align="right" className="tabular">
                    {formatEuros(fillCost(station.price, liters))}
                  </TableCell>
                  {showDistance && (
                    <TableCell align="right" className="tabular">
                      {formatDistance(station.distanceKm)}
                    </TableCell>
                  )}
                  <TableCell>
                    <Stack spacing={0.5} alignItems="flex-start">
                      <OpenStatus open={open} />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: "normal", maxWidth: 200 }}
                      >
                        {station.schedule}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <DirectionsButton station={station} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {visible < stations.length && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            sx={{ minHeight: 44 }}
          >
            Ver {Math.min(PAGE_SIZE, stations.length - visible)} más
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default StationList;
