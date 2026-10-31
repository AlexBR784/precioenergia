/* eslint-disable react/prop-types */
import { useMemo } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Link,
  MenuItem,
  Skeleton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import NumberField from "../../components/NumberField";
import { CNMC_COMPARATOR_URL, SOCIAL_BONUS } from "../../data/spain";
import { TARIFFS, useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { averageOf, usePvpcRange } from "../../hooks/usePvpcRange";
import { formatEuros } from "../prices/priceFormat";
import SupplyButton from "../supply/SupplyButton";
import { marketBill, pvpcBill } from "./billMath";
import { PERIODS } from "../../utils/tariffPeriods";
import { t } from "../../i18n";
import { fixed, formatMoney, formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";

const HOUSEHOLDS = ["small", "three", "four", "large"];

const euros2 = (amount) => formatMoney(amount, 2);

const priceKwh = (value) => `${fixed(value, 3)} €/kWh`;

const discountPercent = (rate) => formatNumber(rate * 100, { maximumFractionDigits: 1 });

/**
 * Desglose de una factura como un recibo: el total arriba y los conceptos en
 * filas. La opción más barata lleva una raya verde encima.
 */
function Breakdown({ title, bill, note, highlight }) {
  return (
    <Box sx={{ minWidth: 0, pt: 1.5, borderTop: highlight ? 3 : 1, borderColor: highlight ? "price.cheapest" : "divider" }}>
      <Typography color="text.secondary">{title}</Typography>
      <Typography className="tabular" sx={{ fontSize: "1.75rem", fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
        {euros2(bill.total)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t("bill.estimator.perMonth")}
      </Typography>
      <Stack sx={{ mt: 1.5 }}>
        {bill.lines.map((line) => (
          <Stack
            key={line.id}
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ py: 0.75, borderTop: 1, borderColor: "divider" }}
          >
            <Typography variant="body2" color="text.secondary">
              {line.label}
            </Typography>
            <Typography
              variant="body2"
              className="tabular"
              sx={{ color: line.amount < 0 ? "price.cheapest" : "text.primary", fontWeight: 600 }}
            >
              {euros2(line.amount)}
            </Typography>
          </Stack>
        ))}
      </Stack>
      {note && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {note}
        </Typography>
      )}
    </Box>
  );
}

/**
 * "Tu factura de luz": cuánto se paga al mes de verdad, con potencia,
 * impuestos y bono social, y la comparación con el contrato de mercado libre
 * si el usuario lo tiene.
 *
 * Con un archivo de consumo importado (`usage`), la energía del PVPC es la
 * exacta de esas horas; sin él, se estima con el precio medio de los últimos
 * 30 días.
 */
export function BillEstimator({ usage }) {
  const { prefs, region, updatePrefs } = useEnergyPrefs();

  const end = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const start = dayjs().subtract(30, "day").format("YYYY-MM-DD");
  const { rows, loading, error } = usePvpcRange(start, end, !usage);
  const averagePriceKwh = (averageOf(rows) ?? NaN) / 1000;

  const kwh = usage?.kwh ?? prefs.monthlyKwh;
  const days = usage?.days ?? 30;
  // Las facturas importadas pueden cubrir varios meses: se lleva todo a 30 días.
  const perMonth = 30 / days;
  // Sin archivo, lo que no es valle se reparte como en un hogar típico.
  const split = useMemo(
    () =>
      usage?.split ?? {
        P3: prefs.valleyShare,
        P1: (1 - prefs.valleyShare) * 0.45,
        P2: (1 - prefs.valleyShare) * 0.55,
      },
    [usage, prefs.valleyShare]
  );

  const pvpc = useMemo(() => {
    if (!usage && !Number.isFinite(averagePriceKwh)) return null;
    return pvpcBill({
      kwh,
      days,
      contractedKw: prefs.contractedKw,
      averagePriceKwh,
      energyCost: usage?.pvpcEnergyCost ?? null,
      region,
      bonus: prefs.bonus,
      household: prefs.household,
    });
  }, [usage, averagePriceKwh, kwh, days, prefs.contractedKw, region, prefs.bonus, prefs.household]);

  const market = useMemo(
    () =>
      prefs.tariff === TARIFFS.PERIODS || prefs.tariff === TARIFFS.FIXED
        ? marketBill({
            kwh,
            days,
            contractedKw: prefs.contractedKw,
            prices:
              prefs.tariff === TARIFFS.FIXED
                ? { single: prefs.myPrices.single, powerKwDay: prefs.myPrices.powerKwDay }
                : { ...prefs.myPrices, single: null },
            split,
            region,
          })
        : null,
    [prefs.tariff, prefs.myPrices, prefs.contractedKw, kwh, days, split, region]
  );

  const monthly = (bill) =>
    bill && {
      ...bill,
      total: bill.total * perMonth,
      lines: bill.lines.map((line) => ({ ...line, amount: line.amount * perMonth })),
    };
  const pvpcMonth = monthly(pvpc);
  const marketMonth = monthly(market);
  const setPrice = (key) => (value) => updatePrefs({ myPrices: { ...prefs.myPrices, [key]: value } });

  let verdict = null;
  if (pvpcMonth && marketMonth) {
    const diff = marketMonth.total - pvpcMonth.total;
    verdict =
      Math.abs(diff) < 1
        ? t("bill.estimator.same")
        : diff > 0
          ? t("bill.estimator.pvpcCheaper", { month: euros2(diff), year: formatEuros(diff * 12) })
          : t("bill.estimator.contractCheaper", { month: euros2(-diff), year: formatEuros(-diff * 12) });
  }

  return (
    <Box component="section" aria-labelledby="bill-heading">
      <Typography variant="h2" component="h2" id="bill-heading">
        {t("bill.estimator.title")}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
        {t("bill.estimator.body")}
      </Typography>

      {/* Datos a la izquierda y el recibo a la derecha; comparando con el
          contrato, los dos recibos van debajo a todo el ancho. */}
      <Box
        sx={{
          display: "grid",
          columnGap: 6,
          rowGap: 3,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: marketMonth ? "minmax(0, 1fr)" : "minmax(0, 6fr) minmax(0, 5fr)" },
          alignItems: "start",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: marketMonth ? "repeat(4, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <NumberField
              label={t("bill.estimator.monthly")}
              unit="kWh"
              value={usage ? Math.round(kwh * perMonth) : prefs.monthlyKwh}
              onChange={(value) => value && updatePrefs({ monthlyKwh: value })}
              disabled={Boolean(usage)}
              helperText={usage ? t("bill.estimator.monthlyFromFile") : t("bill.estimator.monthlyHelp")}
            />
            <NumberField
              label={t("bill.estimator.power")}
              unit="kW"
              value={prefs.contractedKw}
              onChange={(value) => value && updatePrefs({ contractedKw: value })}
              helperText={t("bill.estimator.powerHelp")}
            />
            <TextField
              select
              label={t("bill.estimator.bonus")}
              value={prefs.bonus ?? "none"}
              onChange={(event) => updatePrefs({ bonus: event.target.value === "none" ? null : event.target.value })}
              helperText={t("bill.estimator.bonusHelp")}
            >
              <MenuItem value="none">{t("bill.estimator.bonusNone")}</MenuItem>
              <MenuItem value="vulnerable">
                {t("bill.estimator.bonusVulnerable", { percent: discountPercent(SOCIAL_BONUS.discount.vulnerable) })}
              </MenuItem>
              <MenuItem value="severe">
                {t("bill.estimator.bonusSevere", { percent: discountPercent(SOCIAL_BONUS.discount.severe) })}
              </MenuItem>
            </TextField>
            <TextField
              select
              label={t("bill.estimator.household")}
              value={prefs.household}
              onChange={(event) => updatePrefs({ household: event.target.value })}
              helperText={t("bill.estimator.householdHelp")}
              disabled={!prefs.bonus}
            >
              {HOUSEHOLDS.map((value) => (
                <MenuItem key={value} value={value}>
                  {t(`bill.estimator.households.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Precios del contrato de mercado libre, para comparar. */}
          {prefs.tariff === TARIFFS.FIXED && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {t("bill.estimator.contract")}
              </Typography>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <NumberField label={t("bill.estimator.energy")} unit="€/kWh" value={prefs.myPrices.single} onChange={setPrice("single")} />
                <NumberField
                  label={t("bill.estimator.contractPower")}
                  unit={t("bill.estimator.perKwDay")}
                  value={prefs.myPrices.powerKwDay}
                  onChange={setPrice("powerKwDay")}
                  helperText={t("bill.estimator.contractPowerHelp")}
                  sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
                />
              </Box>
            </Box>
          )}
          {prefs.tariff === TARIFFS.PERIODS && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {t("bill.estimator.contract")}
              </Typography>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
                <NumberField label={PERIODS.P1.label} unit="€/kWh" value={prefs.myPrices.p1} onChange={setPrice("p1")} />
                <NumberField label={PERIODS.P2.label} unit="€/kWh" value={prefs.myPrices.p2} onChange={setPrice("p2")} />
                <NumberField label={PERIODS.P3.label} unit="€/kWh" value={prefs.myPrices.p3} onChange={setPrice("p3")} />
                <NumberField
                  label={t("bill.estimator.contractPower")}
                  unit={t("bill.estimator.perKwDay")}
                  value={prefs.myPrices.powerKwDay}
                  onChange={setPrice("powerKwDay")}
                  helperText={t("bill.estimator.contractPowerHelp")}
                  sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
                />
              </Box>
              {!usage && (
                <Box sx={{ mt: 2, px: 1 }}>
                  <Typography variant="body2" id="valley-share">
                    {rich(t("bill.estimator.valleyShare", { percent: <strong>{Math.round(prefs.valleyShare * 100)} %</strong> }))}
                  </Typography>
                  <Slider
                    aria-labelledby="valley-share"
                    value={Math.round(prefs.valleyShare * 100)}
                    min={10}
                    max={90}
                    step={5}
                    onChange={(_, value) => updatePrefs({ valleyShare: value / 100 })}
                    sx={{ maxWidth: 360 }}
                  />
                </Box>
              )}
            </Box>
          )}
          {!prefs.tariff && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t("bill.estimator.noTariff")}
              </Typography>
              <SupplyButton />
            </Stack>
          )}

        </Box>

        <Box sx={{ minWidth: 0 }}>
          {loading && !usage ? (
            <Skeleton variant="rounded" height={260} />
          ) : error && !usage ? (
            <Alert severity="warning">{t("bill.estimator.loadError")}</Alert>
          ) : (
            pvpcMonth && (
              <>
                <Box
                  sx={{
                    display: "grid",
                    columnGap: 6,
                    rowGap: 3,
                    gridTemplateColumns: { xs: "1fr", md: marketMonth ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)" },
                  }}
                >
                  <Breakdown
                    title={t("bill.estimator.withPvpc")}
                    bill={pvpcMonth}
                    highlight={marketMonth && pvpcMonth.total < marketMonth.total}
                    note={
                      usage
                        ? t("bill.estimator.noteFile")
                        : t("bill.estimator.noteAverage", { price: priceKwh(averagePriceKwh) })
                    }
                  />
                  {marketMonth && (
                    <Breakdown
                      title={t("bill.estimator.withContract")}
                      bill={marketMonth}
                      highlight={marketMonth.total < pvpcMonth.total}
                      note={
                        market.assumedPower
                          ? t("bill.estimator.noteAssumedPower")
                          : null
                      }
                    />
                  )}
                </Box>
                {(prefs.tariff === TARIFFS.PERIODS || prefs.tariff === TARIFFS.FIXED) && !marketMonth && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                    {t("bill.estimator.fillContract")}
                  </Typography>
                )}
                {verdict && (
                  <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                    {verdict}
                  </Typography>
                )}
              </>
            )
          )}
        </Box>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ sm: "baseline" }}
        sx={{ mt: 3 }}
      >
        <Typography variant="body2">
          {t("bill.estimator.cnmc")}
        </Typography>
        <Link
          href={CNMC_COMPARATOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
        >
          {t("bill.estimator.cnmcLink")} <OpenInNewIcon sx={{ fontSize: 16 }} aria-hidden="true" />
        </Link>
      </Stack>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("bill.estimator.footnote")}
      </Typography>
    </Box>
  );
}

export default BillEstimator;
