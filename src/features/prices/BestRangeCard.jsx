/* eslint-disable react/prop-types */
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
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

/**
 * La respuesta a la pregunta del usuario, destacada.
 *
 * Antes los tres resultados compartían filas de tabla idénticas, aunque el
 * usuario hace una sola pregunta y quiere una sola respuesta.
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
}) {
  if (!range) return null;

  const currentHour = new Date().getHours();
  const status = rangeStatus(range, currentHour, isToday);
  const saving = savingPercent(range, worst);

  const bestCost = euroCost(range.sumPrice, powerKw);
  const worstCost = worst ? euroCost(worst.sumPrice, powerKw) : null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        borderColor: "primary.main",
        borderWidth: 2,
        bgcolor: "primarySoft",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-start" }}
      >
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

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
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

          <Typography
            className="tabular"
            sx={{ mt: 1.5, fontSize: "1.125rem", fontWeight: 700 }}
          >
            ≈ {formatEuros(bestCost)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            por {hours} h a {powerKw.toLocaleString("es-ES")} kW · solo energía,
            sin peajes ni impuestos
          </Typography>
        </Box>

        {saving != null && (
          <Box
            sx={{
              textAlign: { xs: "left", sm: "right" },
              flexShrink: 0,
              alignSelf: { xs: "stretch", sm: "auto" },
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent={{ xs: "flex-start", sm: "flex-end" }}
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
            {/* El porcentaje solo exagera: con mínimos muy bajos salen ahorros
                del 90 % que en euros son céntimos. Va siempre con el absoluto. */}
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
        )}
      </Stack>

      <Button
        size="small"
        onClick={onCopy}
        startIcon={copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
        sx={{ mt: 2 }}
      >
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </Paper>
  );
}

export default BestRangeCard;
