/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { Box, ButtonBase, Card, CardContent, IconButton, Link, Stack, Typography } from "@mui/material";
import NewIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ChevronIcon from "@mui/icons-material/ChevronRight";
import BillIcon from "@mui/icons-material/ReceiptLongOutlined";
import SupplyIcon from "@mui/icons-material/TuneOutlined";
import LanguageIcon from "@mui/icons-material/TranslateOutlined";
import NavIcon from "@mui/icons-material/ExploreOutlined";

import { dismissWhatsNew, markWhatsNewShown, openTour, useGuide } from "./guideStore";
import { sectionHref } from "../hooks/useSection";
import { t } from "../i18n";

/** Lo nuevo y, si se puede ir a verlo, a qué sección lleva. */
const ITEMS = [
  { id: "bill", Icon: BillIcon, section: "bill" },
  { id: "supply", Icon: SupplyIcon, section: "prices" },
  { id: "languages", Icon: LanguageIcon },
  { id: "nav", Icon: NavIcon },
];

function Item({ id, Icon, section }) {
  const content = (
    <>
      <Icon fontSize="small" color="primary" aria-hidden="true" sx={{ mt: 0.25 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {t(`guide.whatsNew.items.${id}.title`)}
        </Typography>
        {/* En móvil solo el título: la tarjeta no debe empujar el precio fuera de la pantalla. */}
        <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
          {t(`guide.whatsNew.items.${id}.body`)}
        </Typography>
      </Box>
    </>
  );
  const row = { display: "flex", alignItems: "flex-start", gap: 1.5, py: 1, px: 1, mx: -1, borderRadius: 2 };
  if (!section) return <Box sx={row}>{content}</Box>;
  return (
    <ButtonBase
      component="a"
      href={sectionHref(section)}
      // Ir a verlo cuenta como visto.
      onClick={dismissWhatsNew}
      sx={{
        ...row,
        width: "100%",
        textAlign: "left",
        "&:hover": { bgcolor: "action.hover" },
        "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main" },
      }}
    >
      {content}
      <ChevronIcon fontSize="small" sx={{ color: "text.secondary", alignSelf: "center" }} aria-hidden="true" />
    </ButtonBase>
  );
}

/**
 * "Novedades": solo para quien ya usaba la web antes de los cambios, una vez
 * y en una sola visita. Esa visita no lleva además pistas.
 */
export function WhatsNew() {
  const { whatsNew } = useGuide();
  const pending = whatsNew === "pending";

  useEffect(() => {
    if (pending) markWhatsNewShown();
  }, [pending]);

  if (!pending) return null;

  return (
    <Card component="section" aria-labelledby="whats-new-heading" sx={{ mb: 3, bgcolor: "accentSoft" }}>
      <CardContent>
        {/* Sin mascota: en Precios ya están la de la cabecera y la del precio, y
            una tercera en la misma vista era demasiado. El saludo va en el recorrido. */}
        <Stack direction="row" spacing={1} alignItems="center">
          <NewIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="whats-new-heading" sx={{ flex: 1 }}>
            {t("guide.whatsNew.title")}
          </Typography>
          <IconButton size="small" onClick={dismissWhatsNew} aria-label={t("guide.whatsNew.close")} sx={{ mr: -1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 0.5 }}>
          {t("guide.whatsNew.intro")}
        </Typography>
        <Box
          sx={{
            display: "grid",
            columnGap: 3,
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {ITEMS.map((item) => (
            <Item key={item.id} {...item} />
          ))}
        </Box>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
          <Link
            component="button"
            variant="body2"
            underline="hover"
            // La tarjeta se queda: al cerrar el recorrido el foco vuelve aquí.
            onClick={openTour}
            sx={{ fontWeight: 600, minHeight: 44 }}
          >
            {t("guide.tour.open")}
          </Link>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default WhatsNew;
