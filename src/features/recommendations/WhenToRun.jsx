/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import EventIcon from "@mui/icons-material/EventAvailableOutlined";
import ShareIcon from "@mui/icons-material/ShareOutlined";
import TuneIcon from "@mui/icons-material/TuneOutlined";
import LaundryIcon from "@mui/icons-material/LocalLaundryServiceOutlined";
import DishwasherIcon from "@mui/icons-material/FlatwareOutlined";
import DryerIcon from "@mui/icons-material/DryCleaningOutlined";
import OvenIcon from "@mui/icons-material/MicrowaveOutlined";
import WaterHeaterIcon from "@mui/icons-material/HotTubOutlined";
import CarIcon from "@mui/icons-material/ElectricCarOutlined";

import { usePowerKw, readStoredPower } from "../../hooks/usePowerKw";
import { useNow } from "../../hooks/useNow";
import { downloadIcs } from "../../utils/calendar";
import { shareText } from "../../utils/share";
import { hourOf } from "../../hooks/usePriceStats";
import { findRanges, formatRangeLabel, rangeStatus } from "../prices/cheapRanges";
import { euroCost, formatEuros, formatPriceWithUnits } from "../prices/priceFormat";
import { t } from "../../i18n";
import { formatNumber } from "../../i18n/format";
import Hint from "../../guide/Hint";

/**
 * Aparatos típicos de una casa con su duración y potencia habituales. Un
 * particular no sabe que su lavadora son "2 kW": sabe que tiene lavadora.
 * Elegir uno rellena horas y potencia; "Otro" deja ajustarlas a mano.
 */
const APPLIANCES = [
  { id: "washer", hours: 2, kw: 2, Icon: LaundryIcon },
  { id: "dishwasher", hours: 2, kw: 1.5, Icon: DishwasherIcon },
  { id: "dryer", hours: 1, kw: 2.5, Icon: DryerIcon },
  { id: "oven", hours: 1, kw: 2, Icon: OvenIcon },
  { id: "heater", hours: 3, kw: 1.5, Icon: WaterHeaterIcon },
  { id: "ev", hours: 4, kw: 7.4, Icon: CarIcon },
].map((appliance) => ({
  ...appliance,
  get label() {
    return t(`tips.when.appliances.${appliance.id}`);
  },
}));

const MAX_HOURS = 12;
/**
 * La referencia del ahorro: la hora a la que se pondría sin pensarlo, al
 * llegar a casa. Antes se comparaba con la peor franja del día, que nadie
 * elige a propósito, y salían ahorros del 90 % que no se iban a dar.
 */
const HOME_HOUR = 19;
/** Horas de separación mínima para que la alternativa sea "otro momento" y no la misma franja movida. */
const ALTERNATIVE_GAP = 2;
const TICKS = [0, 6, 12, 18, 24];

const hhmm = (hour) => `${String(hour).padStart(2, "0")}:00`;

/** Coste de empezar a una hora concreta, si la franja entera cabe en el día. */
const costFrom = (energyCost, startHour, hours, kw) => {
  const slice = energyCost.filter((item) => {
    const hour = hourOf(item.datetime);
    return hour >= startHour && hour < startHour + hours;
  });
  if (slice.length !== hours) return null;
  return euroCost(slice.reduce((sum, item) => sum + item.value, 0), kw);
};

/**
 * El día en 24 barras (el precio de cada hora) con la franja elegida en
 * dorado y lo que ya ha pasado, atenuado. Enseña por qué esa hora es la buena
 * sin tener que ir a la pestaña de precios.
 */
