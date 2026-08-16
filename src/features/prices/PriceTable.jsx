/* eslint-disable react/prop-types */
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { formatPrice, formatHour } from "./priceFormat";
import PriceTierBadge from "../../components/PriceTierBadge";

/**
 * Tabla de precios por hora (a partir de `md`).
 *
 * Los colores de fila estaban antes escritos a mano (`#e5f6fd`, `#F4F4F4`,
 * `"white"`), lo que además de romperse en modo oscuro hacía que la hora
 * actual se distinguiera solo por color. Ahora sale del tema y lleva un chip.
 */
export function PriceTable({ rows, units }) {
  return (
    <TableContainer sx={{ maxHeight: 560, borderRadius: 2 }}>
      <Table stickyHeader size="small" aria-label="Precio de la electricidad por hora">
        <TableHead>
          <TableRow>
            <TableCell>Hora</TableCell>
            <TableCell align="right">Precio ({units})</TableCell>
            <TableCell>Tramo</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.datetime}
              sx={{
                bgcolor: row.isNow
                  ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.18 : 0.08)
                  : "transparent",
              }}
            >
              <TableCell sx={{ fontWeight: row.isNow ? 700 : 400 }}>
                {formatHour(row.datetime)}
                {row.isNow && (
                  <Chip
                    label="Ahora"
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: "0.6875rem" }}
                  />
                )}
              </TableCell>
              <TableCell
                align="right"
                className="tabular"
                sx={{ fontWeight: 600, color: `price.${row.tier}` }}
              >
                {formatPrice(row.value, units)}
              </TableCell>
              <TableCell>
                <PriceTierBadge tier={row.tier} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default PriceTable;
