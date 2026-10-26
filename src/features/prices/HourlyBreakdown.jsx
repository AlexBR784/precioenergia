/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";

import { hourOf } from "../../hooks/usePriceStats";
import { usePowerKw } from "../../hooks/usePowerKw";
import { useNow } from "../../hooks/useNow";
import { PRICE_TIER_LABELS } from "../../theme/tokens";
import { euroCost, formatEuros, formatPrice } from "./priceFormat";

/** Las tres partes del día en las que se agrupan las horas. */
const PERIODS = [
  { id: "night", label: "Madrugada", from: 0, to: 8 },
  { id: "day", label: "Mañana y mediodía", from: 8, to: 16 },
  { id: "evening", label: "Tarde y noche", from: 16, to: 24 },
];

const ORDER = { HOUR: "hour", PRICE: "price" };

const pad = (hour) => `${String(hour).padStart(2, "0")}`;

/**
 * Barra divergente frente a la media: crece hacia la izquierda si la hora está
 * por debajo y hacia la derecha si está por encima. Es la comparación que de
 * verdad sirve ("¿esta hora es buena?"), más que el número suelto.
 */
function AverageBar({ value, average, maxDeviation, tier }) {
  const deviation = value - average;
  const width = maxDeviation > 0 ? (Math.abs(deviation) / maxDeviation) * 50 : 0;

  return (
    <Box aria-hidden="true" sx={{ position: "relative", height: 8, borderRadius: 999, bgcolor: "surfaceMuted" }}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: deviation < 0 ? `${50 - width}%` : "50%",
          width: `${Math.max(width, 1.5)}%`,
          borderRadius: 999,
          bgcolor: `price.${tier}`,
        }}
      />
      {/* La media: marca central fija */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: -2,
          bottom: -2,
          width: 2,
          ml: "-1px",
          borderRadius: 1,
          bgcolor: "text.secondary",
          opacity: 0.6,
        }}
      />
    </Box>
  );
}

function HourRow({ row, units, powerKw, average, maxDeviation, past, rank }) {
  const cost = euroCost(row.value, powerKw);
  const relation =
    row.value < average ? "por debajo de la media" : row.value > average ? "por encima de la media" : "en la media";

  return (
    <Box
      component="li"
      title={`${PRICE_TIER_LABELS[row.tier]} · ${relation}`}
      sx={{
        listStyle: "none",
        display: "grid",
        gridTemplateColumns: "52px minmax(48px, 1fr) auto 60px",
        alignItems: "center",
        columnGap: 1.5,
        px: 1.25,
        py: 0.75,
        borderRadius: 1.5,
        // Las horas que ya pasaron se quedan como referencia, sin competir.
        opacity: past ? 0.45 : 1,
        bgcolor: row.isNow ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.06) : "transparent",
        outline: (theme) => (row.isNow ? `1px solid ${theme.palette.primary.main}` : "none"),
      }}
    >
      <Typography className="tabular" sx={{ fontWeight: row.isNow ? 700 : 600, fontSize: "0.9375rem" }}>
        {rank != null ? (
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, mr: 0.75, fontSize: "0.75rem" }}>
            {rank}.
          </Box>
        ) : null}
        {row.datetime.slice(0, 2)}
        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
          :00
        </Box>
      </Typography>

      <AverageBar value={row.value} average={average} maxDeviation={maxDeviation} tier={row.tier} />

      <Typography className="tabular" sx={{ fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>
        {formatPrice(row.value, units)}
      </Typography>

      <Typography variant="body2" color="text.secondary" className="tabular" sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {formatEuros(cost)}
      </Typography>

      <Box component="span" sx={visuallyHidden}>
        {row.isNow ? "Hora actual. " : ""}
        {PRICE_TIER_LABELS[row.tier]}, {relation}. Coste de esa hora: {formatEuros(cost)}.
      </Box>
    </Box>
  );
}

function Column({ title, subtitle, rows, renderRow }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ px: 1.25, mb: 0.75 }}>
        <Typography variant="subtitle2" component="h3" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" className="tabular">
            {subtitle}
          </Typography>
        )}
      </Stack>
      <Stack component="ul" spacing={0.25} sx={{ m: 0, p: 0 }}>
        {rows.map(renderRow)}
      </Stack>
    </Box>
  );
}

/**
 * "Precio hora a hora": las horas del día en tres columnas por franjas
 * (madrugada, mañana y mediodía, tarde y noche), sin scroll interno.
 *
 * Cada hora lleva su precio, una barra frente a la media del día y lo que
 * cuesta consumir esa hora con la potencia del usuario (la misma que usa
 * "¿Cuándo lo enciendo?"). Así deja de repetir la gráfica, que ya da la forma
 * del día, y responde a "¿cuánto me cuesta a esta hora?".
 *
 * Sustituye a la tabla de escritorio (tres columnas estiradas, con su propio
 * scroll) y a las 24 tarjetas de móvil. El orden vive aquí, junto a lo que
 * ordena, y no arriba con la fecha.
 */
