/* eslint-disable react/prop-types */
import { Stack } from "@mui/material";
import dayjs from "dayjs";

import PriceFiltersBar from "./PriceFiltersBar";
import PriceHeadline from "./PriceHeadline";
import PriceChartCard from "./PriceChartCard";
import HourlyBreakdown from "./HourlyBreakdown";
import PricesSkeleton from "./PricesSkeleton";
import { convertPrice, exportDecimalsFor } from "./priceFormat";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats, hourOf } from "../../hooks/usePriceStats";
import { downloadCsv } from "../../utils/downloadCsv";

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
  onNavigateToTips,
}) {
  const stats = usePriceStats(energyCost, date);

  const exportToCsv = () => {
    if (!energyCost?.length) return;
    const decimals = exportDecimalsFor(units);
    const rows = [...energyCost]
      .sort((a, b) => hourOf(a.datetime) - hourOf(b.datetime))
      .map((item) => [
        item.datetime,
        Number(convertPrice(item.value, units).toFixed(decimals)),
      ]);

    downloadCsv(`Precios luz ${dayjs(date).format("DD-MM-YYYY")}.csv`, [
      ["Hora", `Precio (${units})`],
      ...rows,
    ]);
  };

  // Los ajustes se quedan visibles también sin datos o con error: si no, al
  // elegir "Mañana" antes de las 20:15 no habría forma de volver a hoy.
  const filters = (
    <PriceFiltersBar
      date={date}
      onDateChange={onDateChange}
      units={units}
      onUnitsChange={onUnitsChange}
    />
  );

  if (noData) {
    return (
      <Stack spacing={3}>
        {filters}
        <EmptyState
          title="Todavía no hay precios para este día"
          description="Red Eléctrica publica los precios del día siguiente sobre las 20:15 h. Prueba con otra fecha."
        />
      </Stack>
    );
  }

  if (timeoutFlag) {
    return (
      <Stack spacing={3}>
        {filters}
        <ErrorState
          title="No se han podido cargar los precios"
          description="Red Eléctrica no ha respondido a tiempo. Puedes volver a intentarlo."
          onRetry={() => fetchEnergyCost(date)}
        />
      </Stack>
    );
  }

  if (loading) return <PricesSkeleton />;

  return (
    <Stack spacing={3}>
      {filters}

      <PriceHeadline stats={stats} units={units} />

      <PriceChartCard data={energyCost} units={units} isToday={stats.isToday} />

      <HourlyBreakdown
        hours={stats.hours}
        units={units}
        average={stats.average}
        isToday={stats.isToday}
        onNavigateToTips={onNavigateToTips}
        onExport={energyCost?.length ? exportToCsv : null}
      />
    </Stack>
  );
}

export default PricesTab;
