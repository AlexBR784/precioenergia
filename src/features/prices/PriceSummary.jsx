/* eslint-disable react/prop-types */
import { Box, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import { formatPrice, euroCost, formatEuros } from "./priceFormat";
import { hourOf } from "../../hooks/usePriceStats";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { usePowerKw } from "../../hooks/usePowerKw";
import { useNow } from "../../hooks/useNow";
import { PERIODS, allDayValleyReason, currentPeriod, isAllDayValley } from "../../utils/tariffPeriods";
import { t } from "../../i18n";
import { formatNumber } from "../../i18n/format";

const CHEAP = ["cheapest", "low"];
const DEAR = ["medium", "high"];
const NEXT_HOURS = 6;
const TICKS = [0, 6, 12, 18, 23];

const hhmm = (hour) => `${String(hour % 24).padStart(2, "0")}:00`;
const tierWord = (tier) => t(`common.tiers.${tier}`).toLocaleLowerCase();

/** El bloque de horas "muy caras" seguidas alrededor del máximo del día. */
const peakBlock = (hours, maxHour) => {
  const index = hours.findIndex((row) => hourOf(row.datetime) === maxHour);
  if (index < 0) return null;
  let from = index;
  let to = index;
  while (from > 0 && hours[from - 1].tier === "high") from -= 1;
  while (to < hours.length - 1 && hours[to + 1].tier === "high") to += 1;
  return { from: hourOf(hours[from].datetime), to: hourOf(hours[to].datetime) + 1 };
};

/**
 * Lo que pasa con el precio, dicho en frases: si sigue barato o cuándo baja,
 * cuándo es lo más caro y en qué tramo de la tarifa estamos. Sustituye al
 * trío Mínimo / Máximo / Media, que obligaba a leer tres cifras para sacar
 * una conclusión que aquí ya va escrita.
 */
function Sentences({ stats, units, now, day, region }) {
  const { hours, isToday, current, max, min } = stats;
  const nowHour = now.getHours();
  const lines = [];

  if (isToday && current) {
    const ahead = hours.filter((row) => hourOf(row.datetime) > nowHour);
    const tier = stats.tierOf(current.value);
    // Barato: hasta cuándo dura. Moderado: cuándo sube. Caro: cuándo baja.
    if (tier === "cheapest") {
      const end = ahead.find((row) => row.tier !== "cheapest");
      lines.push(end ? t("prices.summary.cheapUntil", { time: end.datetime }) : t("prices.summary.cheapRestOfDay"));
    } else if (tier === "low") {
      const rise = ahead.find((row) => DEAR.includes(row.tier));
      lines.push(
        rise
          ? t("prices.summary.risesAt", { time: rise.datetime, price: formatPrice(rise.value, units) })
          : t("prices.summary.noRise")
      );
    } else {
      const drop = ahead.find((row) => CHEAP.includes(row.tier));
      lines.push(
        drop
          ? t("prices.summary.dropsAt", { time: drop.datetime, price: formatPrice(drop.value, units) })
          : t("prices.summary.noDrop")
      );
    }
  } else if (min && max) {
    // Otro día: el número grande ya es la media y lo caro va en la frase de abajo.
    lines.push(t("prices.summary.dayRange", { min: formatPrice(min.value, units), minTime: min.hour }));
  }

  if (max) {
    const block = peakBlock(hours, hourOf(max.hour));
    if (block) {
      const params = {
        from: hhmm(block.from),
        to: hhmm(block.to),
        time: max.hour,
        price: formatPrice(max.value, units),
      };
      const past = isToday && block.to <= nowHour;
      lines.push(t(past ? "prices.summary.peakPast" : "prices.summary.peak", params));
    }
  }

  // Tramo de la tarifa. Con todo el día en valle (fin de semana o festivo),
  // decirlo así: "valle hasta las 08:00" se refería al lunes y confundía.
  if (isAllDayValley(day)) {
    lines.push(
      t("prices.summary.valleyAllDay", {
        period: PERIODS.P3.label.toLocaleLowerCase(),
        reason: allDayValleyReason(day),
      })
    );
  } else if (isToday) {
    const { period, until } = currentPeriod(now, region);
    if (until) {
      const sameDay = dayjs(until).isSame(now, "day");
      lines.push(
        t(sameDay ? "prices.summary.periodUntil" : "prices.summary.periodUntilDay", {
          period: PERIODS[period].label.toLocaleLowerCase(),
          time: dayjs(until).format("HH:mm"),
          day: dayjs(until).format("dddd"),
        })
      );
    }
  }

  return (
    <Typography sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.0625rem" }, lineHeight: 1.6, maxWidth: "52ch" }}>
      {lines.join(" ")}
    </Typography>
  );
}

/**
 * Las 24 horas como una tira de color por tramo de precio, con la hora de
 * ahora marcada y lo ya pasado atenuado. Es la firma visual de la web: se lee
 * de un vistazo dónde está lo barato y dónde lo caro.
 */
function DayStrip({ hours, isToday, nowHour }) {
  const cheap = hours.filter((row) => CHEAP.includes(row.tier)).map((row) => row.datetime);
  return (
    <Box>
      <Box
        role="img"
        aria-label={t("prices.summary.stripAria", { hours: cheap.join(", ") || "—" })}
        sx={{ display: "grid", gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))`, gap: "2px" }}
      >
        {hours.map((row) => {
          const past = isToday && hourOf(row.datetime) < nowHour;
          return (
            <Box
              key={row.datetime}
              sx={{
                height: { xs: 28, sm: 32 },
                bgcolor: `price.${row.tier}`,
                opacity: past ? 0.35 : 1,
                borderRadius: "3px",
                // La hora actual, marcada por dentro: un contorno por fuera
                // se montaba sobre las horas vecinas (solo hay 2 px entre ellas).
                boxShadow: row.isNow ? (theme) => `inset 0 0 0 2px ${theme.palette.text.primary}` : "none",
              }}
            />
          );
        })}
      </Box>
      <Box aria-hidden="true" sx={{ position: "relative", height: 18, mt: 0.75 }}>
        {TICKS.map((tick) => (
          <Typography
            key={tick}
            variant="caption"
            color="text.secondary"
            className="tabular"
            sx={{
              position: "absolute",
              left: `${((tick + 0.5) / hours.length) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {tick}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

/** Las próximas horas como un panel de salidas: hora, tramo, precio y coste. */
function NextHours({ hours, units, kw }) {
  return (
    <Box component="section" aria-labelledby="next-hours-heading">
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
        <Typography component="h2" id="next-hours-heading" sx={{ fontWeight: 700 }}>
          {t("prices.summary.next")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("prices.summary.nextColumns", { units, kw: formatNumber(kw) })}
        </Typography>
      </Stack>
      <Box component="ul" sx={{ m: 0, mt: 0.75, p: 0, listStyle: "none" }}>
        {hours.map((row) => (
          <Box
            component="li"
            key={row.datetime}
            className="tabular"
            sx={{
              display: "grid",
              gridTemplateColumns: "56px minmax(0, 1fr) auto auto",
              alignItems: "baseline",
              columnGap: 1.5,
              py: 1,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Typography sx={{ fontWeight: row.isNow ? 700 : 500 }}>{row.datetime}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              <Box
                component="span"
                aria-hidden="true"
                sx={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", bgcolor: `price.${row.tier}`, mr: 0.75 }}
              />
              {tierWord(row.tier)}
              {row.isNow ? ` · ${t("prices.summary.nowShort")}` : ""}
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{formatPrice(row.value, units)}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 52, textAlign: "right" }}>
              {formatEuros(euroCost(row.value, kw))}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/**
 * La portada de Precios, sin tarjetas: el precio de ahora en grande con lo
 * que hay que saber en frases, las 24 horas en una tira y, si es hoy, las
 * próximas horas. Todo lo demás (gráfico, tabla, el mes) va debajo.
 */
export function PriceSummary({ stats, units, date }) {
  const { region } = useEnergyPrefs();
  const { powerKw } = usePowerKw();
  const now = useNow();
  const { isToday, current, average, hours } = stats;
  const showNow = isToday && current;
  const tier = showNow ? stats.tierOf(current.value) : null;
  const nowHour = now.getHours();
  const upcoming = isToday ? hours.filter((row) => hourOf(row.datetime) >= nowHour).slice(0, NEXT_HOURS) : [];

  return (
    <Box
      component="section"
      aria-label={t("prices.summary.label")}
      sx={{
        display: "grid",
        columnGap: 6,
        rowGap: { xs: 3, md: 4 },
        alignItems: "start",
        // En móvil la tira va justo después de las frases (la forma del día
        // antes que el detalle); en escritorio, a todo el ancho debajo.
        gridTemplateAreas: {
          xs: upcoming.length ? '"now" "strip" "next"' : '"now" "strip"',
          md: upcoming.length ? '"now next" "strip strip"' : '"now" "strip"',
        },
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: upcoming.length ? "minmax(0, 7fr) minmax(0, 5fr)" : "1fr" },
      }}
    >
      <Box sx={{ gridArea: "now", minWidth: 0 }}>
        <Typography color="text.secondary">
          {showNow ? t("prices.summary.now", { hour: current.hour }) : t("prices.summary.dayAverage")}
        </Typography>
        <Stack direction="row" spacing={1.25} alignItems="baseline" flexWrap="wrap" useFlexGap>
          <Typography
            className="tabular"
            sx={{
              fontSize: { xs: "3rem", sm: "3.75rem" },
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: showNow ? `price.${tier}` : "text.primary",
            }}
          >
            {formatPrice(showNow ? current.value : average, units)}
          </Typography>
          <Typography sx={{ fontSize: { xs: "1.0625rem", sm: "1.25rem" } }} color="text.secondary">
            {units}
            {showNow ? `, ${tierWord(tier)}` : ""}
          </Typography>
        </Stack>
        <Sentences stats={stats} units={units} now={now} day={isToday ? now : new Date(date)} region={region} />
      </Box>

      {upcoming.length > 0 && (
        <Box sx={{ gridArea: "next", minWidth: 0 }}>
          <NextHours hours={upcoming} units={units} kw={powerKw} />
        </Box>
      )}

      <Box sx={{ gridArea: "strip", minWidth: 0 }}>
        <DayStrip hours={hours} isToday={isToday} nowHour={nowHour} />
      </Box>
    </Box>
  );
}

export default PriceSummary;
