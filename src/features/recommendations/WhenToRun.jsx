/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import LaundryIcon from "@mui/icons-material/LocalLaundryServiceOutlined";
import DishwasherIcon from "@mui/icons-material/FlatwareOutlined";
import DryerIcon from "@mui/icons-material/DryCleaningOutlined";
import OvenIcon from "@mui/icons-material/MicrowaveOutlined";
import WaterHeaterIcon from "@mui/icons-material/HotTubOutlined";
import CarIcon from "@mui/icons-material/ElectricCarOutlined";

import { usePowerKw, readStoredPower } from "../../hooks/usePowerKw";
import { hourOf } from "../../hooks/usePriceStats";
import {
  findRanges,
  formatRangeLabel,
  rangeStatus,
  savingPercent,
} from "../prices/cheapRanges";
import { euroCost, formatEuros, formatPriceWithUnits } from "../prices/priceFormat";

/**
 * Aparatos típicos de una casa con su duración y potencia habituales. Un
 * particular no sabe que su lavadora son "2 kW": sabe que tiene lavadora.
 * Elegir uno rellena horas y potencia, que se pueden afinar después.
 */
const APPLIANCES = [
  { id: "washer", label: "Lavadora", hours: 2, kw: 2, Icon: LaundryIcon },
  { id: "dishwasher", label: "Lavavajillas", hours: 2, kw: 1.5, Icon: DishwasherIcon },
  { id: "dryer", label: "Secadora", hours: 1, kw: 2.5, Icon: DryerIcon },
  { id: "oven", label: "Horno", hours: 1, kw: 2, Icon: OvenIcon },
  { id: "heater", label: "Termo", hours: 3, kw: 1.5, Icon: WaterHeaterIcon },
  { id: "ev", label: "Coche eléctrico", hours: 4, kw: 7.4, Icon: CarIcon },
];

const MAX_HOURS = 12;

/** Cifra destacada con su etiqueta encima y una línea de contexto debajo. */
function Stat({ label, value, context, color }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        className="tabular"
        sx={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.3, color }}
      >
        {value}
      </Typography>
      {context && (
        <Typography variant="caption" color="text.secondary" className="tabular" display="block">
          {context}
        </Typography>
      )}
    </Box>
  );
}

function LegendItem({ swatch, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {swatch}
      <Typography variant="caption" color="text.secondary">
        {children}
      </Typography>
    </Stack>
  );
}

const TICKS = [0, 6, 12, 18, 24];

/**
 * El día como una pista de 24 h con tu franja marcada. Responde a "¿y eso
 * cuándo cae?" en una línea, sin repetir el gráfico de la pestaña de precios:
 * aquí no hace falta la forma del día, solo situar la respuesta.
 */
