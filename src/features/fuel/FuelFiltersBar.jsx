/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocationOutlined";
import MapIcon from "@mui/icons-material/MapOutlined";
import LoyaltyIcon from "@mui/icons-material/LoyaltyOutlined";

import NumberField from "../../components/NumberField";

import { FUELS, MAIN_FUELS, OTHER_FUELS, SORTS } from "./fuelData";
import { PROVINCES_SORTED } from "./provinces";
import { MODES, RADIUS_OPTIONS } from "../../hooks/useFuelPrefs";
import { t } from "../../i18n";

const GEO_MESSAGES = ["denied", "unavailable", "error"];

/** Marcas con tarjeta o app de descuento más habituales en España. */
const DISCOUNT_BRANDS = ["Repsol", "Moeve", "BP", "Galp", "Shell", "Avia", "Carrefour", "Alcampo", "Eroski", "Ballenoil", "Plenoil", "Petroprix"];

/**
 * "Mi descuento": los céntimos por litro de la tarjeta o app de una marca. Los
 * datos del Ministerio son los del surtidor y no los incluyen; con esto el
 * ranking se ordena por lo que de verdad pagaría el usuario.
 */
function DiscountField({ discount, brands, onChange }) {
  const [brand, setBrand] = useState(discount?.brand ?? "");
  const [cents, setCents] = useState(discount?.cents ?? null);
  const options = [...new Set([...DISCOUNT_BRANDS, ...brands])].sort((a, b) => a.localeCompare(b, "es"));

  const commit = (nextBrand, nextCents) => {
    const name = nextBrand.trim();
    onChange(name && nextCents > 0 ? { brand: name, cents: nextCents } : null);
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary", minWidth: { sm: 130 } }}>
        <LoyaltyIcon fontSize="small" aria-hidden="true" />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t("fuel.filters.discount")}
        </Typography>
      </Stack>
      <Autocomplete
        freeSolo
        size="small"
        options={options}
        value={brand}
        onInputChange={(_, value) => {
          setBrand(value);
          commit(value, cents);
        }}
        renderInput={(params) => <TextField {...params} label={t("fuel.filters.brand")} />}
        sx={{ minWidth: { sm: 200 } }}
      />
      <NumberField
        size="small"
        label={t("fuel.filters.discountAmount")}
        unit={t("fuel.filters.discountUnit")}
        value={cents}
        max={50}
        onChange={(value) => {
          setCents(value);
          commit(brand, value);
        }}
        sx={{ maxWidth: { sm: 160 } }}
      />
      <Typography variant="caption" color="text.secondary">
        {discount ? t("fuel.filters.discountActive", { brand: discount.brand }) : t("fuel.filters.discountHint")}
      </Typography>
    </Stack>
  );
}

/**
 * Todos los controles de la pestaña. Combustible y zona van arriba porque
 * deciden lo que se descarga; marca, "abiertas" y litros solo afinan lo que
 * ya se ha descargado.
 */
