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
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

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

      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {/* --- Controles --- */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1, minHeight: 40 }}
            >
              <Typography
                variant="subtitle2"
                color="text.secondary"
                id="duration-label"
              >
                Duración
              </Typography>

              {/* En móvil, un paso -/+ en vez del slider: arrastrar con el
                  pulgar hasta una hora concreta es el peor control posible,
                  y así la cifra y su ajuste comparten fila (sin gastar alto). */}
              {fullScreen ? (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <IconButton
                    size="small"
                    aria-label="Una hora menos"
                    disabled={hours <= 1}
                    onClick={() => setHours((h) => Math.max(1, h - 1))}
                    sx={{ border: 1, borderColor: "divider" }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography
                    className="tabular"
                    sx={{ fontWeight: 700, minWidth: 44, textAlign: "center" }}
                  >
                    {hours} h
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Una hora más"
                    disabled={hours >= sliderMax}
                    onClick={() => setHours((h) => Math.min(sliderMax, h + 1))}
                    sx={{ border: 1, borderColor: "divider" }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : (
                <Typography className="tabular" sx={{ fontWeight: 700 }}>
                  {hours} h
                </Typography>
              )}
            </Stack>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={availablePresets.includes(hours) ? hours : null}
              aria-labelledby="duration-label"
              onChange={(_, value) => value && setHours(value)}
              sx={{
                flexWrap: "wrap",
                gap: 0.5,
                // Por defecto es inline-flex: en móvil dejaba hueco muerto a la
                // derecha y encogía el área táctil de cada atajo.
                display: "flex",
                width: { xs: "100%", sm: "auto" },
                "& .MuiToggleButton-root": {
                  border: 1,
                  flex: { xs: 1, sm: "0 0 auto" },
                  minHeight: 44,
                },
              }}
            >
              {availablePresets.map((value) => (
                <ToggleButton key={value} value={value} sx={{ px: { xs: 1, sm: 1.75 } }}>
                  {value} h
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {!fullScreen && (
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
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="space-between"
          >
            <TextField
              label="Potencia"
              size="small"
              value={powerText}
              onChange={handlePowerChange}
              // Un campo de 1-3 dígitos no necesita ancho completo: en móvil
              // ocupaba toda la fila para escribir "2".
              sx={{ width: 116, flexShrink: 0 }}
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
              sx={{ mr: 0 }}
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
                compact={fullScreen}
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
                        {/* Importe y media en columna a la derecha: en una sola
                            fila se apretaban en pantallas estrechas, sobre todo
                            en €/kWh (cinco decimales). */}
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography className="tabular" sx={{ fontWeight: 600 }}>
                            ≈ {formatEuros(euroCost(range.sumPrice, powerKw))}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            className="tabular"
                            display="block"
                          >
                            {formatPriceWithUnits(range.avgPrice, units)}
                          </Typography>
                        </Box>
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

      {/* A pantalla completa la X de la cabecera ya cierra: esta barra solo
          duplicaba la acción y robaba ~70 px permanentes de alto útil. */}
      {!fullScreen && (
        <DialogActions>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default CheapRangesDialog;
