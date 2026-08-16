import { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";

import AppShell from "./layout/AppShell";
import PricesTab from "./features/prices/PricesTab";
import InterchangesTab from "./features/interchanges/InterchangesTab";
import { UNITS } from "./features/prices/priceFormat";
import { useEnergyCost } from "./hooks/useEnergyCost";
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
      {activeTab === "prices" ? (
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
        />
      ) : (
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
