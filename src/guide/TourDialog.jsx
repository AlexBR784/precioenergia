import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import TipsIcon from "@mui/icons-material/EmojiObjectsOutlined";
import BillIcon from "@mui/icons-material/ReceiptLongOutlined";
import FuelIcon from "@mui/icons-material/LocalGasStationOutlined";
import SettingsIcon from "@mui/icons-material/TuneOutlined";

import { closeTour, useGuide } from "./guideStore";
import { sectionHref, useSection } from "../hooks/useSection";
import BoltMascot from "../components/BoltMascot";
import { t } from "../i18n";

/**
 * Una parada por sección y una última para los ajustes que valen en todas.
 * El rayo cambia de pose en cada paso: tranquilo con los precios, señalando
 * los consejos, con la lupa en la factura, contento con las gasolineras y
 * despidiéndose al final.
 */
const STEPS = [
  { id: "prices", Icon: BoltIcon, section: "prices", pose: "stand" },
  { id: "tips", Icon: TipsIcon, section: "tips", pose: "pointing" },
  { id: "bill", Icon: BillIcon, section: "bill", pose: "search" },
  { id: "fuel", Icon: FuelIcon, section: "fuel", pose: "cheer" },
  { id: "settings", Icon: SettingsIcon, pose: "wave" },
];

/**
 * Recorrido a demanda ("Ver recorrido", en el pie y en las novedades). Nunca
 * se abre solo. Aquí sí es un diálogo: lo ha pedido el usuario y es una
 * lectura de varios pasos, así que tiene foco atrapado y se cierra con Esc.
 */
export function TourDialog() {
  const { tourOpen } = useGuide();
  const { section } = useSection();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const close = () => {
    closeTour();
    setIndex(0);
  };

  return (
    <Dialog open={tourOpen} onClose={close} fullWidth maxWidth="xs" aria-labelledby="tour-title">
      <DialogTitle id="tour-title" sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        {/* key: en cada paso entra de nuevo con su gesto. */}
        <BoltMascot key={step.id} pose={step.pose} size={56} />
        {t("guide.tour.title")}
      </DialogTitle>
      <DialogContent>
        {/* Cada paso se anuncia al cambiar, sin mover el foco del botón. */}
        <Box aria-live="polite">
          <Typography variant="caption" color="text.secondary" component="p">
            {t("guide.tour.step", { current: index + 1, total: STEPS.length })}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mt: 1.5 }}>
            <Box
              aria-hidden="true"
              sx={{
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 999,
                bgcolor: "primarySoft",
                color: "primary.main",
              }}
            >
              <step.Icon />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{t(`guide.tour.steps.${step.id}.title`)}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t(`guide.tour.steps.${step.id}.body`)}
              </Typography>
              {/* "Ir a" solo si es otra sección: a la actual no lleva a ningún sitio. */}
              {step.section && step.section !== section && (
                <Button
                  size="small"
                  href={sectionHref(step.section)}
                  onClick={close}
                  sx={{ mt: 1, ml: -0.5 }}
                >
                  {t("guide.tour.go", { section: t(`layout.tabs.${step.section}`) })}
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={0.75} justifyContent="center" sx={{ mt: 3 }} aria-hidden="true">
          {STEPS.map((item, position) => (
            <Box
              key={item.id}
              sx={{
                width: position === index ? 20 : 8,
                height: 8,
                borderRadius: 999,
                bgcolor: position === index ? "primary.main" : "divider",
                transition: "width 200ms ease",
                "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              }}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="inherit" sx={{ mr: "auto" }}>
          {t("guide.tour.close")}
        </Button>
        {index > 0 && <Button onClick={() => setIndex(index - 1)}>{t("guide.tour.back")}</Button>}
        <Button variant="contained" onClick={() => (last ? close() : setIndex(index + 1))}>
          {last ? t("guide.tour.done") : t("guide.tour.next")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TourDialog;
