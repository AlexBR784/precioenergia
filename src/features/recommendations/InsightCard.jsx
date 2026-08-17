/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import WbSunnyIcon from "@mui/icons-material/WbSunnyOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import EventIcon from "@mui/icons-material/EventOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/**
 * El mapa de iconos vive aquí y no en `dayInsights.js`: la lógica solo emite
 * una clave, y así se mantiene libre de JSX.
 */
const ICONS = {
  best: CheckCircleOutlineIcon,
  avoid: BlockIcon,
  money: EuroSymbolIcon,
  solar: WbSunnyIcon,
  clock: ScheduleIcon,
  flat: HorizontalRuleIcon,
  calendar: EventIcon,
  info: InfoOutlinedIcon,
};

/** Cada tono lleva color de icono y fondo del círculo, nunca color a secas. */
const TONES = {
  success: { color: "price.cheapest", bg: "priceSoft.cheapest" },
  warning: { color: "price.medium", bg: "priceSoft.medium" },
  danger: { color: "price.high", bg: "priceSoft.high" },
  info: { color: "primary.main", bg: "primarySoft" },
};

/**
 * Un consejo suelto.
 *
 * El color no es el único canal: cada tarjeta lleva icono propio y un título
 * explícito, igual que `PriceTierBadge` acompaña el color con su etiqueta.
 */
export function InsightCard({ insight }) {
  const Icon = ICONS[insight.icon] ?? ICONS.info;
  const tone = TONES[insight.tone] ?? TONES.info;

  return (
    <Card component="article" sx={{ height: "100%" }}>
      <CardContent sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: tone.bg,
              color: tone.color,
            }}
          >
            <Icon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" component="h3">
              {insight.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {insight.body}
            </Typography>
            {insight.note && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                {insight.note}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default InsightCard;