export function HourlyBreakdown({ hours, units, average, isToday, onNavigateToTips, onExport }) {
  const [order, setOrder] = useState(ORDER.HOUR);
  const { powerKw } = usePowerKw();
  const currentHour = useNow().getHours();

  const maxDeviation = useMemo(
    () => Math.max(...hours.map((row) => Math.abs(row.value - average))),
    [hours, average]
  );

  const columns = useMemo(() => {
    if (order === ORDER.PRICE) {
      const sorted = [...hours].sort((a, b) => a.value - b.value);
      const size = Math.ceil(sorted.length / 3);
      return [
        { id: "cheap", title: `Las ${size} más baratas`, rows: sorted.slice(0, size), offset: 0 },
        { id: "mid", title: "Intermedias", rows: sorted.slice(size, size * 2), offset: size },
        { id: "dear", title: "Las más caras", rows: sorted.slice(size * 2), offset: size * 2 },
      ];
    }
    return PERIODS.map((period) => {
      const rows = hours.filter((row) => {
        const hour = hourOf(row.datetime);
        return hour >= period.from && hour < period.to;
      });
      const mean = rows.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : null;
      return {
        id: period.id,
        title: period.label,
        subtitle:
          mean != null ? `${pad(period.from)}–${pad(period.to)} h · media ${formatPrice(mean, units)}` : null,
        rows,
      };
    });
  }, [hours, order, units]);

  return (
    <Card component="section" aria-labelledby="hours-heading">
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "flex-start" }}
          justifyContent="space-between"
          sx={{ mb: 2.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleIcon fontSize="small" color="primary" aria-hidden="true" />
              <Typography variant="h2" component="h2" id="hours-heading">
                Precio hora a hora
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Precio en {units}, cómo queda frente a la media del día y lo que cuesta
              una hora de consumo a {powerKw.toLocaleString("es-ES")} kW.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={order}
              aria-label="Orden de las horas"
              onChange={(_, value) => value && setOrder(value)}
            >
              <ToggleButton value={ORDER.HOUR}>Por hora</ToggleButton>
              <ToggleButton value={ORDER.PRICE}>Más baratas primero</ToggleButton>
            </ToggleButtonGroup>
            {onExport && (
              <Tooltip title="Descargar los precios del día en CSV (se abre en Excel, Numbers o Google Sheets)">
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={onExport}
                  sx={{ minHeight: { xs: 44, sm: 36 } }}
                >
                  CSV
                </Button>
              </Tooltip>
            )}
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={onNavigateToTips}
              sx={{ minHeight: { xs: 44, sm: 36 } }}
            >
              Ver consejos del día
            </Button>
          </Stack>
        </Stack>

        {/* Cabecera de columnas de cada fila, una vez arriba */}
        <Box
          aria-hidden="true"
          sx={{
            display: { xs: "none", md: "grid" },
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            columnGap: 3,
            mb: 0.5,
          }}
        >
          {columns.map((column) => (
            <Box
              key={column.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "52px minmax(48px, 1fr) auto 60px",
                columnGap: 1.5,
                px: 1.25,
                typography: "caption",
                color: "text.secondary",
              }}
            >
              <span>Hora</span>
              <Box component="span" sx={{ textAlign: "center" }}>
                ← Media →
              </Box>
              <Box component="span" sx={{ textAlign: "right" }}>
                Precio
              </Box>
              <Box component="span" sx={{ textAlign: "right" }}>
                Coste
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            columnGap: 3,
            rowGap: 3,
          }}
        >
          {columns.map((column) => (
            <Column
              key={column.id}
              title={column.title}
              subtitle={column.subtitle}
              rows={column.rows}
              renderRow={(row, index) => (
                <HourRow
                  key={row.datetime}
                  row={row}
                  units={units}
                  powerKw={powerKw}
                  average={average}
                  maxDeviation={maxDeviation}
                  past={isToday && hourOf(row.datetime) < currentHour}
                  rank={order === ORDER.PRICE ? column.offset + index + 1 : null}
                />
              )}
            />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          Coste: término de energía PVPC de una hora a {powerKw.toLocaleString("es-ES")} kW,
          sin impuestos ni término de potencia. Cambia la potencia en «¿Cuándo lo enciendo?».
        </Typography>
      </CardContent>
    </Card>
  );
}

export default HourlyBreakdown;
