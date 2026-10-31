/* eslint-disable react/prop-types */
import { useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";

import { taxFactor } from "../../data/spain";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { averageOf, fetchPvpcRange } from "../../hooks/usePvpcRange";
import { formatPriceWithUnits } from "./priceFormat";
import { t } from "../../i18n";
import { capitalize } from "../../i18n/format";

// dayjs ya está en el idioma activo (lo fija `loadLanguage`).
const monthName = (date) => dayjs(date).format("MMMM");
const monthYear = (date) => dayjs(date).format("MMMM YYYY");

/** Media de cada día ([{ date, average }]) a partir de las horas. */
const dailyAverages = (rows) => {
  const byDay = new Map();
  rows.forEach((row) => byDay.set(row.date, [...(byDay.get(row.date) ?? []), row.value]));
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, average: values.reduce((sum, v) => sum + v, 0) / values.length }));
};

function Figure({ label, value, context, strong }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "none", letterSpacing: 0, fontSize: "0.8125rem" }}>
        {label}
      </Typography>
      <Typography className="tabular" sx={{ fontSize: strong ? "1.5rem" : "1.25rem", fontWeight: 700, lineHeight: 1.25 }}>
        {value}
      </Typography>
      {context && (
        <Typography variant="caption" color="text.secondary">
          {context}
        </Typography>
      )}
    </Box>
  );
}

/**
 * "Cómo va el mes": la media de este mes frente al anterior y al mismo mes del
 * año pasado. Es lo que explica la factura que llega. Son tres meses de
 * precios horarios (unos 900 KB), así que se piden solo al pulsar.
 */
export function MonthlyHistory({ units }) {
  const { prefs, region } = useEnergyPrefs();
  const factor = prefs.withTaxes ? taxFactor(region) : 1;
  const [state, setState] = useState({ loading: false, data: null, error: false });

  const load = async () => {
    setState({ loading: true, data: null, error: false });
    const today = dayjs().startOf("day");
    // A primeros de mes aún no hay días cerrados: se mira el mes anterior.
    const current = today.date() === 1 ? today.subtract(1, "month").startOf("month") : today.startOf("month");
    const currentEnd = today.date() === 1 ? current.endOf("month") : today.subtract(1, "day");
    const previous = current.subtract(1, "month");
    const lastYear = current.subtract(1, "year");
    try {
      const [now, before, yearAgo] = await Promise.all([
        fetchPvpcRange(current.format("YYYY-MM-DD"), currentEnd.format("YYYY-MM-DD")),
        fetchPvpcRange(previous.format("YYYY-MM-DD"), previous.endOf("month").format("YYYY-MM-DD")),
        fetchPvpcRange(lastYear.format("YYYY-MM-DD"), lastYear.endOf("month").format("YYYY-MM-DD")).catch(() => []),
      ]);
      setState({
        loading: false,
        error: false,
        data: {
          current: { date: current, average: averageOf(now), days: dailyAverages(now) },
          previous: { date: previous, average: averageOf(before) },
          lastYear: { date: lastYear, average: averageOf(yearAgo) },
          throughDay: currentEnd.date(),
        },
      });
    } catch {
      setState({ loading: false, data: null, error: true });
    }
  };

  const data = state.data;
  const change = (a, b) => (a != null && b ? ((a - b) / b) * 100 : null);
  const vsPrevious = data && change(data.current.average, data.previous.average);
  const vsYear = data && change(data.current.average, data.lastYear.average);
  const days = data?.current.days ?? [];
  const max = Math.max(...days.map((day) => day.average), 1);

  return (
    <Box component="section" aria-labelledby="month-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h2" component="h2" id="month-heading">
        {t("prices.month.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {t("prices.month.body")}
      </Typography>

      {!data && (
        <Button
          variant="outlined"
          onClick={load}
          disabled={state.loading}
          startIcon={state.loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ mt: 2 }}
        >
          {state.loading ? t("prices.month.loading") : t("prices.month.load")}
        </Button>
      )}
      {state.error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t("prices.month.error")}
        </Alert>
      )}

      {data && (
        <>
          {vsPrevious != null && (
            <Typography variant="h3" component="p" sx={{ mt: 2 }}>
              {capitalize(
                Math.abs(vsPrevious) < 3
                  ? t("prices.month.similar", { current: monthName(data.current.date), previous: monthName(data.previous.date) })
                  : t("prices.month.change", {
                      current: monthName(data.current.date),
                      previous: monthName(data.previous.date),
                      percent: Math.round(Math.abs(vsPrevious)),
                      cheaper: vsPrevious < 0,
                    })
              )}
            </Typography>
          )}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: "surfaceMuted",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <Figure
              strong
              label={t("prices.month.throughDay", { month: capitalize(monthYear(data.current.date)), day: data.throughDay })}
              value={formatPriceWithUnits(data.current.average * factor, units)}
            />
            <Figure label={capitalize(monthYear(data.previous.date))} value={formatPriceWithUnits(data.previous.average * factor, units)} />
            <Figure
              label={capitalize(monthYear(data.lastYear.date))}
              value={data.lastYear.average != null ? formatPriceWithUnits(data.lastYear.average * factor, units) : "—"}
              context={
                vsYear != null
                  ? t("prices.month.vsYear", { percent: Math.round(Math.abs(vsYear)), cheaper: vsYear < 0 })
                  : null
              }
            />
          </Box>

          {days.length > 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
                {t("prices.month.daily")}
              </Typography>
              <Box
                role="img"
                aria-label={t("prices.month.dailyAria", { days: days.length, month: monthName(data.current.date) })}
                sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 56 }}
              >
                {days.map((day) => (
                  <Box
                    key={day.date}
                    title={`${dayjs(day.date).format("D MMM")}: ${formatPriceWithUnits(day.average * factor, units)}`}
                    sx={{
                      flex: 1,
                      maxWidth: 18,
                      height: `${Math.max(6, (day.average / max) * 100)}%`,
                      borderRadius: "3px 3px 0 0",
                      bgcolor: day.average <= data.current.average ? "price.cheapest" : "price.high",
                      opacity: 0.8,
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
                {t("prices.month.dailyLegend")}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default MonthlyHistory;