export function FuelFiltersBar({
  prefs,
  onPrefsChange,
  geoStatus,
  onRequestLocation,
  municipalities,
  brands,
  brand,
  onBrandChange,
  onlyOpen,
  onOnlyOpenChange,
  sort,
  onSortChange,
}) {
  const isNearby = prefs.mode === MODES.NEARBY;
  const extraFuelSelected = OTHER_FUELS.includes(prefs.fuel) ? prefs.fuel : "";

  // El campo de litros admite escribir "5" de camino a "50": se edita como
  // texto y solo se guarda cuando el número es válido.
  const [litersText, setLitersText] = useState(String(prefs.liters));
  useEffect(() => setLitersText(String(prefs.liters)), [prefs.liters]);

  const handleLiters = (event) => {
    const text = event.target.value;
    setLitersText(text);
    const value = Number(text.replace(",", "."));
    if (Number.isFinite(value) && value > 0 && value <= 500) {
      onPrefsChange({ liters: value });
    }
  };

  const geoMessage = GEO_MESSAGES.includes(geoStatus) ? t(`fuel.filters.geo.${geoStatus}`) : null;

  return (
    <Card component="section" aria-label={t("fuel.filters.label")}>
      <CardContent>
        <Stack spacing={2}>
          {/* Combustible */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              color="primary"
              aria-label={t("fuel.filters.fuel")}
              value={MAIN_FUELS.includes(prefs.fuel) ? prefs.fuel : null}
              onChange={(_, value) => value && onPrefsChange({ fuel: value })}
              sx={{ flexGrow: 1, "& .MuiToggleButton-root": { minHeight: 44 } }}
            >
              {MAIN_FUELS.map((key) => (
                <ToggleButton key={key} value={key}>
                  {FUELS[key].label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              select
              size="small"
              label={t("fuel.filters.otherFuel")}
              value={extraFuelSelected}
              onChange={(event) => onPrefsChange({ fuel: event.target.value })}
              sx={{ minWidth: { sm: 210 } }}
            >
              {OTHER_FUELS.map((key) => (
                <MenuItem key={key} value={key}>
                  {FUELS[key].label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {/* Zona */}
          <Stack spacing={1.5}>
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              aria-label={t("fuel.filters.zoneMode")}
              value={prefs.mode}
              onChange={(_, value) => {
                if (!value) return;
                onPrefsChange({ mode: value });
                if (value === MODES.NEARBY && geoStatus !== "granted") onRequestLocation();
              }}
              sx={{ alignSelf: "flex-start", "& .MuiToggleButton-root": { minHeight: 44, px: 2 } }}
            >
              <ToggleButton value={MODES.AREA}>
                <MapIcon fontSize="small" sx={{ mr: 0.75 }} aria-hidden="true" />
                {t("fuel.filters.byArea")}
              </ToggleButton>
              <ToggleButton value={MODES.NEARBY}>
                <MyLocationIcon fontSize="small" sx={{ mr: 0.75 }} aria-hidden="true" />
                {t("fuel.filters.nearMe")}
              </ToggleButton>
            </ToggleButtonGroup>

            {isNearby ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <TextField
                  select
                  size="small"
                  label={t("fuel.filters.radius")}
                  value={prefs.radiusKm}
                  onChange={(event) => onPrefsChange({ radiusKm: Number(event.target.value) })}
                  sx={{ minWidth: { sm: 200 } }}
                >
                  {RADIUS_OPTIONS.map((km) => (
                    <MenuItem key={km} value={km}>
                      {km} km
                    </MenuItem>
                  ))}
                </TextField>
                <Typography variant="body2" color="text.secondary">
                  {geoStatus === "loading"
                    ? t("fuel.filters.locating")
                    : geoStatus === "granted"
                      ? t("fuel.filters.locationPrivacy")
                      : ""}
                </Typography>
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label={t("fuel.filters.province")}
                  value={prefs.provinceId}
                  onChange={(event) =>
                    onPrefsChange({ provinceId: event.target.value, municipalityId: "" })
                  }
                  sx={{ minWidth: { sm: 240 } }}
                >
                  {PROVINCES_SORTED.map((province) => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label={t("fuel.filters.municipality")}
                  value={municipalities.some((m) => m.id === prefs.municipalityId) ? prefs.municipalityId : ""}
                  onChange={(event) => onPrefsChange({ municipalityId: event.target.value })}
                  disabled={!municipalities.length}
                  sx={{ minWidth: { sm: 240 } }}
                >
                  <MenuItem value="">{t("fuel.filters.wholeProvince")}</MenuItem>
                  {municipalities.map((municipality) => (
                    <MenuItem key={municipality.id} value={municipality.id}>
                      {municipality.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            )}

            {isNearby && geoMessage && <Alert severity="warning">{geoMessage}</Alert>}
          </Stack>

          {/* Afinar */}
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              alignItems: "center",
              // Dos columnas también en móvil: así marca y litros no se comen
              // media pantalla antes de llegar al resultado.
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            <TextField
              select
              size="small"
              label={t("fuel.filters.brand")}
              value={brands.includes(brand) ? brand : ""}
              onChange={(event) => onBrandChange(event.target.value)}
            >
              <MenuItem value="">{t("fuel.filters.allBrands")}</MenuItem>
              {brands.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label={t("fuel.filters.liters")}
              value={litersText}
              onChange={handleLiters}
              InputProps={{
                endAdornment: <InputAdornment position="end">L</InputAdornment>,
              }}
              inputProps={{ inputMode: "decimal", "aria-describedby": "liters-help" }}
              error={!Number.isFinite(Number(litersText.replace(",", "."))) || Number(litersText.replace(",", ".")) <= 0}
            />

            {isNearby && (
              <TextField
                select
                size="small"
                label={t("fuel.filters.sortBy")}
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
              >
                <MenuItem value={SORTS.PRICE}>{t("fuel.filters.sortPrice")}</MenuItem>
                <MenuItem value={SORTS.DISTANCE}>{t("fuel.filters.sortDistance")}</MenuItem>
              </TextField>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={onlyOpen}
                  onChange={(event) => onOnlyOpenChange(event.target.checked)}
                />
              }
              label={t("fuel.filters.onlyOpen")}
              sx={{ mx: 0, minHeight: 44, gridColumn: { xs: "1 / -1", md: "auto" } }}
            />
          </Box>
          <Typography id="liters-help" variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            {t("fuel.filters.litersHelp")}
          </Typography>

          <DiscountField
            discount={prefs.discount}
            brands={brands}
            onChange={(discount) => onPrefsChange({ discount })}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default FuelFiltersBar;
