/* eslint-disable react/prop-types */
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import DaySelector from "../../components/DaySelector";
import { UNITS } from "./priceFormat";
import { t } from "../../i18n";
import SupplyButton from "../supply/SupplyButton";

/**
 * Ajustes de la pestaña: qué día, qué suministro (tarifa, impuestos) y en
 * qué unidad.
 *
 * Ambos controles van en una sola línea, sin etiquetas encima: el selector de
 * día se explica solo ("Hoy · 26 oct") y la unidad también. Antes la fecha
 * llevaba la etiqueta incrustada y la unidad una etiqueta encima, así que no
 * quedaban alineadas. El orden de las horas vive en "Precio hora a hora" y la
 * descarga (CSV) junto a esa misma tabla, que es lo que descarga.
 */
export function PriceFiltersBar({ date, onDateChange, units, onUnitsChange }) {
  return (
    <Stack
      component="section"
      aria-label={t("prices.settings")}
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      <DaySelector value={date} onChange={onDateChange} />

      {/* En móvil va en su propia línea, a todo el ancho: así suministro y
          unidad caben juntos en vez de partirse en dos filas. */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        <SupplyButton />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={units}
          aria-label={t("prices.unitLabel")}
          onChange={(_, value) => value && onUnitsChange(value)}
          sx={{ "& .MuiToggleButton-root": { minHeight: 40, px: 1.5 } }}
        >
          <ToggleButton value={UNITS.KWH}>{UNITS.KWH}</ToggleButton>
          <ToggleButton value={UNITS.MWH}>{UNITS.MWH}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
}

export default PriceFiltersBar;
