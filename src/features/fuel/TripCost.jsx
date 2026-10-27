/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import RouteIcon from "@mui/icons-material/RouteOutlined";
import EvIcon from "@mui/icons-material/EvStationOutlined";

import NumberField from "../../components/NumberField";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { findRanges, formatRangeLabel } from "../prices/cheapRanges";
import { formatEuros } from "../prices/priceFormat";
import { t } from "../../i18n";
import { formatMoney, formatNumber } from "../../i18n/format";

/** Consumo de un eléctrico medio (kWh/100 km) y horas de carga en casa. */
const EV_KWH_100 = 15;
const EV_CHARGE_HOURS = 4;

const euros2 = (amount) => formatMoney(amount, 2);

function Figure({ label, value, context, color }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle2" sx={{ color: color ?? "text.secondary" }}>
        {label}
      </Typography>
      <Typography className="tabular" sx={{ fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.25 }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {context}
      </Typography>
    </Box>
  );
}

/**
 * "¿Cuánto me cuesta el viaje?": el precio por litro dice poco; lo que se
 * entiende es "ir a Valencia me cuesta 32 €". Con los precios de la luz de
 * hoy, compara con un coche eléctrico cargado en casa en las horas baratas:
 * une las dos mitades de la app.
 */
export function TripCost({ fuelLabel, cheapest, average, consumption, tripKm, onPrefsChange, energyCost }) {
  const { prefs } = useEnergyPrefs();
  const liters = (tripKm * consumption) / 100;

  const ev = useMemo(() => {
    if (!energyCost?.length) return null;
    const best = findRanges(energyCost, { hours: EV_CHARGE_HOURS, topN: 1 }).best[0];
    if (!best) return null;
    const kwh = (tripKm * EV_KWH_100) / 100;
    return { cost: (kwh * best.avgPrice) / 1000, range: best, kwh };
  }, [energyCost, tripKm]);

  return (
    <Card component="section" aria-labelledby="trip-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <RouteIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="trip-heading">
            {t("fuel.trip.title")}
          </Typography>
        </Stack>

        <Box sx={{ display: "grid", gap: 2, mt: 2, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, minmax(0, 220px))" } }}>
          <NumberField
            label={t("fuel.trip.km")}
            unit="km"
            value={tripKm}
            max={5000}
            onChange={(value) => value && onPrefsChange({ tripKm: value })}
          />
          <NumberField
            label={t("fuel.trip.consumption")}
            unit="L"
            value={consumption}
            max={40}
            onChange={(value) => value && onPrefsChange({ consumption: value })}
            helperText={t("fuel.trip.consumptionHelp")}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            mt: 2.5,
            p: 2,
            borderRadius: 2,
            bgcolor: "surfaceMuted",
            gridTemplateColumns: { xs: "1fr 1fr", md: ev ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Figure
            label={t("fuel.trip.cheapest")}
            value={euros2(liters * cheapest)}
            context={t("fuel.trip.litersOf", { liters: formatNumber(liters, { maximumFractionDigits: 1 }), fuel: fuelLabel.toLowerCase() })}
            color="price.cheapest"
          />
          <Figure label={t("fuel.trip.average")} value={euros2(liters * average)} context={t("fuel.trip.ofArea")} />
          {ev && (
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
              <Figure
                label={t("fuel.trip.electric")}
                value={euros2(ev.cost)}
                context={t(prefs.withTaxes ? "fuel.trip.charging" : "fuel.trip.chargingNoTaxes", { range: formatRangeLabel(ev.range) })}
                color="primary.main"
              />
            </Box>
          )}
        </Box>

        {ev && (
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
            <EvIcon sx={{ fontSize: 18, color: "text.secondary", mt: "1px" }} aria-hidden="true" />
            <Typography variant="caption" color="text.secondary">
              {t("fuel.trip.evNote", {
                kwh100: EV_KWH_100,
                kwh: formatNumber(ev.kwh, { maximumFractionDigits: 1 }),
                hours: EV_CHARGE_HOURS,
                saving: formatEuros(liters * cheapest - ev.cost),
              })}
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default TripCost;
