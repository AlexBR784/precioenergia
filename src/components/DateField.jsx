/* eslint-disable react/prop-types */
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

/**
 * Selector de día de los precios.
 *
 * Vivía embebido en `PriceFiltersBar`, pero la pestaña de consejos necesita el
 * mismo control: sin él, quien entre directo ahí no podría cambiar de día.
 *
 * El máximo es mañana porque la API publica los precios del día siguiente sobre
 * las 20:15 h, y no hay nada más allá.
 */
export function DateField({ value, onChange, label = "Fecha", fullWidth = false }) {
  return (
    <DatePicker
      label={label}
      format="DD/MM/YYYY"
      value={dayjs(value)}
      maxDate={dayjs().add(1, "day")}
      onChange={onChange}
      slotProps={{
        textField: {
          size: "small",
          sx: fullWidth ? { width: "100%", maxWidth: 260 } : { minWidth: 170 },
        },
      }}
    />
  );
}

export default DateField;
