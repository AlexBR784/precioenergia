import { useEffect, useMemo, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";

import { EmptyState, ErrorState } from "../../components/StateViews";
import { useFuelPrefs, MODES } from "../../hooks/useFuelPrefs";
import { useFuelPrices } from "../../hooks/useFuelPrices";
import { useGeolocation, useGeolocationGranted } from "../../hooks/useGeolocation";
import { useNow } from "../../hooks/useNow";
import {
  FUELS,
  SORTS,
  computeStats,
  isOpenNow,
  nearestProvinceIds,
  priceStations,
  sortStations,
} from "./fuelData";
import { formatUpdated } from "./fuelFormat";
import { provinceName } from "./provinces";
import FuelFiltersBar from "./FuelFiltersBar";
import FuelSkeleton from "./FuelSkeleton";
import FuelHero from "./FuelHero";
import FuelTrend from "./FuelTrend";
import StationList from "./StationList";

const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

/**
 * Precio de los carburantes en las gasolineras de la zona del usuario.
 *
 * Los datos y el estado de red viven en `useFuelPrices` (con caché, porque esta
 * pestaña se desmonta al cambiar de sección); aquí se orquesta la zona, se
 * filtra y se pinta. Toda la lógica de cálculo está en `fuelData.js`.
 */
export function FuelTab() {
  const { prefs, updatePrefs } = useFuelPrefs();
  const geo = useGeolocation();
  const geoGranted = useGeolocationGranted();

  // Filtros de sesión: afinan el ranking y no merece la pena recordarlos.
  const [brand, setBrand] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState(SORTS.PRICE);

  const now = useNow();

  // Si el usuario ya dio permiso en otra visita, "Cerca de mí" se recupera solo
  // al volver; si no, se espera a que lo pida (el navegador preguntaría de golpe).
  const { status: geoStatus, request: requestLocation } = geo;
  useEffect(() => {
    if (prefs.mode === MODES.NEARBY && geoStatus === "idle" && geoGranted) requestLocation();
  }, [prefs.mode, geoStatus, geoGranted, requestLocation]);

  const isNearby = prefs.mode === MODES.NEARBY;
  const origin = isNearby ? geo.position : null;

  const provinceIds = useMemo(() => {
    if (isNearby) return origin ? nearestProvinceIds(origin.lat, origin.lon, 2) : [];
    return prefs.provinceId ? [prefs.provinceId] : [];
  }, [isNearby, origin, prefs.provinceId]);

  const { stations, updatedAt, loading, error, reload } = useFuelPrices(provinceIds);

  const municipalities = useMemo(() => {
    if (isNearby) return [];
    const byId = new Map();
    stations.forEach((s) => byId.set(s.municipalityId, s.municipality));
    return [...byId]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [isNearby, stations]);

  // Una provincia recién elegida aún no tiene municipios cargados: no se filtra
  // por uno que pertenece a la anterior.
  const municipalityId = municipalities.some((m) => m.id === prefs.municipalityId)
    ? prefs.municipalityId
    : "";

  const scoped = useMemo(() => {
    const priced = priceStations(stations, prefs.fuel, origin);
    if (isNearby) {
      return priced.filter((s) => s.distanceKm != null && s.distanceKm <= prefs.radiusKm);
    }
    return municipalityId ? priced.filter((s) => s.municipalityId === municipalityId) : priced;
  }, [stations, prefs.fuel, prefs.radiusKm, origin, isNearby, municipalityId]);

  const brands = useMemo(() => sortedUnique(scoped.map((s) => s.brand)), [scoped]);

  const visible = useMemo(() => {
    const filtered = scoped.filter(
      (s) =>
        (!brand || s.brand === brand) &&
        // Un horario que no se entiende no descarta la gasolinera.
        (!onlyOpen || isOpenNow(s.schedule, now) !== false)
    );
    return sortStations(filtered, isNearby ? sort : SORTS.PRICE);
  }, [scoped, brand, onlyOpen, now, isNearby, sort]);

  const stats = useMemo(() => computeStats(visible), [visible]);

  // La tendencia va por provincia (así viene el histórico): con "Cerca de mí",
  // la más cercana. Su punto de hoy es la media de toda esa provincia.
  const trendProvinceId = provinceIds[0] ?? null;
  const trendTodayAverage = useMemo(() => {
    if (!trendProvinceId) return null;
    const inProvince = stations.filter((s) => s.provinceId === trendProvinceId);
    return computeStats(priceStations(inProvince, prefs.fuel))?.average ?? null;
  }, [stations, trendProvinceId, prefs.fuel]);

  const fuelLabel = FUELS[prefs.fuel].label;
  const scopeLabel = isNearby
    ? "cerca de ti"
    : `en ${municipalities.find((m) => m.id === municipalityId)?.name ?? provinceName(prefs.provinceId)}`;

  const resetKey = [
    prefs.fuel,
    prefs.mode,
    prefs.provinceId,
    municipalityId,
    prefs.radiusKm,
    brand,
    onlyOpen,
    sort,
  ].join("|");

  const waitingForLocation = isNearby && !origin;
  const needsZone = !isNearby && !prefs.provinceId;

  let body;
  if (needsZone || (waitingForLocation && geoStatus !== "loading")) {
    body = (
      <EmptyState
        title="Elige dónde quieres repostar"
        description={
          isNearby
            ? "Para buscar gasolineras cerca de ti necesitamos tu ubicación. Si prefieres no compartirla, elige tu provincia."
            : "Selecciona tu provincia (y tu municipio si quieres afinar) o pulsa «Cerca de mí»."
        }
        action={
          isNearby && geoStatus !== "denied" && geoStatus !== "unavailable" ? (
            <Button variant="contained" onClick={requestLocation} sx={{ minHeight: 44 }}>
              Usar mi ubicación
            </Button>
          ) : null
        }
      />
    );
  } else if (loading || (waitingForLocation && geoStatus === "loading")) {
    body = <FuelSkeleton />;
  } else if (error) {
    body = (
      <ErrorState
        title="No se han podido cargar las gasolineras"
        description="El servicio del Ministerio no ha respondido a tiempo. Suele ser algo puntual."
        onRetry={reload}
      />
    );
  } else if (!stats) {
    body = (
      <EmptyState
        title={`No encontramos ${fuelLabel.toLowerCase()} ${scopeLabel}`}
        description={
          isNearby
            ? "Prueba a ampliar el radio de búsqueda, quitar filtros o elegir otro combustible."
            : "Prueba a quitar filtros, elegir toda la provincia u otro combustible."
        }
      />
    );
  } else {
    body = (
      <>
        <FuelHero
          fuelLabel={fuelLabel}
          scopeLabel={scopeLabel}
          stats={stats}
          stations={visible}
          liters={prefs.liters}
        />
        <FuelTrend
          provinceId={trendProvinceId}
          provinceLabel={provinceName(trendProvinceId)}
          productId={FUELS[prefs.fuel].productId}
          todayAverage={trendTodayAverage}
          liters={prefs.liters}
        />
        <StationList
          stations={visible}
          stats={stats}
          liters={prefs.liters}
          showDistance={isNearby}
          now={now}
          resetKey={resetKey}
        />
      </>
    );
  }

  return (
    <Stack spacing={3}>
      <FuelFiltersBar
        prefs={prefs}
        onPrefsChange={updatePrefs}
        geoStatus={geoStatus}
        onRequestLocation={requestLocation}
        municipalities={municipalities}
        brands={brands}
        brand={brand}
        onBrandChange={setBrand}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}
        sort={sort}
        onSortChange={setSort}
      />

      {body}

      <Typography variant="caption" color="text.secondary">
        Precios comunicados por cada gasolinera al Ministerio para la Transición
        Ecológica y el Reto Demográfico
        {updatedAt ? ` (actualizados el ${formatUpdated(updatedAt)})` : ""}. Pueden
        haber cambiado desde entonces: confírmalos en el surtidor.
      </Typography>
    </Stack>
  );
}

export default FuelTab;
