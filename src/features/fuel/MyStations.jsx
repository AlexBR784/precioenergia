/* eslint-disable react/prop-types */
import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

import { formatEuros } from "../prices/priceFormat";
import { fillCost } from "./fuelData";
import { formatLiterPrice, LITER_UNITS } from "./fuelFormat";
import { t } from "../../i18n";
import { formatNumber } from "../../i18n/format";

const cents = (euros) => formatNumber(Math.abs(euros * 100), { maximumFractionDigits: 1 });

/**
 * "Tus gasolineras": las marcadas con la estrella, con su precio de hoy frente
 * a la media de la zona y lo que se pagaría de más frente a la más barata.
 * Es la pregunta de quien siempre reposta en la misma: "¿hoy me compensa?".
 */
export function MyStations({ stations, stats, liters, onToggleFavorite, hiddenCount }) {
  if (!stations.length && !hiddenCount) return null;

  return (
    <Box component="section" aria-labelledby="my-stations-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="h2" component="h2" id="my-stations-heading">
        {t("fuel.mine.title")}
      </Typography>

      {stations.length > 0 ? (
        <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
          {stations.map((station) => {
            const vsAverage = station.price - stats.average;
            const extra = fillCost(station.price, liters) - fillCost(stats.cheapest.price, liters);
            return (
              <Stack key={station.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.25 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {station.brand}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {station.address}, {station.locality}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="p">
                    {Math.abs(vsAverage) < 0.001 ? (
                      t("fuel.mine.atAverage")
                    ) : (
                      <Box component="span" sx={{ color: vsAverage < 0 ? "price.cheapest" : "price.high", fontWeight: 600 }}>
                        {t("fuel.mine.vsAverage", { cents: cents(vsAverage), below: vsAverage < 0 })}
                      </Box>
                    )}
                    {extra >= 0.01
                      ? t("fuel.mine.extra", { liters: formatNumber(liters), amount: formatEuros(extra) })
                      : t("fuel.mine.isCheapest")}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography className="tabular" sx={{ fontSize: "1.125rem", fontWeight: 700 }}>
                    {formatLiterPrice(station.price)}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {LITER_UNITS}
                    </Typography>
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => onToggleFavorite(station.id)}
                  aria-label={t("fuel.list.unsave", { brand: station.brand })}
                  sx={{ color: "secondary.main" }}
                >
                  <StarIcon fontSize="small" />
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      ) : null}

      {hiddenCount > 0 && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
          {t("fuel.mine.hidden", { count: hiddenCount })}
        </Typography>
      )}
    </Box>
  );
}

export default MyStations;
