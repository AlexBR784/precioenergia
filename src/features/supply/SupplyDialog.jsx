/* eslint-disable react/prop-types */
import {
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

import { REGIONS } from "../../data/spain";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { TARIFF_OPTIONS, numberOrNull } from "./supplyData";
import { t } from "../../i18n";
import { rich } from "../../i18n/rich";

/** Las tres tarifas como tarjetas elegibles (también en la pregunta de Consejos). */
export function TariffOptions({ value, onChange }) {
  return (
    <Box
      role="radiogroup"
      aria-label={t("supply.tariffGroup")}
      sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}
    >
      {TARIFF_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <ButtonBase
            key={option.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              gap: 1.25,
              p: 1.5,
              textAlign: "left",
              borderRadius: 2,
              border: 1,
              borderColor: selected ? "primary.main" : "divider",
              bgcolor: selected ? "selected" : "transparent",
              transition: "border-color 150ms, background-color 150ms",
              "&:hover": { borderColor: selected ? "primary.main" : "text.secondary" },
            }}
          >
            {selected ? (
              <CheckCircleIcon color="primary" sx={{ fontSize: 20, mt: "1px" }} aria-hidden="true" />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 20, mt: "1px", color: "text.secondary" }} aria-hidden="true" />
            )}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {option.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="p">
                {option.body}
              </Typography>
            </Box>
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/** Cómo saber qué tarifa se tiene, mirando la factura. */
export function TariffHelp() {
  return (
    <Typography variant="caption" color="text.secondary" component="p">
      {rich(t("supply.help", { strong: (text) => <strong>{text}</strong> }))}
    </Typography>
  );
}

/**
 * "Mi suministro": tarifa, región, impuestos y potencia contratada. Se guarda
 * en el navegador y lo usan Precios, Consejos y Factura.
 */
export function SupplyDialog({ open, onClose }) {
  const { prefs, region, updatePrefs } = useEnergyPrefs();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="supply-title">
      <DialogTitle id="supply-title">{t("supply.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 0.5 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              {t("supply.yourTariff")}
            </Typography>
            <TariffOptions value={prefs.tariff} onChange={(tariff) => updatePrefs({ tariff })} />
            <Box sx={{ mt: 1 }}>
              <TariffHelp />
            </Box>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label={t("supply.region")}
              value={region}
              onChange={(event) => updatePrefs({ region: event.target.value })}
              helperText={t("supply.regionHelp")}
              sx={{ flex: 1 }}
            >
              {Object.entries(REGIONS).map(([id, { label }]) => (
                <MenuItem key={id} value={id}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("supply.power")}
              defaultValue={String(prefs.contractedKw).replace(".", ",")}
              onBlur={(event) => {
                const value = numberOrNull(event.target.value);
                if (value) updatePrefs({ contractedKw: value });
              }}
              inputProps={{ inputMode: "decimal" }}
              InputProps={{ endAdornment: <InputAdornment position="end">kW</InputAdornment> }}
              helperText={t("supply.powerHelp")}
              sx={{ flex: 1 }}
            />
          </Stack>

          <FormControlLabel
            control={
              <Switch checked={prefs.withTaxes} onChange={(event) => updatePrefs({ withTaxes: event.target.checked })} />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("supply.taxesSwitch")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("supply.taxesHelp", { tax: REGIONS[region].tax.name })}
                </Typography>
              </Box>
            }
            sx={{ alignItems: "flex-start", ml: 0, gap: 1, "& .MuiSwitch-root": { mt: -0.5 } }}
          />

          {REGIONS[region].ownPrices && (
            <Typography variant="caption" color="text.secondary">
              {t("supply.ownPrices", { region: REGIONS[region].label })}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t("common.actions.done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SupplyDialog;
