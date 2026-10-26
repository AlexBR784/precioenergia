/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DirectionsIcon from "@mui/icons-material/DirectionsOutlined";

import { getPriceTier } from "../../theme/tokens";
import { formatEuros } from "../prices/priceFormat";
import { fillCost, isOpenNow } from "./fuelData";
import { directionsUrl, formatDistance, formatLiterPrice, LITER_UNITS } from "./fuelFormat";

const PAGE_SIZE = 10;

const deltaFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** Abierta / cerrada con punto de color y texto; nada si el horario no se entiende. */
function OpenState({ open }) {
  if (open == null) return null;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" component="span">
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          bgcolor: open ? "price.cheapest" : "text.disabled",
        }}
      />
      <span>{open ? "Abierta" : "Cerrada"}</span>
    </Stack>
  );
}

/**
 * Cuánto más cara es que la más barata, en una barrita: lo que de verdad se
 * compara entre gasolineras no es "1,669" contra "1,679", sino la diferencia.
 */
function DeltaBar({ delta, span, tier }) {
  const width = span > 0 ? Math.max(4, (delta / span) * 100) : 4;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ height: 6, borderRadius: 999, bgcolor: "surfaceMuted", overflow: "hidden" }}>
        <Box
          sx={{
            height: "100%",
            width: `${width}%`,
            borderRadius: 999,
            bgcolor: (theme) => alpha(theme.palette.price[tier], 0.85),
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" className="tabular" sx={{ mt: 0.5, display: "block" }}>
        {delta <= 0 ? "La más barata" : `+${deltaFormat.format(delta)} ${LITER_UNITS}`}
      </Typography>
    </Box>
  );
}

function StationRow({ station, rank, min, span, tier, liters, open, showDistance }) {
  const delta = station.price - min;
  const meta = [
    station.schedule || null,
    showDistance && station.distanceKm != null ? formatDistance(station.distanceKm) : null,
  ].filter(Boolean);
  const isBest = delta <= 0;

  return (
    <Box
      component="li"
      sx={{
        listStyle: "none",
        display: "grid",
        alignItems: "center",
        columnGap: { xs: 1.5, sm: 2 },
        rowGap: 1,
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        // Móvil: puesto | datos | precio | ir, y la barra debajo de los datos.
        // Escritorio: todo en una fila, con la barra en su propia columna.
        gridTemplateColumns: {
          xs: "28px minmax(0, 1fr) auto 40px",
          md: "32px minmax(0, 1fr) 200px 120px 44px",
        },
        gridTemplateAreas: {
          xs: '"rank info price go" ". delta delta ."',
          md: '"rank info delta price go"',
        },
        transition: "background-color .15s ease",
        "&:hover": { bgcolor: (theme) => alpha(theme.palette.text.primary, 0.03) },
      }}
    >
      <Box
        sx={{
          gridArea: "rank",
          display: "grid",
          placeItems: "center",
          width: 28,
          height: 28,
          borderRadius: "50%",
          bgcolor: isBest ? "priceSoft.cheapest" : "transparent",
          color: isBest ? "price.cheapest" : "text.secondary",
        }}
      >
        <Typography className="tabular" sx={{ fontSize: "0.875rem", fontWeight: 700, color: "inherit" }}>
          {rank}
        </Typography>
      </Box>

      <Box sx={{ gridArea: "info", minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {station.brand}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          title={`${station.address}, ${station.locality}`}
          // Dos líneas como mucho: en móvil cortar a una dejaba "Calle los Maceros, …".
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {station.address}, {station.locality}
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          divider={<Box component="span" sx={{ color: "divider" }}>·</Box>}
          sx={{ mt: 0.25, typography: "caption", color: "text.secondary", flexWrap: "wrap" }}
        >
          <OpenState open={open} />
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </Stack>
      </Box>

      <Box sx={{ gridArea: "delta", minWidth: 0 }}>
        <DeltaBar delta={delta} span={span} tier={tier} />
      </Box>

      <Box sx={{ gridArea: "price", textAlign: "right" }}>
        <Typography className="tabular" sx={{ fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.2 }}>
          {formatLiterPrice(station.price)}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5, fontWeight: 600 }}>
            {LITER_UNITS}
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" className="tabular">
          {formatEuros(fillCost(station.price, liters))} · {liters.toLocaleString("es-ES")} L
        </Typography>
      </Box>

      <Box sx={{ gridArea: "go", justifySelf: "end" }}>
        <Tooltip title="Cómo llegar">
          <span>
            <IconButton
              component="a"
              href={directionsUrl(station)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Cómo llegar a ${station.brand}, ${station.address}, ${station.locality}`}
              disabled={station.lat == null || station.lon == null}
              sx={{ border: 1, borderColor: "divider", width: 40, height: 40 }}
            >
              <DirectionsIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

/**
 * Ranking de gasolineras como lista de una sola pieza, igual en móvil y en
 * escritorio (antes era tabla en escritorio y tarjetas en móvil).
 *
 * Cada fila lleva lo que se decide al elegir gasolinera: cuánto más cara es
 * que la más barata (barra y cifra), el precio y lo que cuesta llenar, si está
 * abierta y cómo llegar. El horario completo pasa a una línea discreta y "Cómo
 * llegar" a un botón de icono: antes eran una pastilla verde y un botón con
 * texto repetidos diez veces, y pesaban más que los precios.
 */
export function StationList({ stations, stats, liters, showDistance, now, resetKey }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Al cambiar de combustible, zona o filtro se vuelve al principio del ranking.
  useEffect(() => setVisible(PAGE_SIZE), [resetKey]);

  const min = stats.cheapest.price;
  const span = stats.priciest.price - min;

  return (
    <Card component="section" aria-labelledby="ranking-heading">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="baseline"
        sx={{ px: { xs: 2, sm: 2.5 }, pt: 2.5, pb: 1.5 }}
      >
        <Typography variant="h2" component="h2" id="ranking-heading">
          Las más baratas
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.min(visible, stations.length)} de {stations.length}
        </Typography>
      </Stack>
      <Divider />

      <Stack component="ol" divider={<Divider component="li" aria-hidden="true" />} sx={{ m: 0, p: 0 }}>
        {stations.slice(0, visible).map((station, index) => (
          <StationRow
            key={station.id}
            station={station}
            rank={index + 1}
            min={min}
            span={span}
            tier={getPriceTier(station.price, stats.low, stats.high)}
            liters={liters}
            open={isOpenNow(station.schedule, now)}
            showDistance={showDistance}
          />
        ))}
      </Stack>

      {visible < stations.length && (
        <>
          <Divider />
          <Box sx={{ textAlign: "center", py: 1.5 }}>
            <Button onClick={() => setVisible((count) => count + PAGE_SIZE)} sx={{ minHeight: 44 }}>
              Ver {Math.min(PAGE_SIZE, stations.length - visible)} más
            </Button>
          </Box>
        </>
      )}
    </Card>
  );
}

export default StationList;