function RangeTrack({ total, best, worst, isToday }) {
  const pct = (hours) => `${(hours / total) * 100}%`;
  const now = new Date();
  const nowPos = ((now.getHours() + now.getMinutes() / 60) / total) * 100;

  const label = [
    `Tu franja, de ${formatRangeLabel(best)}`,
    worst ? `la más cara, de ${formatRangeLabel(worst)}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <Box sx={{ mt: 2.5 }}>
      <Box
        role="img"
        aria-label={`${label}.`}
        sx={{ position: "relative", height: 10, borderRadius: 999, bgcolor: "surfaceMuted" }}
      >
        {worst && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: pct(worst.startHour),
              width: pct(worst.endHour - worst.startHour),
              borderRadius: 999,
              bgcolor: "price.high",
              opacity: 0.35,
            }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: pct(best.startHour),
            width: pct(best.endHour - best.startHour),
            borderRadius: 999,
            bgcolor: "primary.main",
            transition: "left .25s ease, width .25s ease",
          }}
        />
        {isToday && (
          <Box
            sx={{
              position: "absolute",
              top: -4,
              bottom: -4,
              left: `${nowPos}%`,
              width: 2,
              ml: "-1px",
              borderRadius: 1,
              bgcolor: "text.primary",
            }}
          />
        )}
      </Box>

      <Box aria-hidden="true" sx={{ position: "relative", height: 16, mt: 0.75 }}>
        {TICKS.map((tick) => (
          <Typography
            key={tick}
            variant="caption"
            sx={{
              position: "absolute",
              left: `${(tick / 24) * 100}%`,
              transform: tick === 0 ? "none" : tick === 24 ? "translateX(-100%)" : "translateX(-50%)",
              color: "text.secondary",
              fontSize: "0.6875rem",
            }}
          >
            {String(tick).padStart(2, "0")}:00
          </Typography>
        ))}
      </Box>

      <Stack direction="row" flexWrap="wrap" useFlexGap sx={{ mt: 0.75, columnGap: 2, rowGap: 0.5 }}>
        <LegendItem swatch={<Box sx={{ width: 14, height: 6, borderRadius: 999, bgcolor: "primary.main" }} />}>
          Tu franja
        </LegendItem>
        {worst && (
          <LegendItem
            swatch={<Box sx={{ width: 14, height: 6, borderRadius: 999, bgcolor: "price.high", opacity: 0.35 }} />}
          >
            La más cara
          </LegendItem>
        )}
        {isToday && (
          <LegendItem swatch={<Box sx={{ width: 2, height: 12, borderRadius: 1, bgcolor: "text.primary" }} />}>
            Ahora
          </LegendItem>
        )}
      </Stack>
    </Box>
  );
}

/**
 * "¿Cuándo lo enciendo?": la calculadora de tramos baratos, integrada en la
 * pestaña de consejos.
 *
 * Antes era un diálogo que se abría desde un botón al final de la pestaña, y
 * la pestaña tenía además un gráfico "El día de un vistazo" que repetía lo que
 * ya enseña la pestaña de precios. Ahora es una sola sección, y el día se
 * resume en una pista de 24 h que solo sitúa tu franja (ver `RangeTrack`).
 *
 * Los resultados se calculan en vivo: el barrido es de ~24 posiciones.
 */
export function WhenToRun({ energyCost, units, isToday }) {
  const [hours, setHours] = useState(3);
  const [onlyFuture, setOnlyFuture] = useState(true);
  const [copied, setCopied] = useState(false);

  // La potencia se comparte con los consejos ("Lo que cambia en euros").
  const { powerKw, setPowerKw } = usePowerKw();
  const [powerText, setPowerText] = useState(() =>
    String(readStoredPower().value).replace(".", ",")
  );

  const currentHour = new Date().getHours();
  const applyFutureFilter = onlyFuture && isToday;

  const maxHours = useMemo(() => {
    const total = energyCost?.length || 24;
    const available = applyFutureFilter
      ? energyCost?.filter((item) => hourOf(item.datetime) >= currentHour).length ?? total
      : total;
    return Math.max(1, Math.min(MAX_HOURS, available));
  }, [energyCost, applyFutureFilter, currentHour]);

  // Si "solo desde ahora" deja menos horas de las pedidas, se usa el máximo
  // posible sin pisar lo que el usuario eligió.
  const effectiveHours = Math.min(hours, maxHours);

  const { best, worst } = useMemo(
    () =>
      findRanges(energyCost, {
        hours: effectiveHours,
        onlyFuture: applyFutureFilter,
        currentHour,
        topN: 3,
      }),
    [energyCost, effectiveHours, applyFutureFilter, currentHour]
  );
  const [bestRange, ...alternatives] = best;

  const selectedAppliance = APPLIANCES.find(
    (appliance) => appliance.hours === effectiveHours && appliance.kw === powerKw
  );

  const chooseAppliance = (appliance) => {
    setHours(appliance.hours);
    setPowerKw(appliance.kw);
    setPowerText(String(appliance.kw).replace(".", ","));
  };

  const handlePowerChange = (event) => {
    const text = event.target.value;
    setPowerText(text);
    const parsed = parseFloat(text.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) setPowerKw(parsed);
  };

  const status = bestRange ? rangeStatus(bestRange, currentHour, isToday) : null;
  const saving = bestRange ? savingPercent(bestRange, worst) : null;
  const bestCost = bestRange ? euroCost(bestRange.sumPrice, powerKw) : null;
  const worstCost = worst ? euroCost(worst.sumPrice, powerKw) : null;
  const powerLabel = powerKw.toLocaleString("es-ES");

  const copyBest = () => {
    if (!bestRange) return;
    const text = [
      `Mejor momento (${effectiveHours} h): ${formatRangeLabel(bestRange)}`,
      `Precio medio: ${formatPriceWithUnits(bestRange.avgPrice, units)}`,
      `Coste aprox.: ${formatEuros(bestCost)} a ${powerLabel} kW`,
    ].join("\n");
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Card component="section" aria-labelledby="when-heading">
      <CardContent>
        {/* --- Pregunta --- */}
        <Stack direction="row" spacing={1} alignItems="center">
          <ScheduleIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="when-heading">
            ¿Cuándo lo enciendo?
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Elige un aparato, o ajusta las horas y la potencia, y te decimos el
          momento más barato del día.
        </Typography>

        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          spacing={1}
          sx={{ mt: 2 }}
          role="group"
          aria-label="Aparato"
        >
          {APPLIANCES.map((appliance) => {
            const { Icon } = appliance;
            const selected = selectedAppliance?.id === appliance.id;
            return (
              <Chip
                key={appliance.id}
                icon={<Icon fontSize="small" />}
                label={appliance.label}
                onClick={() => chooseAppliance(appliance)}
                variant="outlined"
                aria-pressed={selected}
                sx={{
                  height: 36,
                  px: 0.5,
                  borderColor: selected ? "primary.main" : "divider",
                  bgcolor: selected ? "primarySoft" : "transparent",
                  color: selected ? "text.primary" : "text.secondary",
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            );
          })}
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 3 }}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary" id="hours-label">
              Duración
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              role="group"
              aria-labelledby="hours-label"
              sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
            >
              <IconButton
                size="small"
                aria-label="Una hora menos"
                disabled={effectiveHours <= 1}
                onClick={() => setHours(Math.max(1, effectiveHours - 1))}
                sx={{ borderRadius: 2 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography
                className="tabular"
                aria-live="polite"
                sx={{ fontWeight: 700, minWidth: 48, textAlign: "center" }}
              >
                {effectiveHours} h
              </Typography>
              <IconButton
                size="small"
                aria-label="Una hora más"
                disabled={effectiveHours >= maxHours}
                onClick={() => setHours(Math.min(maxHours, effectiveHours + 1))}
                sx={{ borderRadius: 2 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>

          <TextField
            label="Potencia"
            size="small"
            value={powerText}
            onChange={handlePowerChange}
            sx={{ width: { xs: "100%", sm: 130 } }}
            inputProps={{ inputMode: "decimal", "aria-label": "Potencia en kilovatios" }}
            InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={applyFutureFilter}
                disabled={!isToday}
                onChange={(_, checked) => setOnlyFuture(checked)}
              />
            }
            label={<Typography variant="body2">Solo desde ahora</Typography>}
            sx={{ mx: 0 }}
          />
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* --- Respuesta --- */}
        {bestRange ? (
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2.5, md: 4 },
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(0, 5fr)" },
              alignItems: "start",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Mejor momento
              </Typography>
              <Typography
                className="tabular"
                sx={{ fontSize: { xs: "1.75rem", sm: "2rem" }, fontWeight: 700, lineHeight: 1.15 }}
              >
                {formatRangeLabel(bestRange)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" className="tabular">
                  {formatPriceWithUnits(bestRange.avgPrice, units)} de media
                </Typography>
                {status && (
                  <Chip
                    size="small"
                    label={status.label}
                    variant="outlined"
                    sx={{ height: 22, fontSize: "0.6875rem", color: status.color, borderColor: "divider" }}
                  />
                )}
              </Stack>

              <RangeTrack
                total={energyCost.length}
                best={bestRange}
                worst={worst}
                isToday={isToday}
              />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "surfaceMuted",
                }}
              >
                <Stat
                  label="Coste"
                  value={`≈ ${formatEuros(bestCost)}`}
                  context={`${effectiveHours} h a ${powerLabel} kW`}
                />
                {saving != null ? (
                  <Stat
                    label="Ahorro"
                    value={`${Math.round(saving)} %`}
                    color="price.cheapest"
                    // El porcentaje solo exagera con mínimos muy bajos: va
                    // siempre con el importe del peor tramo.
                    context={`frente a ${formatRangeLabel(worst)} (${formatEuros(worstCost)})`}
                  />
                ) : (
                  <Box />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Término de energía PVPC, sin impuestos ni término de potencia.
              </Typography>

              {alternatives.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Otras opciones
                  </Typography>
                  <Stack divider={<Divider flexItem />}>
                    {alternatives.map((range) => (
                      <Stack
                        key={`${range.startHour}-${range.endHour}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                        spacing={1}
                        sx={{ py: 0.75 }}
                      >
                        <Typography className="tabular" sx={{ fontWeight: 600 }}>
                          {formatRangeLabel(range)}
                        </Typography>
                        <Typography className="tabular" variant="body2" color="text.secondary">
                          ≈ {formatEuros(euroCost(range.sumPrice, powerKw))}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}

              <Button
                size="small"
                onClick={copyBest}
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                sx={{ mt: 1, ml: -0.5 }}
              >
                {copied ? "Copiado" : "Copiar resultado"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No quedan tramos de {effectiveHours} h disponibles hoy. Desactiva «Solo
            desde ahora» para ver los del día completo.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default WhenToRun;
