/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import BestRangeCard from "./BestRangeCard";
import DayTimeline from "./DayTimeline";
import { findRanges, formatRangeLabel } from "./cheapRanges";
import {
  euroCost,
  formatEuros,
  formatPriceWithUnits,
} from "./priceFormat";

const DURATION_PRESETS = [1, 2, 3, 4, 6, 8];
const POWER_KEY = "precioenergia:power-kw";
const DEFAULT_POWER = 2;

const readStoredPower = () => {
  try {
    const stored = parseFloat(window.localStorage.getItem(POWER_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_POWER;
  } catch {
    return DEFAULT_POWER;
  }
};

/**
 * Calculadora de tramos consecutivos más baratos.
 *
 * Los resultados se calculan en vivo: el barrido es de ~24 posiciones, así que
 * un botón "Calcular" solo añadía un paso y hacía que el diálogo abriera vacío.
 */
export function CheapRangesDialog({ open, onClose, energyCost, units, isToday }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [hours, setHours] = useState(3);
  const [onlyFuture, setOnlyFuture] = useState(true);
  const [powerKw, setPowerKw] = useState(readStoredPower);
  const [powerText, setPowerText] = useState(() =>
    String(readStoredPower()).replace(".", ",")
  );
  const [copied, setCopied] = useState(false);

  const currentHour = new Date().getHours();
  const totalHours = energyCost?.length || 24;

  const futureHours = useMemo(() => {
    if (!energyCost) return totalHours;
    return energyCost.filter(
      (item) => parseInt(item.datetime.split(":")[0], 10) >= currentHour
    ).length;
  }, [energyCost, currentHour, totalHours]);

  const applyFutureFilter = onlyFuture && isToday;
  const sliderMax = Math.max(1, applyFutureFilter ? futureHours : totalHours);

  useEffect(() => {
    if (hours > sliderMax) setHours(sliderMax);
  }, [sliderMax, hours]);

  const { best, worst } = useMemo(
    () =>
      findRanges(energyCost, {
        hours,
        onlyFuture: applyFutureFilter,
        currentHour,
        topN: 3,
      }),
    [energyCost, hours, applyFutureFilter, currentHour]
  );

  const [bestRange, ...alternatives] = best;

  const handlePowerChange = (event) => {
    const text = event.target.value;
    setPowerText(text);

    const parsed = parseFloat(text.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) {
      setPowerKw(parsed);
      try {
        window.localStorage.setItem(POWER_KEY, String(parsed));
      } catch {
        // Persistir es opcional; el valor sigue vivo en esta sesión.
      }
    }
  };

  const copyBest = () => {
    if (!bestRange) return;

    const text = [
      `Mejor tramo de ${hours} h: ${formatRangeLabel(bestRange)}`,
      `Precio medio: ${formatPriceWithUnits(bestRange.avgPrice, units)}`,
      `Coste aprox.: ${formatEuros(euroCost(bestRange.sumPrice, powerKw))} a ${powerKw} kW`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const availablePresets = DURATION_PRESETS.filter((value) => value <= sliderMax);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="cheap-ranges-title"
    >
      <DialogTitle
        id="cheap-ranges-title"
        sx={{ pr: 6, fontSize: "1.125rem", fontWeight: 700 }}
      >
        ¿Cuándo lo enciendo?
        <IconButton
          aria-label="Cerrar"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12, color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* --- Controles --- */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="baseline"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                id="duration-label"
              >
                Duración
              </Typography>
              <Typography className="tabular" sx={{ fontWeight: 700 }}>
                {hours} h
              </Typography>
            </Stack>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={availablePresets.includes(hours) ? hours : null}
              aria-labelledby="duration-label"
              onChange={(_, value) => value && setHours(value)}
              sx={{ flexWrap: "wrap", gap: 0.5, "& .MuiToggleButton-root": { border: 1 } }}
            >
              {availablePresets.map((value) => (
                <ToggleButton key={value} value={value} sx={{ px: 1.75 }}>
                  {value} h
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Slider
              value={hours}
              min={1}
              max={sliderMax}
              step={1}
              valueLabelDisplay="auto"
              aria-labelledby="duration-label"
              onChange={(_, value) => setHours(value)}
              sx={{ mt: 1 }}
            />
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <TextField
              label="Potencia del aparato"
              size="small"
              value={powerText}
              onChange={handlePowerChange}
              sx={{ maxWidth: { sm: 190 } }}
              // `inputMode` suelto en TextField acaba en el FormControl raíz,
              // no en el <input>: hay que pasarlo por inputProps para que el
              // móvil abra el teclado numérico.
              inputProps={{ inputMode: "decimal", "aria-label": "Potencia en kilovatios" }}
              InputProps={{
                endAdornment: <InputAdornment position="end">kW</InputAdornment>,
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyFuture}
                  disabled={!isToday}
                  onChange={(_, checked) => setOnlyFuture(checked)}
                />
              }
              label={<Typography variant="body2">Solo desde ahora</Typography>}
            />
          </Stack>

          {/* --- Respuesta --- */}
          {bestRange ? (
            <>
              <BestRangeCard
                range={bestRange}
                worst={worst}
                units={units}
                powerKw={powerKw}
                hours={hours}
                isToday={isToday}
                onCopy={copyBest}
                copied={copied}
              />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  El día completo
                </Typography>
                <DayTimeline
                  energyCost={energyCost}
                  range={bestRange}
                  isToday={isToday}
                />
              </Box>

              {alternatives.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Otras opciones
                  </Typography>
                  <Stack spacing={1}>
                    {alternatives.map((range) => (
                      <Stack
                        key={`${range.startHour}-${range.endHour}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          px: 1.5,
                          py: 1,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <Typography className="tabular" sx={{ fontWeight: 600 }}>
                          {formatRangeLabel(range)}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="baseline">
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            className="tabular"
                          >
                            {formatPriceWithUnits(range.avgPrice, units)}
                          </Typography>
                          <Typography className="tabular" sx={{ fontWeight: 600 }}>
                            ≈ {formatEuros(euroCost(range.sumPrice, powerKw))}
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No quedan tramos de {hours} h disponibles hoy. Desmarca «Solo desde
              ahora» para ver los del día completo.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CheapRangesDialog;
