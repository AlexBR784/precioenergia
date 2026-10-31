import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import NumberField from "../../components/NumberField";
import { SOCIAL_BONUS } from "../../data/spain";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { checkSocialBonus, householdFor } from "./billMath";
import { t } from "../../i18n";
import { formatDate, formatMoney, formatNumber } from "../../i18n/format";

const euros0 = (amount) => formatMoney(Math.round(amount), 0);
const percent = (rate) => `${formatNumber(rate * 100, { maximumFractionDigits: 1 })} %`;

const RESULTS = {
  severe: { severity: "success", percent: SOCIAL_BONUS.discount.severe },
  vulnerable: { severity: "success", percent: SOCIAL_BONUS.discount.vulnerable },
  no: { severity: "info" },
  unknown: { severity: "info" },
};

/**
 * "¿Podría tener el bono social?": comprobación orientativa con lo que pide la
 * norma (renta del hogar frente al IPREM, familia numerosa, pensión mínima,
 * Ingreso Mínimo Vital). Mucha gente con derecho no lo pide porque no sabe que
 * lo tiene. No guarda nada: los ingresos no salen de esta pantalla ni se
 * recuerdan.
 */
export function SocialBonusCheck() {
  const { updatePrefs } = useEnergyPrefs();
  const [form, setForm] = useState({
    adults: 1,
    minors: 0,
    income: null,
    largeFamily: false,
    minimumPension: false,
    minimumIncome: false,
    specialCircumstances: false,
  });
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggle = (key) => (event) => set(key)(event.target.checked);

  const result = checkSocialBonus(form);
  const view = RESULTS[result.level];
  const qualifies = result.level === "vulnerable" || result.level === "severe";

  return (
    <Box component="section" aria-labelledby="bonus-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h2" component="h2" id="bonus-heading">
        {t("bill.bonus.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
        {t("bill.bonus.body", { percent: percent(SOCIAL_BONUS.discount.severe) })}
      </Typography>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <NumberField label={t("bill.bonus.adults")} value={form.adults} min={1} max={20} onChange={(v) => v && set("adults")(Math.round(v))} />
        <NumberField label={t("bill.bonus.minors")} value={form.minors} min={0} max={20} onChange={(v) => set("minors")(Math.round(v ?? 0))} />
        <NumberField
          label={t("bill.bonus.income")}
          unit="€"
          value={form.income}
          onChange={set("income")}
          helperText={t("bill.bonus.incomeHelp")}
        />
      </Box>

      <Stack sx={{ mt: 1.5 }}>
        <FormControlLabel control={<Checkbox checked={form.largeFamily} onChange={toggle("largeFamily")} />} label={t("bill.bonus.largeFamily")} />
        <FormControlLabel
          control={<Checkbox checked={form.minimumPension} onChange={toggle("minimumPension")} />}
          label={t("bill.bonus.minimumPension")}
        />
        <FormControlLabel control={<Checkbox checked={form.minimumIncome} onChange={toggle("minimumIncome")} />} label={t("bill.bonus.minimumIncome")} />
        <FormControlLabel
          control={<Checkbox checked={form.specialCircumstances} onChange={toggle("specialCircumstances")} />}
          label={t("bill.bonus.special")}
        />
      </Stack>

      <Alert severity={view.severity} sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {t(`bill.bonus.results.${result.level}`, { percent: view.percent != null ? percent(view.percent) : "" })}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {qualifies &&
            result.reasons.length > 0 &&
            t("bill.bonus.because", { reasons: result.reasons.map((reason) => t(`bill.bonus.reasons.${reason}`)) })}
          {!form.largeFamily && !form.minimumPension && t("bill.bonus.threshold", { amount: euros0(result.threshold) })}
          {qualifies && t("bill.bonus.requirements")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
          <Link
            href={SOCIAL_BONUS.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.5 }}
          >
            {t("bill.bonus.howTo")} <OpenInNewIcon sx={{ fontSize: 16 }} aria-hidden="true" />
          </Link>
          {qualifies && (
            <Button
              size="small"
              onClick={() => updatePrefs({ bonus: result.level, household: householdFor(form) })}
            >
              {t("bill.bonus.apply")}
            </Button>
          )}
        </Stack>
      </Alert>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
        {t("bill.bonus.footnote", { iprem: euros0(SOCIAL_BONUS.iprem), date: formatDate(new Date(SOCIAL_BONUS.validUntil)) })}
      </Typography>
    </Box>
  );
}

export default SocialBonusCheck;
