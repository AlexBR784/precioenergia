/* eslint-disable react/prop-types */
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { ExcelIcon } from "../../assets/Excel";
import { UNITS } from "./priceFormat";

/**
 * Agrupa en una sola barra los cuatro controles que antes estaban repartidos
 * por la página (fecha y unidades arriba, orden a media altura, descarga al
 * final del Card). El contenedor anterior era un <div> con `space-between`
 * sin `flex-wrap` ni `gap`, así que los controles se solapaban al estrecharse.
 */
export function PriceFiltersBar({
  date,
  onDateChange,
  units,
  onUnitsChange,
  order,
  onOrderChange,
  onExport,
  canExport,
}) {
  return (
    <Stack
      component="section"
      aria-label="Filtros"
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: "stretch", md: "flex-end" }}
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", sm: "flex-end" }}
        flexWrap="wrap"
        useFlexGap
      >
        <DatePicker
          label="Fecha"
          format="DD/MM/YYYY"
          value={dayjs(date)}
          maxDate={dayjs().add(1, "day")}
          onChange={onDateChange}
          slotProps={{ textField: { size: "small", sx: { minWidth: 170 } } }}
        />

        <Box>
          <Typography
            variant="caption"
            component="div"
            id="units-label"
            color="text.secondary"
            sx={{ mb: 0.5, fontWeight: 600 }}
          >
            Unidades
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={units}
            aria-labelledby="units-label"
            onChange={(_, value) => value && onUnitsChange(value)}
          >
            <ToggleButton value={UNITS.MWH}>{UNITS.MWH}</ToggleButton>
            <ToggleButton value={UNITS.KWH}>{UNITS.KWH}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography
            variant="caption"
            component="div"
            id="order-label"
            color="text.secondary"
            sx={{ mb: 0.5, fontWeight: 600 }}
          >
            Ordenar por
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={order}
            aria-labelledby="order-label"
            onChange={(_, value) => value && onOrderChange(value)}
          >
            <ToggleButton value="hour">Hora</ToggleButton>
            <ToggleButton value="price">Precio</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>

      <Tooltip title="Descargar los precios del día en Excel">
        <span>
          <Button
            onClick={onExport}
            disabled={!canExport}
            variant="outlined"
            startIcon={<ExcelIcon />}
          >
            Descargar
          </Button>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default PriceFiltersBar;
