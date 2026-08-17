import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";

import AppShell from "./layout/AppShell";
import PricesTab from "./features/prices/PricesTab";
import RecommendationsTab from "./features/recommendations/RecommendationsTab";
import InterchangesTab from "./features/interchanges/InterchangesTab";
import { UNITS } from "./features/prices/priceFormat";
import { useEnergyCost } from "./hooks/useEnergyCost";
import { useDailyBaseline } from "./hooks/useDailyBaseline";
import { useInterchanges } from "./hooks/useInterchanges";

function App() {
  const [activeTab, setActiveTab] = useState("prices");

  // --- Precios ---
  const { energyCost, loading, timeoutFlag, noData, fetchEnergyCost } =
    useEnergyCost();
  const [units, setUnits] = useState(UNITS.MWH);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().toDate());

  const handleDateChange = (value) => {
    if (!value?.isValid?.()) return;
    const date = value.toDate();
    setSelectedDate(date);
    fetchEnergyCost(date);
  };

  // --- Consejos ---
  // La referencia de "caro o barato" es una petición extra, así que solo se
  // pide cuando el usuario entra en la pestaña (igual que los intercambios).
  const [tipsLoaded, setTipsLoaded] = useState(false);

  useEffect(() => {
    if (activeTab === "tips" && !tipsLoaded) setTipsLoaded(true);
  }, [activeTab, tipsLoaded]);

  const {
    baseline,
    sampleDays,
    loading: baselineLoading,
  } = useDailyBaseline(selectedDate, { enabled: tipsLoaded });

  // --- Intercambios ---
  const {
    interchangesData,
    loading: interchangesLoading,
    error: interchangesError,
    lastUpdate: interchangesLastUpdate,
    fetchInterchanges,
  } = useInterchanges();

  const [startDate, setStartDate] = useState(() => dayjs().subtract(12, "month"));
  const [endDate, setEndDate] = useState(() => dayjs());
  const [rangeError, setRangeError] = useState("");
  const [interchangesLoaded, setInterchangesLoaded] = useState(false);

  const loadInterchanges = useCallback(
    (start, end) => {
      if (!start?.isValid?.() || !end?.isValid?.()) {
        setRangeError("Selecciona fechas válidas.");
        return;
      }
      if (start.isAfter(end, "day")) {
        setRangeError("La fecha de inicio no puede ser posterior a la de fin.");
        return;
      }

      setRangeError("");
      fetchInterchanges(start.toDate(), end.toDate());
      setInterchangesLoaded(true);
    },
    [fetchInterchanges]
  );

  // Carga diferida: los intercambios solo se piden al abrir su pestaña.
  useEffect(() => {
    if (activeTab === "interchanges" && !interchangesLoaded) {
      loadInterchanges(startDate, endDate);
    }
  }, [activeTab, interchangesLoaded, loadInterchanges, startDate, endDate]);

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "prices" && (
        <PricesTab
          energyCost={energyCost}
          loading={loading}
          timeoutFlag={timeoutFlag}
          noData={noData}
          fetchEnergyCost={fetchEnergyCost}
          date={selectedDate}
          onDateChange={handleDateChange}
          units={units}
          onUnitsChange={setUnits}
          onNavigateToTips={() => setActiveTab("tips")}
        />
      )}

      {activeTab === "tips" && (
        <RecommendationsTab
          energyCost={energyCost}
          loading={loading}
          timeoutFlag={timeoutFlag}
          noData={noData}
          fetchEnergyCost={fetchEnergyCost}
          date={selectedDate}
          onDateChange={handleDateChange}
          units={units}
          baseline={baseline}
          sampleDays={sampleDays}
          baselineLoading={baselineLoading}
        />
      )}

      {activeTab === "interchanges" && (
        <InterchangesTab
          data={interchangesData}
          loading={interchangesLoading}
          error={interchangesError}
          lastUpdate={interchangesLastUpdate}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onSubmit={() => loadInterchanges(startDate, endDate)}
          rangeError={rangeError}
        />
      )}
    </AppShell>
  );
}

export default App;
