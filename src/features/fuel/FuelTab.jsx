/* eslint-disable react/prop-types */
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
  applyDiscount,
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
import MyStations from "./MyStations";
import TripCost from "./TripCost";
import StationList from "./StationList";
import { t } from "../../i18n";

const sortedUnique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));

/**
 * Precio de los carburantes en las gasolineras de la zona del usuario.
 *
 * Los datos y el estado de red viven en `useFuelPrices` (con caché, porque esta
 * pestaña se desmonta al cambiar de sección); aquí se orquesta la zona, se
 * filtra y se pinta. Toda la lógica de cálculo está en `fuelData.js`.
 */
export function FuelTab({ energyCost }) {
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
    const priced = applyDiscount(priceStations(stations, prefs.fuel, origin), prefs.discount);
    if (isNearby) {
      return priced.filter((s) => s.distanceKm != null && s.distanceKm <= prefs.radiusKm);
    }
    return municipalityId ? priced.filter((s) => s.municipalityId === municipalityId) : priced;
  }, [stations, prefs.fuel, prefs.radiusKm, prefs.discount, origin, isNearby, municipalityId]);

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

  // Favoritas: las guardadas que están en la zona y con este combustible.
  const favoriteStations = useMemo(
    () => visible.filter((station) => prefs.favorites.includes(station.id)),
    [visible, prefs.favorites]
  );
  const toggleFavorite = (id) =>
    updatePrefs({
      favorites: prefs.favorites.includes(id)
        ? prefs.favorites.filter((favorite) => favorite !== id)
        : [...prefs.favorites, id],
    });

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
    ? t("fuel.nearYou")
    : t("fuel.inPlace", {
        place: municipalities.find((m) => m.id === municipalityId)?.name ?? provinceName(prefs.provinceId),
      });

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
        pose="pointing"
        title={t("fuel.tab.pickTitle")}
        description={isNearby ? t("fuel.tab.pickNearby") : t("fuel.tab.pickArea")}
        action={
          isNearby && geoStatus !== "denied" && geoStatus !== "unavailable" ? (
            <Button variant="contained" onClick={requestLocation} sx={{ minHeight: 44 }}>
              {t("fuel.tab.useLocation")}
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
        title={t("fuel.tab.errorTitle")}
        description={t("fuel.tab.errorBody")}
        onRetry={reload}
      />
    );
  } else if (!stats) {
    body = (
      <EmptyState
        title={t("fuel.tab.emptyTitle", { fuel: fuelLabel.toLowerCase(), scope: scopeLabel })}
        description={isNearby ? t("fuel.tab.emptyNearby") : t("fuel.tab.emptyArea")}
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
        <MyStations
          stations={favoriteStations}
          stats={stats}
          liters={prefs.liters}
          onToggleFavorite={toggleFavorite}
          hiddenCount={prefs.favorites.length - favoriteStations.length}
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
          favorites={prefs.favorites}
          onToggleFavorite={toggleFavorite}
        />
        <TripCost
          fuelLabel={fuelLabel}
          cheapest={stats.cheapest.price}
          average={stats.average}
          consumption={prefs.consumption}
          tripKm={prefs.tripKm}
          onPrefsChange={updatePrefs}
          energyCost={energyCost}
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
        // La pista espera a que haya gasolineras: nunca sobre la carga o un error.
        ready={Boolean(stats) && !loading && !error && !waitingForLocation}
      />

      {body}

      <Typography variant="caption" color="text.secondary">
        {t("fuel.tab.source", { updated: updatedAt ? formatUpdated(updatedAt) : null })}
      </Typography>
    </Stack>
  );
}

export default FuelTab;
