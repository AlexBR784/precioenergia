import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/TuneOutlined";

import { REGIONS } from "../../data/spain";
import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import SupplyDialog from "./SupplyDialog";
import { tariffLabel } from "./supplyData";
import { t } from "../../i18n";

/**
 * Acceso a "Mi suministro" desde la barra de ajustes, con lo elegido a la
 * vista ("PVPC · con impuestos"): así se entiende de un vistazo qué precios se
 * están enseñando.
 */
export function SupplyButton() {
  const [open, setOpen] = useState(false);
  const { prefs, region } = useEnergyPrefs();

  const summary = [
    tariffLabel(prefs.tariff),
    prefs.withTaxes ? t("supply.withTaxes") : t("supply.withoutTaxes"),
    region !== "peninsula" ? REGIONS[region].label : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <ButtonBase
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          minHeight: 44,
          px: 1.5,
          borderRadius: 999,
          border: 1,
          borderColor: "divider",
          textAlign: "left",
          "&:hover": { borderColor: "text.secondary" },
        }}
      >
        <TuneIcon fontSize="small" sx={{ color: "text.secondary" }} aria-hidden="true" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
            {t("supply.button")}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ lineHeight: 1.2 }}>
            {summary}
          </Typography>
        </Box>
      </ButtonBase>
      <SupplyDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default SupplyButton;