function DayBars({ energyCost, best, isToday, currentHour }) {
  const values = energyCost.map((item) => item.value);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;

  return (
    <Box>
      <Box
        role="img"
        aria-label={t("tips.when.chart", { range: formatRangeLabel(best) })}
        sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 64 }}
      >
        {energyCost.map((item) => {
          const hour = hourOf(item.datetime);
          const inBest = hour >= best.startHour && hour < best.endHour;
          const past = isToday && hour < currentHour;
          return (
            <Box
              key={item.datetime}
              sx={{
                flex: 1,
                height: `${12 + ((item.value - min) / span) * 88}%`,
                borderRadius: "3px 3px 0 0",
                bgcolor: inBest ? "secondary.main" : (theme) => alpha(theme.palette.text.primary, 0.16),
                opacity: past && !inBest ? 0.45 : 1,
                transition: "background-color 200ms ease",
              }}
            />
          );
        })}
      </Box>
      <Box aria-hidden="true" sx={{ position: "relative", height: 16, mt: 0.5 }}>
        {TICKS.map((tick) => (
          <Typography
            key={tick}
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              left: `${(tick / 24) * 100}%`,
              transform: tick === 0 ? "none" : tick === 24 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {String(tick).padStart(2, "0")}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/**
 * "Cuándo poner cada aparato": eliges qué quieres poner y la respuesta va primero
 * ("Mejor hora para empezar: 12:00"), con lo que cuesta y lo que ahorras en
 * euros frente a ponerlo al llegar a casa. Debajo, el día en barras para ver
 * por qué, las acciones (calendario, compartir) junto a la hora que añaden y
 * una sola alternativa que de verdad sea otro momento del día.
 *
 * Con el día de hoy siempre se mira desde ahora; para el resto, "Mañana".
 */
export function WhenToRun({ energyCost, units, isToday, date }) {
  const [hours, setHours] = useState(2);
  const [customOpen, setCustomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calendarButton, setCalendarButton] = useState(null);

  // La potencia se comparte con los consejos ("Lo que cambia en euros").
  const { powerKw, setPowerKw } = usePowerKw();
  const [powerText, setPowerText] = useState(() => String(readStoredPower().value).replace(".", ","));

  const currentHour = useNow().getHours();

  const maxHours = useMemo(() => {
    const total = energyCost?.length || 24;
    const available = isToday
      ? energyCost?.filter((item) => hourOf(item.datetime) >= currentHour).length ?? total
      : total;
    return Math.max(1, Math.min(MAX_HOURS, available));
  }, [energyCost, isToday, currentHour]);

  // Si a esta hora quedan menos horas de las pedidas, se usa el máximo posible
  // sin pisar lo que el usuario eligió.
  const effectiveHours = Math.min(hours, maxHours);

  const ranges = useMemo(
    () => findRanges(energyCost, { hours: effectiveHours, onlyFuture: isToday, currentHour, topN: 48 }).best,
    [energyCost, effectiveHours, isToday, currentHour]
  );
  const bestRange = ranges[0];
  const alternative = bestRange
    ? ranges.find(
        (range) =>
          range.startHour >= bestRange.endHour + ALTERNATIVE_GAP || range.endHour <= bestRange.startHour - ALTERNATIVE_GAP
      )
    : null;

  const selectedAppliance = APPLIANCES.find(
    (appliance) => appliance.hours === effectiveHours && appliance.kw === powerKw
  );
  const showCustom = customOpen || !selectedAppliance;

  const chooseAppliance = (appliance) => {
    setHours(appliance.hours);
    setPowerKw(appliance.kw);
    setPowerText(String(appliance.kw).replace(".", ","));
    setCustomOpen(false);
  };

  const handlePowerChange = (event) => {
    const text = event.target.value;
    setPowerText(text);
    const parsed = parseFloat(text.replace(",", "."));
    if (Number.isFinite(parsed) && parsed > 0) setPowerKw(parsed);
  };

  const status = bestRange ? rangeStatus(bestRange, currentHour, isToday) : null;
  const bestCost = bestRange ? euroCost(bestRange.sumPrice, powerKw) : null;
  const powerLabel = formatNumber(powerKw);
  const taskName = selectedAppliance ? selectedAppliance.label : t("tips.when.genericAppliance", { kw: powerLabel });

  // Ahorro honesto: frente a ponerlo al llegar a casa; si esa es justo la mejor
  // hora (o no cabe en el día), frente a una hora cualquiera (la media del día).
  const savingText = useMemo(() => {
    if (!bestRange || bestCost == null) return null;
    const minimum = 0.01;
    const home = bestRange.startHour !== HOME_HOUR ? costFrom(energyCost, HOME_HOUR, effectiveHours, powerKw) : null;
    if (home != null && home - bestCost >= minimum) {
      return t("tips.when.vsEvening", { amount: formatEuros(home - bestCost), time: hhmm(HOME_HOUR) });
    }
    const average = energyCost.reduce((sum, item) => sum + item.value, 0) / energyCost.length;
    const typical = euroCost(average * effectiveHours, powerKw);
    if (typical - bestCost >= minimum) return t("tips.when.vsAverage", { amount: formatEuros(typical - bestCost) });
    return null;
  }, [bestRange, bestCost, energyCost, effectiveHours, powerKw]);

  // Compartir con el menú del sistema (WhatsApp…) o, en escritorio, copiar.
  const shareBest = async () => {
    if (!bestRange) return;
    const text = t("tips.when.shareLines", {
      task: taskName,
      range: formatRangeLabel(bestRange),
      hours: effectiveHours,
      price: formatPriceWithUnits(bestRange.avgPrice, units),
      cost: formatEuros(bestCost),
      kw: powerLabel,
    }).join("\n");
    const result = await shareText({ title: t("tips.when.shareTitle"), text });
    if (result === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Evento con aviso 10 minutos antes: sustituye a una notificación.
  const addToCalendar = () => {
    if (!bestRange) return;
    const start = new Date(date ?? Date.now());
    start.setHours(bestRange.startHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + (bestRange.endHour - bestRange.startHour));
    downloadIcs(`${taskName} ${formatRangeLabel(bestRange).replace(/\s/g, "")}.ics`, {
      title: t("tips.when.calendarTitle", { task: taskName }),
      start,
      end,
      description: t("tips.when.calendarBody", {
        price: formatPriceWithUnits(bestRange.avgPrice, units),
        cost: formatEuros(bestCost),
        kw: powerLabel,
      }),
    });
  };

  const chipSx = (selected) => ({
    height: 36,
    px: 0.5,
    borderColor: selected ? "secondary.main" : "divider",
    bgcolor: selected ? "selected" : "transparent",
    color: selected ? "text.primary" : "text.secondary",
    fontWeight: selected ? 600 : 400,
    "& .MuiChip-icon": { color: "inherit" },
  });

  return (
    <Box component="section" aria-labelledby="when-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h2" component="h2" id="when-heading">
        {t("tips.when.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.25 }}>
        {t("tips.when.body")}
      </Typography>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        spacing={1}
        sx={{ mt: 2 }}
        role="group"
        aria-label={t("tips.when.appliance")}
      >
        {APPLIANCES.map((appliance) => {
          const { Icon } = appliance;
          const selected = !showCustom && selectedAppliance?.id === appliance.id;
          return (
            <Chip
              key={appliance.id}
              icon={<Icon fontSize="small" />}
              label={selected ? `${appliance.label} · ${appliance.hours} h` : appliance.label}
              onClick={() => chooseAppliance(appliance)}
              variant="outlined"
              aria-pressed={selected}
              sx={chipSx(selected)}
            />
          );
        })}
        <Chip
          icon={<TuneIcon fontSize="small" />}
          label={t("tips.when.other")}
          onClick={() => setCustomOpen(true)}
          variant="outlined"
          aria-pressed={showCustom}
          aria-expanded={showCustom}
          aria-controls="when-custom"
          sx={chipSx(showCustom)}
        />
      </Stack>

      {/* "Otro": duración y potencia a mano, solo si hacen falta. */}
      {showCustom && (
        <Stack
          id="when-custom"
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary" id="hours-label">
              {t("tips.when.duration")}
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
                aria-label={t("tips.when.lessHour")}
                disabled={effectiveHours <= 1}
                onClick={() => setHours(Math.max(1, effectiveHours - 1))}
                sx={{ borderRadius: 2 }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography className="tabular" aria-live="polite" sx={{ fontWeight: 700, minWidth: 48, textAlign: "center" }}>
                {effectiveHours} h
              </Typography>
              <IconButton
                size="small"
                aria-label={t("tips.when.moreHour")}
                disabled={effectiveHours >= maxHours}
                onClick={() => setHours(Math.min(maxHours, effectiveHours + 1))}
                sx={{ borderRadius: 2 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
          <TextField
            label={t("tips.when.power")}
            size="small"
            value={powerText}
            onChange={handlePowerChange}
            sx={{ width: 130 }}
            inputProps={{ inputMode: "decimal", "aria-label": t("tips.when.powerAria") }}
            InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }}
          />
        </Stack>
      )}

      {/* --- Respuesta --- */}
      {bestRange ? (
        <Box
          aria-live="polite"
          sx={{
            mt: 2.5,
            pt: 2.5,
            borderTop: 1,
            borderColor: "divider",
            display: "grid",
            gap: { xs: 2.5, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 7fr)" },
            alignItems: "center",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography color="text.secondary">
              {t("tips.when.start")}
            </Typography>
            <Stack direction="row" spacing={1.25} alignItems="baseline" flexWrap="wrap" useFlexGap>
              <Typography className="tabular" sx={{ fontSize: { xs: "2.25rem", sm: "2.5rem" }, fontWeight: 700, lineHeight: 1.1 }}>
                {hhmm(bestRange.startHour)}
              </Typography>
              <Typography color="text.secondary" className="tabular">
                {t("tips.when.until", { time: hhmm(bestRange.endHour) })}
              </Typography>
              {status && (
                <Typography variant="body2" sx={{ color: status.color, fontWeight: 600 }}>
                  · {status.label.toLocaleLowerCase()}
                </Typography>
              )}
            </Stack>
            <Typography sx={{ mt: 1, fontWeight: 600 }} className="tabular">
              {t("tips.when.costLine", { cost: formatEuros(bestCost) })}
            </Typography>
            {savingText && (
              <Typography variant="body2" sx={{ color: "price.cheapest", fontWeight: 600 }} className="tabular">
                {savingText}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="p" className="tabular" sx={{ mt: 0.25 }}>
              {t("tips.when.costContext", { hours: effectiveHours, kw: powerLabel })} ·{" "}
              {t("tips.when.average", { price: formatPriceWithUnits(bestRange.avgPrice, units) })}
            </Typography>
          </Box>

          <DayBars energyCost={energyCost} best={bestRange} isToday={isToday} currentHour={currentHour} />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ gridColumn: "1 / -1", ml: -0.5, rowGap: 0.5 }}
          >
            {/* Solo si la franja aún no ha pasado: un aviso para algo pasado no sirve. */}
            {(!isToday || bestRange.endHour > currentHour) && (
              <Button ref={setCalendarButton} size="small" onClick={addToCalendar} startIcon={<EventIcon />}>
                {t("tips.when.calendar")}
              </Button>
            )}
            <Hint id="calendar" anchor={calendarButton} />
            <Button
              size="small"
              onClick={shareBest}
              startIcon={copied ? <CheckIcon /> : navigator.share ? <ShareIcon /> : <ContentCopyIcon />}
            >
              {copied ? t("common.actions.copied") : navigator.share ? t("common.actions.share") : t("common.actions.copy")}
            </Button>
            {alternative && (
              <Typography variant="body2" color="text.secondary" className="tabular" sx={{ ml: { sm: "auto" }, pl: 0.5 }}>
                {t("tips.when.alternative", {
                  range: formatRangeLabel(alternative),
                  cost: formatEuros(euroCost(alternative.sumPrice, powerKw)),
                })}
              </Typography>
            )}
          </Stack>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2.5 }}>
          {t("tips.when.none", { hours: effectiveHours })}
        </Typography>
      )}
    </Box>
  );
}

export default WhenToRun;
