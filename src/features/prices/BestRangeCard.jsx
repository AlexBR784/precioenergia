/* eslint-disable react/prop-types */
import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import {
  formatEuros,
  formatPriceWithUnits,
  euroCost,
} from "./priceFormat";
import {
  formatRangeLabel,
  rangeStatus,
  savingPercent,
} from "./cheapRanges";

/** Cabecera: la respuesta en sí. Idéntica en móvil y escritorio. */
function Answer({ range, status, units, compact }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Mejor momento
      </Typography>

      <Typography
        className="tabular"
        sx={{
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
          fontWeight: 700,
          lineHeight: 1.15,
          mt: 0.25,
        }}
      >
        {formatRangeLabel(range)}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mt: compact ? 0.5 : 0.75 }}
      >
        <Typography variant="body2" color="text.secondary" className="tabular">
          {formatPriceWithUnits(range.avgPrice, units)} de media
        </Typography>
        {status && (
          <Chip
            size="small"
            label={status.label}
            sx={{
              height: 22,
              fontSize: "0.6875rem",
              color: status.color,
              bgcolor: "background.paper",
              border: 1,
              borderColor: "divider",
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

/** Coste estimado del tramo recomendado. */
function Cost({ cost, hours, powerKw, compact }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography className="tabular" sx={{ fontSize: "1.125rem", fontWeight: 700 }}>
        ≈ {formatEuros(cost)}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        por {hours} h a {powerKw.toLocaleString("es-ES")} kW
        {/* En móvil la advertencia se abrevia: la nota completa ya está en el
            pie de la página y aquí robaba tres líneas de alto. */}
        {!compact && " · término de energía PVPC, sin impuestos"}
      </Typography>
    </Box>
  );
}

/** Ahorro frente a la peor ventana de la misma duración. */
function Saving({ saving, worst, worstCost, align = "left" }) {
  return (
    <Box sx={{ textAlign: align, minWidth: 0 }}>
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        justifyContent={align === "right" ? "flex-end" : "flex-start"}
      >
        <TrendingDownIcon fontSize="small" sx={{ color: "price.cheapest" }} />
        <Typography
          className="tabular"
          sx={{ fontWeight: 700, color: "price.cheapest", fontSize: "1.25rem" }}
        >
          {Math.round(saving)} %
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block">
        más barato que el peor tramo
      </Typography>
      {/* El porcentaje solo exagera: con mínimos muy bajos salen ahorros del
          90 % que en euros son céntimos. Va siempre con el absoluto. */}
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        className="tabular"
        sx={{ mt: 0.25 }}
      >
        ({formatRangeLabel(worst)}: {formatEuros(worstCost)})
      </Typography>
    </Box>
  );
}

/**
 * La respuesta a la pregunta del usuario, destacada.
 *
 * `compact` (el diálogo a pantalla completa) reorganiza coste y ahorro en dos
 * columnas: apilados ocupaban casi todo el alto de un teléfono y dejaban las
 * alternativas fuera de pantalla.
 */
export function BestRangeCard({
  range,
  worst,
  units,
  powerKw,
  hours,
  isToday,
  onCopy,
  copied,
  compact = false,
}) {
  if (!range) return null;

  const currentHour = new Date().getHours();
  const status = rangeStatus(range, currentHour, isToday);
  const saving = savingPercent(range, worst);

  const bestCost = euroCost(range.sumPrice, powerKw);
  const worstCost = worst ? euroCost(worst.sumPrice, powerKw) : null;

  const copyButton = (
    <Button
      size="small"
      onClick={onCopy}
      startIcon={copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
      sx={{ mt: compact ? 1.5 : 2, ml: -0.5 }}
    >
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );

  if (compact) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 3,
          borderColor: "primary.main",
          borderWidth: 2,
          bgcolor: "primarySoft",
        }}
      >
        <Answer range={range} status={status} units={units} compact />

        <Stack
          direction="row"
          spacing={2}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ mt: 1.5 }}
        >
          <Cost cost={bestCost} hours={hours} powerKw={powerKw} compact />
          {saving != null && (
            <Saving saving={saving} worst={worst} worstCost={worstCost} />
          )}
        </Stack>

        {copyButton}
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        borderColor: "primary.main",
        borderWidth: 2,
        bgcolor: "primarySoft",
      }}
    >
      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Answer range={range} status={status} units={units} />
          <Box sx={{ mt: 1.5 }}>
            <Cost cost={bestCost} hours={hours} powerKw={powerKw} />
          </Box>
        </Box>

        {saving != null && (
          <Box sx={{ flexShrink: 0 }}>
            <Saving
              saving={saving}
              worst={worst}
              worstCost={worstCost}
              align="right"
            />
          </Box>
        )}
      </Stack>

      {copyButton}
    </Paper>
  );
}

export default BestRangeCard;
