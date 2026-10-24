/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  Alert,
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

import { FUELS, MAIN_FUELS, OTHER_FUELS, SORTS } from "./fuelData";
import { PROVINCES_SORTED } from "./provinces";
import { MODES, RADIUS_OPTIONS } from "../../hooks/useFuelPrefs";

const GEO_MESSAGES = {
  denied:
    "No tenemos permiso para usar tu ubicación. Puedes activarlo en los ajustes del navegador o elegir tu provincia a mano.",
  unavailable: "Este navegador no permite obtener tu ubicación. Elige tu provincia a mano.",
  error: "No hemos podido obtener tu ubicación. Prueba de nuevo o elige tu provincia a mano.",
};

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

  const geoMessage = GEO_MESSAGES[geoStatus];

  return (
    <Card component="section" aria-label="Filtros de carburantes">
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
              aria-label="Combustible"
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
              label="Otro combustible"
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
              aria-label="Cómo elegir la zona"
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
                Por zona
              </ToggleButton>
              <ToggleButton value={MODES.NEARBY}>
                <MyLocationIcon fontSize="small" sx={{ mr: 0.75 }} aria-hidden="true" />
                Cerca de mí
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
                  label="Radio de búsqueda"
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
                    ? "Obteniendo tu ubicación…"
                    : geoStatus === "granted"
                      ? "Tu ubicación solo se usa en tu navegador, no se envía ni se guarda."
                      : ""}
                </Typography>
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label="Provincia"
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
                  label="Municipio"
                  value={municipalities.some((m) => m.id === prefs.municipalityId) ? prefs.municipalityId : ""}
                  onChange={(event) => onPrefsChange({ municipalityId: event.target.value })}
                  disabled={!municipalities.length}
                  sx={{ minWidth: { sm: 240 } }}
                >
                  <MenuItem value="">Toda la provincia</MenuItem>
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
              label="Marca"
              value={brands.includes(brand) ? brand : ""}
              onChange={(event) => onBrandChange(event.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {brands.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Para llenar"
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
                label="Ordenar por"
                value={sort}
                onChange={(event) => onSortChange(event.target.value)}
              >
                <MenuItem value={SORTS.PRICE}>Precio</MenuItem>
                <MenuItem value={SORTS.DISTANCE}>Distancia</MenuItem>
              </TextField>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={onlyOpen}
                  onChange={(event) => onOnlyOpenChange(event.target.checked)}
                />
              }
              label="Solo abiertas ahora"
              sx={{ mx: 0, minHeight: 44, gridColumn: { xs: "1 / -1", md: "auto" } }}
            />
          </Box>
          <Typography id="liters-help" variant="caption" color="text.secondary" sx={{ mt: -1 }}>
            Los litros se usan para calcular cuánto cuesta llenar el depósito.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default FuelFiltersBar;
