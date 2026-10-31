/* eslint-disable react/prop-types */
import { Stack } from "@mui/material";
import dayjs from "dayjs";

import PriceFiltersBar from "./PriceFiltersBar";
import PriceSummary from "./PriceSummary";
import PriceChartCard from "./PriceChartCard";
import HourlyBreakdown from "./HourlyBreakdown";
import MonthlyHistory from "./MonthlyHistory";
import PricesSkeleton from "./PricesSkeleton";
import TomorrowPreview from "../recommendations/TomorrowPreview";
import { convertPrice, exportDecimalsFor } from "./priceFormat";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats, hourOf } from "../../hooks/usePriceStats";
import { downloadCsv } from "../../utils/downloadCsv";
import { t } from "../../i18n";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";

/**
 * Pestaña de precios, en formato editorial: el precio de ahora y lo que hay
 * que saber en frases arriba, y debajo el detalle (gráfico, horas, el mes)
 * en secciones separadas por una línea, sin tarjetas.
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
  const { prefs } = useEnergyPrefs();

  const exportToCsv = () => {
    if (!energyCost?.length) return;
    const decimals = exportDecimalsFor(units);
    const rows = [...energyCost]
      .sort((a, b) => hourOf(a.datetime) - hourOf(b.datetime))
      .map((item) => [
        item.datetime,
        Number(convertPrice(item.value, units).toFixed(decimals)),
      ]);

    downloadCsv(t("prices.csv.file", { date: dayjs(date).format("DD-MM-YYYY") }), [
      [t("prices.csv.hour"), t(prefs.withTaxes ? "prices.csv.priceTaxes" : "prices.csv.price", { units })],
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
      // La pista espera a que haya precios: nunca sobre la carga o un error.
      ready={!loading && !timeoutFlag && !noData}
    />
  );

  if (noData) {
    const empty = (
      <EmptyState
        pose="sleep"
        title={t("prices.noData.title")}
        description={t("prices.noData.body")}
      />
    );
    const isTomorrow = dayjs(date).isSame(dayjs().add(1, "day"), "day");
    return (
      <Stack spacing={3}>
        {filters}
        {/* Mañana sin PVPC: el avance con el mercado mayorista, si ya lo hay. */}
        {isTomorrow ? <TomorrowPreview fallback={empty} /> : empty}
      </Stack>
    );
  }

  if (timeoutFlag) {
    return (
      <Stack spacing={3}>
        {filters}
        <ErrorState
          title={t("prices.error.title")}
          description={t("prices.error.body")}
          onRetry={() => fetchEnergyCost(date)}
        />
      </Stack>
    );
  }

  if (loading) return <PricesSkeleton />;

  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      {filters}

      <PriceSummary stats={stats} units={units} date={date} />

      <PriceChartCard data={energyCost} units={units} isToday={stats.isToday} date={date} />

      <HourlyBreakdown
        hours={stats.hours}
        units={units}
        average={stats.average}
        isToday={stats.isToday}
        onNavigateToTips={onNavigateToTips}
        onExport={energyCost?.length ? exportToCsv : null}
      />

      <MonthlyHistory units={units} />
    </Stack>
  );
}

export default PricesTab;
