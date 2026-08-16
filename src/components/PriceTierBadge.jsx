/* eslint-disable react/prop-types */
import { Box, Stack, Typography } from "@mui/material";
import { PRICE_TIER_LABELS } from "../theme/tokens";

/**
 * Indicador de tramo de precio: barra de color + etiqueta de texto.
 *
 * La etiqueta no es decorativa. Antes el precio se comunicaba únicamente por
 * color de fondo, lo que deja fuera a quien no distingue esos colores.
 */
export function PriceTierBadge({ tier, compact = false }) {
  const label = PRICE_TIER_LABELS[tier] ?? "";

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" component="span">
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          width: compact ? 4 : 6,
          height: compact ? 16 : 18,
          borderRadius: 999,
          flexShrink: 0,
          bgcolor: `price.${tier}`,
        }}
      />
      <Typography
        component="span"
        variant="caption"
        sx={{ color: "text.secondary", fontWeight: 600, whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

export default PriceTierBadge;
