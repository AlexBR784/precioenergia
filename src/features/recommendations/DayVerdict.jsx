/* eslint-disable react/prop-types */
import { Box, Paper, Skeleton, Stack, Typography } from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { formatPrice } from "../prices/priceFormat";

const LEVELS = {
  cheap: { border: "price.cheapest", bg: "priceSoft.cheapest", icon: TrendingDownIcon },
  expensive: { border: "price.high", bg: "priceSoft.high", icon: TrendingUpIcon },
  normal: { border: "primary.main", bg: "primarySoft", icon: TrendingFlatIcon },
  unknown: { border: "divider", bg: "surfaceMuted", icon: HelpOutlineIcon },
};

/**
 * El titular de la pestaña: la lectura del día en una frase, con la media
 * como cifra de apoyo.
 *
 * Sigue el patrón destacado de `BestRangeCard` (Paper con borde de 2 px y
 * fondo tenue), pero el color lo marca el veredicto, no la marca.
 */
export function DayVerdict({ verdict, units, loadingBaseline }) {
  if (!verdict) return null;

  const level = LEVELS[verdict.level] ?? LEVELS.unknown;
  const Icon = level.icon;

  return (
    <Paper
      component="section"
      aria-labelledby="verdict-heading"
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        borderWidth: 2,
        borderColor: level.border,
        bgcolor: level.bg,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.5, sm: 3 }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={{
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "background.paper",
              color: level.border,
            }}
          >
            <Icon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h2"
              component="h2"
              id="verdict-heading"
              sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
            >
              {verdict.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {loadingBaseline ? (
                <Skeleton width={260} />
              ) : (
                verdict.body
              )}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ textAlign: { xs: "left", sm: "right" }, flexShrink: 0 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Media del día
          </Typography>
          <Typography
            className="tabular"
            sx={{
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {formatPrice(verdict.average, units)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {units}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default DayVerdict;
