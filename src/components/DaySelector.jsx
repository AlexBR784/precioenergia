/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  IconButton,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarIcon from "@mui/icons-material/CalendarMonthOutlined";
import dayjs from "dayjs";
import { useNow } from "../hooks/useNow";
import { t } from "../i18n";
import { capitalize } from "../i18n/format";

/** REE publica los precios del día siguiente sobre las 20:15 h. */
const PUBLISH_HOUR = 20;
const PUBLISH_MINUTE = 15;

const tomorrowPublished = (now = dayjs()) =>
  now.hour() > PUBLISH_HOUR || (now.hour() === PUBLISH_HOUR && now.minute() >= PUBLISH_MINUTE);

/** "Hoy", "Mañana", "Ayer" o el día de la semana ("Viernes"). */
const relativeName = (day, now) => {
  const today = dayjs(now).startOf("day");
  const diff = day.startOf("day").diff(today, "day");
  if (diff === 0) return t("common.days.today");
  if (diff === 1) return t("common.days.tomorrow");
  if (diff === -1) return t("common.days.yesterday");
  return capitalize(day.format("dddd"));
};

/**
 * Selector del día de los precios, compartido por Precios y Consejos.
 *
 * Casi siempre se mira hoy o mañana, así que esos dos van a un toque; las
 * flechas pasan de día en día y el calendario queda para cualquier otra fecha.
 * Sustituye al campo de fecha "DD/MM/AAAA", que obligaba a abrir un calendario
 * para lo más habitual y tenía la etiqueta incrustada, desalineada del resto
 * de controles.
 *
 * El límite es mañana: no hay precios publicados más allá. "Mañana" avisa de
 * cuándo se publica si todavía no son las 20:15.
 */
export function DaySelector({ value, onChange }) {
  const anchorRef = useRef(null);
  const now = useNow();
  const [open, setOpen] = useState(false);

  // dayjs usa el idioma activo (lo fija `loadLanguage`).
  const day = dayjs(value);
  const today = dayjs(now).startOf("day");
  const tomorrow = today.add(1, "day");
  const isToday = day.isSame(today, "day");
  const isTomorrow = day.isSame(tomorrow, "day");
  const canGoNext = day.isBefore(tomorrow, "day");
  const published = tomorrowPublished(dayjs(now));

  const go = (next) => onChange(next.startOf("day"));

  const quick = isToday ? "today" : isTomorrow ? "tomorrow" : null;

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}
      >
        <IconButton size="small" aria-label={t("common.days.previous")} onClick={() => go(day.subtract(1, "day"))} sx={{ borderRadius: 2 }}>
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        <ButtonBase
          ref={anchorRef}
          onClick={() => setOpen(true)}
          aria-label={t("common.days.pick", { name: relativeName(day, now), date: day.format("LL") })}
          aria-haspopup="dialog"
          sx={{
            px: 1.25,
            py: 0.5,
            minHeight: 40,
            minWidth: { xs: 128, sm: 156 },
            borderRadius: 1.5,
            gap: 1,
            justifyContent: "center",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <CalendarIcon fontSize="small" sx={{ color: "text.secondary" }} aria-hidden="true" />
          <Box sx={{ textAlign: "left", lineHeight: 1.1 }}>
            <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.2 }}>
              {relativeName(day, now)}
            </Typography>
            <Typography component="span" variant="caption" color="text.secondary" className="tabular" sx={{ display: "block", lineHeight: 1.2 }}>
              {day.format("D MMM YYYY").replace(".", "")}
            </Typography>
          </Box>
        </ButtonBase>

        <IconButton
          size="small"
          aria-label={t("common.days.next")}
          disabled={!canGoNext}
          onClick={() => go(day.add(1, "day"))}
          sx={{ borderRadius: 2 }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={quick}
        aria-label={t("common.days.quick")}
        onChange={(_, value) => {
          if (value === "today") go(today);
          if (value === "tomorrow") go(tomorrow);
        }}
        sx={{ "& .MuiToggleButton-root": { px: 1.5, minHeight: 40 } }}
      >
        <ToggleButton value="today">{t("common.days.today")}</ToggleButton>
        {/* Sin Tooltip envolviendo: ToggleButtonGroup necesita los botones
            como hijos directos para marcar el seleccionado. El aviso va en
            `title` y, si se elige igualmente, la pestaña explica que aún no
            hay precios. */}
        <ToggleButton
          value="tomorrow"
          title={published ? undefined : t("common.days.tomorrowNotYet")}
        >
          {t("common.days.tomorrow")}
        </ToggleButton>
      </ToggleButtonGroup>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { mt: 1 } } }}
      >
        <DateCalendar
          value={day}
          maxDate={tomorrow}
          onChange={(next) => {
            if (next?.isValid?.()) {
              go(next);
              setOpen(false);
            }
          }}
        />
      </Popover>
    </Stack>
  );
}

export default DaySelector;
