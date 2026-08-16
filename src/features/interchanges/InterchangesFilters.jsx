/* eslint-disable react/prop-types */
import { Button, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

/**
 * Rango de fechas del panel de intercambios.
 * El error de validación se muestra bajo el propio control en vez de en un
 * Alert suelto al final de la tarjeta.
 */
export function InterchangesFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  error,
  loading,
}) {
  const invalidRange = Boolean(error);

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      flexWrap="wrap"
      useFlexGap
    >
      <DatePicker
        label="Desde"
        format="DD/MM/YYYY"
        value={startDate}
        maxDate={dayjs()}
        onChange={onStartDateChange}
        slotProps={{
          textField: {
            size: "small",
            error: invalidRange,
            helperText: invalidRange ? error : " ",
            sx: { minWidth: 160 },
          },
        }}
      />
      <DatePicker
        label="Hasta"
        format="DD/MM/YYYY"
        value={endDate}
        maxDate={dayjs()}
        onChange={onEndDateChange}
        slotProps={{
          textField: {
            size: "small",
            error: invalidRange,
            helperText: " ",
            sx: { minWidth: 160 },
          },
        }}
      />
      <Button
        variant="contained"
        onClick={onSubmit}
        disabled={loading}
        sx={{ mt: { sm: 0.25 } }}
      >
        Actualizar
      </Button>
    </Stack>
  );
}

export default InterchangesFilters;
