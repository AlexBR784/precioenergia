/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import TableChartIcon from "@mui/icons-material/TableChartOutlined";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

import PriceFiltersBar from "./PriceFiltersBar";
import PriceSummaryCards from "./PriceSummaryCards";
import PriceChartCard from "./PriceChartCard";
import PriceTable from "./PriceTable";
import PriceList from "./PriceList";
import CheapRangesDialog from "./CheapRangesDialog";
import CheapestHourBanner from "./CheapestHourBanner";
import PricesSkeleton from "./PricesSkeleton";
import { convertPrice, decimalsFor } from "./priceFormat";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats, hourOf } from "../../hooks/usePriceStats";

/**
 * Pestaña de precios. Sustituye a los ternarios anidados que antes decidían
 * el layout completo dentro de App.jsx por guardas planas.
 */
export function PricesTab({
  energyCost,
  loading,
  timeoutFlag,
  noData,
  fetchEnergyCost,
  date,
  onDateChange,
  units,
  onUnitsChange,
}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const [order, setOrder] = useState("hour");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);

  const stats = usePriceStats(energyCost, date);

  const sortedRows = useMemo(() => {
    const rows = [...stats.hours];
    if (order === "price") {
      rows.sort((a, b) => a.value - b.value);
    } else {
      rows.sort((a, b) => hourOf(a.datetime) - hourOf(b.datetime));
    }
    return rows;
  }, [stats.hours, order]);

  // En móvil se muestran por defecto solo las horas que quedan por delante.
  const canFilterPastHours = isCompact && stats.isToday && order === "hour";
  const visibleRows = useMemo(() => {
    if (!canFilterPastHours || showAllHours) return sortedRows;
    const nowHour = new Date().getHours();
    return sortedRows.filter((row) => hourOf(row.datetime) >= nowHour);
  }, [sortedRows, canFilterPastHours, showAllHours]);

  const exportToExcel = () => {
    if (!energyCost?.length) return;
    const decimals = decimalsFor(units);
    const exportData = [...energyCost]
      .sort((a, b) => hourOf(a.datetime) - hourOf(b.datetime))
      .map((item) => ({
        Hora: item.datetime,
        [`Precio (${units})`]: Number(
          convertPrice(item.value, units).toFixed(decimals)
        ),
      }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Precios");
    XLSX.writeFile(
      workbook,
      `Precios luz ${dayjs(date).format("DD-MM-YYYY")}.xlsx`
    );
  };

  if (noData) {
    return (
      <EmptyState
        title="No hay datos para esta fecha"
        description="Red Eléctrica todavía no ha publicado los precios de ese día. Prueba con otra fecha."
      />
    );
  }

  if (timeoutFlag) {
    return (
      <ErrorState
        title="No se han podido cargar los precios"
        description="La API de Red Eléctrica no ha respondido a tiempo. Puedes volver a intentarlo."
        onRetry={() => fetchEnergyCost(date)}
      />
    );
  }

  if (loading) return <PricesSkeleton />;

  return (
    <Stack spacing={3}>
      <PriceFiltersBar
        date={date}
        onDateChange={onDateChange}
        units={units}
        onUnitsChange={onUnitsChange}
        order={order}
        onOrderChange={setOrder}
        onExport={exportToExcel}
        canExport={Boolean(energyCost?.length)}
      />

      <PriceSummaryCards stats={stats} units={units} />

      <CheapestHourBanner min={stats.min} units={units} isToday={stats.isToday} />

      <PriceChartCard data={energyCost} units={units} />

      <Card component="section" aria-labelledby="hours-heading">
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <TableChartIcon fontSize="small" color="primary" aria-hidden="true" />
              <Typography variant="h2" component="h2" id="hours-heading">
                Precio hora a hora
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<ScheduleIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Calcular tramos baratos
            </Button>
          </Stack>

          {isCompact ? (
            <PriceList
              rows={visibleRows}
              units={units}
              showAll={showAllHours}
              canFilter={canFilterPastHours}
              onToggleShowAll={() => setShowAllHours((prev) => !prev)}
            />
          ) : (
            <PriceTable rows={visibleRows} units={units} />
          )}
        </CardContent>
      </Card>

      <CheapRangesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        energyCost={energyCost}
        units={units}
        isToday={stats.isToday}
      />
    </Stack>
  );
}

export default PricesTab;
