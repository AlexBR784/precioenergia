import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

import AppShell from "./layout/AppShell";
import PricesTab from "./features/prices/PricesTab";
import RecommendationsTab from "./features/recommendations/RecommendationsTab";
import FuelTab from "./features/fuel/FuelTab";
import { UNITS } from "./features/prices/priceFormat";
import { useEnergyCost } from "./hooks/useEnergyCost";
import { useDailyBaseline } from "./hooks/useDailyBaseline";
import { useNow } from "./hooks/useNow";

const UNITS_KEY = "precioenergia:units";

const readStoredUnits = () => {
  try {
    const stored = window.localStorage.getItem(UNITS_KEY);
    if (Object.values(UNITS).includes(stored)) return stored;
  } catch {
    // Sin localStorage (modo privado, permisos): valor por defecto.
  }
  return UNITS.KWH;
};

function App() {
  const [activeTab, setActiveTab] = useState("prices");

  // --- Precios ---
  const { energyCost, loading, timeoutFlag, noData, fetchEnergyCost } =
    useEnergyCost();
  // €/kWh por defecto: es la unidad de la factura de un particular (€/MWh es
  // la del mercado mayorista). La elección se recuerda entre visitas.
  const [units, setUnitsState] = useState(readStoredUnits);
  const setUnits = useCallback((value) => {
    setUnitsState(value);
    try {
      window.localStorage.setItem(UNITS_KEY, value);
    } catch {
      // Persistir es opcional; la unidad sigue viva en esta sesión.
    }
  }, []);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().toDate());

  const handleDateChange = (value) => {
    if (!value?.isValid?.()) return;
    const date = value.toDate();
    setSelectedDate(date);
    fetchEnergyCost(date);
  };

  // Pasada la medianoche, quien estaba mirando "hoy" pasa al nuevo hoy (con
  // sus precios); quien había elegido otro día se queda en él.
  const now = useNow();
  const todayKey = dayjs(now).format("YYYY-MM-DD");
  const previousToday = useRef(todayKey);
  useEffect(() => {
    if (previousToday.current === todayKey) return;
    const wasViewingToday =
      dayjs(selectedDate).format("YYYY-MM-DD") === previousToday.current;
    previousToday.current = todayKey;
    if (wasViewingToday) handleDateChange(dayjs(now));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey]);

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

      {/* Carga diferida sin flag: los datos se piden al montar la pestaña y
          useFuelPrices los cachea, así que volver a ella no los repite. */}
      {activeTab === "fuel" && <FuelTab />}
    </AppShell>
  );
}

export default App;
