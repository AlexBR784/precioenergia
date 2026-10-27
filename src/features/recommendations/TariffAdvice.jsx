/* eslint-disable react/prop-types */
import { useState } from "react";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import LockClockIcon from "@mui/icons-material/LockClockOutlined";
import ReceiptIcon from "@mui/icons-material/ReceiptLongOutlined";

import PeriodStrip from "../../components/PeriodStrip";
import { TARIFFS, useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { PERIODS, allDayValleyReason, currentPeriod, nextValley } from "../../utils/tariffPeriods";
import SupplyDialog, { TariffHelp, TariffOptions } from "../supply/SupplyDialog";
import { t } from "../../i18n";
import { formatDate } from "../../i18n/format";

const hhmm = (date) => `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

/** "a las 22:00" hoy, "mañana a las 08:00" o "el lunes a las 08:00". */
const whenLabel = (date, now) => {
  const days = Math.round(
    (new Date(date).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000
  );
  if (days === 0) return t("tips.tariff.atTime", { time: hhmm(date) });
  if (days === 1 && date.getHours() === 0) return t("tips.tariff.atMidnight");
  if (days === 1) return t("tips.tariff.tomorrowAt", { time: hhmm(date) });
  return t("tips.tariff.weekdayAt", { weekday: formatDate(date, { weekday: "long" }), time: hhmm(date) });
};

const hoursUntil = (date, now) => Math.max(1, Math.round((date - now) / 3_600_000));

function Kicker({ icon: Icon, children, color = "text.secondary" }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color }}>
      <Icon sx={{ fontSize: 16 }} aria-hidden="true" />
      <Typography variant="subtitle2" sx={{ color: "inherit" }}>
        {children}
      </Typography>
    </Stack>
  );
}

function ChangeTariffButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" onClick={() => setOpen(true)} sx={{ flexShrink: 0 }}>
        {t("tips.tariff.change")}
      </Button>
      <SupplyDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Primera visita: sin saber la tarifa, los consejos por horas pueden no servir. */
function TariffQuestion() {
  const { prefs, updatePrefs } = useEnergyPrefs();
  return (
    <Card component="section" aria-labelledby="tariff-question" sx={{ borderColor: "primary.main" }}>
      <CardContent>
        <Kicker icon={HelpIcon} color="primary.main">
          {t("tips.tariff.first")}
        </Kicker>
        <Typography variant="h2" component="h2" id="tariff-question" sx={{ mt: 0.5 }}>
          {t("tips.tariff.question")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {t("tips.tariff.questionBody")}
        </Typography>
        <TariffOptions value={prefs.tariff} onChange={(tariff) => updatePrefs({ tariff })} />
        <Box sx={{ mt: 1.5 }}>
          <TariffHelp />
        </Box>
      </CardContent>
    </Card>
  );
}

/** Mercado libre por tramos: lo único que decide el precio es valle, llano o punta. */
function PeriodsAdvice({ date, isToday, now, region }) {
  const status = currentPeriod(now, region);
  const valley = nextValley(now, region);
  const allDay = allDayValleyReason(new Date(date));

  let title;
  let body;
  if (!isToday) {
    title = allDay ? t("tips.tariff.periodsOtherDayAll", { reason: allDay }) : t("tips.tariff.periodsOtherDay");
    body = t("tips.tariff.periodsOtherDayBody");
  } else if (status.period === "P3") {
    title = t("tips.tariff.valleyNowTitle");
    body = allDay
      ? t("tips.tariff.valleyAllDay", { reason: allDay })
      : status.until
        ? t("tips.tariff.valleyUntil", { time: hhmm(status.until) })
        : t("tips.tariff.valleyNow");
  } else {
    const label = PERIODS[status.period].label.toLowerCase();
    title = status.period === "P1" ? t("tips.tariff.peakTitle") : t("tips.tariff.flatTitle");
    body = valley
      ? t("tips.tariff.inPeriodUntil", {
          period: label,
          time: hhmm(status.until),
          when: whenLabel(valley, now),
          hours: hoursUntil(valley, now),
        })
      : t("tips.tariff.inPeriod", { period: label });
  }

  return (
    <Card component="section" aria-labelledby="periods-advice">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Kicker icon={ScheduleIcon}>{t("tips.tariff.periodsKicker")}</Kicker>
          <ChangeTariffButton />
        </Stack>
        <Typography variant="h2" component="h2" id="periods-advice" sx={{ mt: 0.25 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          {body}
        </Typography>
        <PeriodStrip date={date} region={region} nowHour={isToday ? now.getHours() : null} />
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {t("tips.tariff.periodsNote")}
        </Typography>
      </CardContent>
    </Card>
  );
}

/** Mercado libre con precio fijo: la hora no importa; lo que ahorra es otra cosa. */
function FixedAdvice({ onOpenBill }) {
  return (
    <Card component="section" aria-labelledby="fixed-advice">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Kicker icon={LockClockIcon}>{t("tips.tariff.fixedKicker")}</Kicker>
          <ChangeTariffButton />
        </Stack>
        <Typography variant="h2" component="h2" id="fixed-advice" sx={{ mt: 0.25 }}>
          {t("tips.tariff.fixedTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("tips.tariff.fixedBody")}
        </Typography>
        {onOpenBill && (
          <Button variant="outlined" startIcon={<ReceiptIcon />} onClick={onOpenBill} sx={{ mt: 2 }}>
            {t("tips.tariff.fixedButton")}
          </Button>
        )}
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {t("tips.tariff.fixedNote")}
        </Typography>
      </CardContent>
    </Card>
  );
}

/** La tarjeta que toca según la tarifa del usuario (nada si tiene PVPC). */
export function TariffAdvice({ date, isToday, now, onOpenBill }) {
  const { prefs, region } = useEnergyPrefs();
  if (prefs.tariff == null) return <TariffQuestion />;
  if (prefs.tariff === TARIFFS.PERIODS) return <PeriodsAdvice date={date} isToday={isToday} now={now} region={region} />;
  if (prefs.tariff === TARIFFS.FIXED) return <FixedAdvice onOpenBill={onOpenBill} />;
  return null;
}

export default TariffAdvice;
