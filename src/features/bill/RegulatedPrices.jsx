import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import PropaneIcon from "@mui/icons-material/PropaneTankOutlined";
import FireIcon from "@mui/icons-material/LocalFireDepartmentOutlined";

import { BUTANE, GAS_TUR, REGIONS } from "../../data/spain";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { t } from "../../i18n";
import { fixed, formatDate, formatMoney, formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";

const euros2 = (amount) => formatMoney(amount, 2);
const centsKwh = (euros) => t("bill.regulated.centsKwh", { value: fixed(euros * 100, 2) });
const longDate = (iso) => formatDate(new Date(`${iso}T12:00:00`), { day: "numeric", month: "long" });
const pct = (now, before) => Math.round(((now - before) / before) * 100);

/** Consumo típico de un piso con caldera de gas (agua caliente y calefacción). */
const TYPICAL_GAS_KWH_YEAR = 4000;

/**
 * Los otros precios regulados de casa: la bombona de butano y la tarifa de
 * último recurso (TUR) del gas natural. No vienen de ninguna API: los publica
 * el BOE en cada revisión y se actualizan a mano en `data/spain.js`.
 */
export function RegulatedPrices() {
  const { region } = useEnergyPrefs();
  const butaneChange = BUTANE.price - BUTANE.previousPrice;
  const tur1 = GAS_TUR.tiers[0];
  const typicalMonth = tur1.fixedMonth + (TYPICAL_GAS_KWH_YEAR / 12) * tur1.variableKwh;
  const outsideButaneArea = region === "canarias" || region === "ceuta" || region === "melilla";

  return (
    <Card component="section" aria-labelledby="regulated-heading">
      <CardContent>
        <Typography variant="h2" component="h2" id="regulated-heading">
          {t("bill.regulated.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
          {t("bill.regulated.body")}
        </Typography>

        <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2fr) minmax(0, 3fr)" } }}>
          {/* Butano */}
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
              <PropaneIcon sx={{ fontSize: 18 }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {t("bill.regulated.butane")}
              </Typography>
            </Stack>
            <Typography className="tabular" sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
              {euros2(BUTANE.price)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rich(
                t("bill.regulated.butaneSince", {
                  date: longDate(BUTANE.since),
                  change: (
                    <Box component="span" sx={{ color: butaneChange > 0 ? "price.high" : "price.cheapest", fontWeight: 600 }}>
                      {butaneChange > 0 ? "+" : "−"}
                      {euros2(Math.abs(butaneChange))} ({pct(BUTANE.price, BUTANE.previousPrice)} %)
                    </Box>
                  ),
                })
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
              {t("bill.regulated.butaneNext", {
                date: longDate(BUTANE.nextReview),
                cap: euros2(BUTANE.cap.price),
                until: formatDate(new Date(BUTANE.cap.until)),
              })}
              {outsideButaneArea ? t("bill.regulated.butaneOutside", { region: REGIONS[region].label }) : ""}
            </Typography>
          </Box>

          {/* Gas natural TUR */}
          <Box>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
              <FireIcon sx={{ fontSize: 18 }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {t("bill.regulated.gas")}
              </Typography>
            </Stack>
            <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
              {GAS_TUR.tiers.map((tier) => (
                <Stack key={tier.id} direction="row" spacing={2} justifyContent="space-between" alignItems="baseline" sx={{ py: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tier.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t(`bill.regulated.tiers.${tier.id}`)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" className="tabular" sx={{ fontWeight: 600 }}>
                      {centsKwh(tier.variableKwh)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="tabular">
                      {t("bill.regulated.perMonth", { amount: euros2(tier.fixedMonth) })}
                      {tier.previousVariableKwh
                        ? t("bill.regulated.sinceQuarter", {
                            change: `${pct(tier.variableKwh, tier.previousVariableKwh) > 0 ? "+" : ""}${pct(
                              tier.variableKwh,
                              tier.previousVariableKwh
                            )}`,
                          })
                        : ""}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {rich(
                t("bill.regulated.typical", {
                  kwh: formatNumber(TYPICAL_GAS_KWH_YEAR),
                  amount: <strong className="tabular">{euros2(typicalMonth)}</strong>,
                })
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
              {t("bill.regulated.gasNote", { since: longDate(GAS_TUR.since), next: longDate(GAS_TUR.nextReview) })}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default RegulatedPrices;
