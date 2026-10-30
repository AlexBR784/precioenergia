import { useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import BoltMascot from "../components/BoltMascot";
import { t } from "../i18n";

const readOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

/**
 * "Sin conexión": sin red, el service worker sigue enseñando los últimos
 * precios y gasolineras que se vieron, pero nada lo decía y podían pasar por
 * los de ahora. Aparece al perder la conexión y se va sola al recuperarla.
 * Se anuncia (`role="status"`) sin mover el foco.
 */
export function OfflineNotice() {
  const [online, setOnline] = useState(readOnline);

  useEffect(() => {
    const update = () => setOnline(readOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <Box role="status" aria-live="polite">
      {!online && (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ mb: 2, px: 2, py: 1.25, borderRadius: 2, border: 1, borderColor: "divider", bgcolor: "surfaceMuted" }}
        >
          <BoltMascot mood="worried" size={32} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t("layout.offline.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary" component="p">
              {t("layout.offline.body")}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default OfflineNotice;
