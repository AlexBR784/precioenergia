import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";

import AppShell from "./layout/AppShell";
import PricesTab from "./features/prices/PricesTab";
import RecommendationsTab from "./features/recommendations/RecommendationsTab";
import FuelTab from "./features/fuel/FuelTab";
import BillTab from "./features/bill/BillTab";
import MaintenancePage from "./features/admin/MaintenancePage";
import { useAdmin } from "./hooks/useAdmin";
import { UNITS } from "./features/prices/priceFormat";
import { useEnergyCost } from "./hooks/useEnergyCost";
import { useDailyBaseline } from "./hooks/useDailyBaseline";
import { useNow } from "./hooks/useNow";
import { useEnergyPrefs } from "./hooks/useEnergyPrefs";
import { taxFactor } from "./data/spain";
import { useLiveTitle } from "./hooks/useLiveTitle";

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
  // Consumo importado en Factura: aquí para que no se pierda al cambiar de pestaña.
  const [usage, setUsage] = useState(null);

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
    baseline: rawBaseline,
    sampleDays,
    loading: baselineLoading,
  } = useDailyBaseline(selectedDate, { enabled: tipsLoaded });

  // "Con impuestos": se multiplican los precios una sola vez aquí, y gráfica,
  // tablas, costes y comparaciones salen ya con lo que se paga de verdad. El
  // factor es el mismo para todas las horas, así que los "más barato/caro" y
  // los porcentajes no cambian.
  const { prefs, region } = useEnergyPrefs();
  const factor = prefs.withTaxes ? taxFactor(region) : 1;
  const shownCost = useMemo(
    () => (factor === 1 || !energyCost ? energyCost : energyCost.map((item) => ({ ...item, value: item.value * factor }))),
    [energyCost, factor]
  );
  const baseline = rawBaseline == null ? rawBaseline : rawBaseline * factor;

  useLiveTitle(shownCost, dayjs(selectedDate).isSame(now, "day"), now);

  // `#mantenimiento`: la página del admin sustituye a la pestaña activa; al
  // pulsar una pestaña se sale de ella.
  const { open: maintenanceOpen, close: closeMaintenance } = useAdmin();
  const changeTab = (value) => {
    closeMaintenance();
    setActiveTab(value);
  };

  return (
    <AppShell activeTab={maintenanceOpen ? false : activeTab} onTabChange={changeTab}>
      {maintenanceOpen && <MaintenancePage />}

      {!maintenanceOpen && activeTab === "prices" && (
        <PricesTab
          energyCost={shownCost}
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

      {!maintenanceOpen && activeTab === "tips" && (
        <RecommendationsTab
          energyCost={shownCost}
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
          onOpenBill={() => setActiveTab("bill")}
        />
      )}

      {!maintenanceOpen && activeTab === "bill" && <BillTab usage={usage} onUsage={setUsage} />}

      {/* Carga diferida sin flag: los datos se piden al montar la pestaña y
          useFuelPrices los cachea, así que volver a ella no los repite. */}
      {!maintenanceOpen && activeTab === "fuel" && <FuelTab energyCost={shownCost} />}
    </AppShell>
  );
}

export default App;
