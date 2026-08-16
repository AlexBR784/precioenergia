/* eslint-disable react/prop-types */
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatPrice, formatHour } from "./priceFormat";
import PriceTierBadge from "../../components/PriceTierBadge";

/**
 * Lista de precios en tarjetas, para pantallas estrechas.
 *
 * Sustituye a la tabla de dos columnas comprimida. Aquí sí se aplica de verdad
 * el filtrado "desde la hora actual": la lógica que lo intentaba en App.jsx
 * calculaba un array que después no consumía nadie, así que no tenía efecto.
 */
export function PriceList({ rows, units, showAll, onToggleShowAll, canFilter }) {
  return (
    <Stack spacing={1} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {canFilter && (
        <Box component="li" sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
          <Button size="small" onClick={onToggleShowAll}>
            {showAll ? "Ver desde ahora" : "Ver día completo"}
          </Button>
        </Box>
      )}

      {rows.map((row) => (
        <Stack
          key={row.datetime}
          component="li"
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: 1,
            borderColor: row.isNow ? "primary.main" : "divider",
            bgcolor: row.isNow
              ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.06)
              : "background.paper",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 4,
              alignSelf: "stretch",
              borderRadius: 999,
              bgcolor: `price.${row.tier}`,
            }}
          />

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: row.isNow ? 700 : 600 }}>
                {formatHour(row.datetime)}
              </Typography>
              {row.isNow && (
                <Chip
                  label="Ahora"
                  size="small"
                  color="primary"
                  sx={{ height: 20, fontSize: "0.6875rem" }}
                />
              )}
            </Stack>
            <PriceTierBadge tier={row.tier} compact />
          </Box>

          <Typography
            className="tabular"
            sx={{ fontWeight: 700, color: `price.${row.tier}`, whiteSpace: "nowrap" }}
          >
            {formatPrice(row.value, units)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export default PriceList;
