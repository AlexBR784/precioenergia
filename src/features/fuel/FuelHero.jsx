/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStationOutlined";

import { formatEuros } from "../prices/priceFormat";
import { fillCost } from "./fuelData";
import { formatDistance, formatLiterPrice, LITER_UNITS } from "./fuelFormat";
import { t } from "../../i18n";
import { formatMoney, formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";

const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** Cada gasolinera aparece en su sitio de la escala, de la más barata a la más cara. */
const tickIn = keyframes`
  from { opacity: 0; transform: translateX(-50%) scaleY(0); }
  to   { opacity: 1; transform: translateX(-50%) scaleY(1); }
`;

/** Los marcadores entran desde el extremo barato hasta su posición (`left` final). */
const slideIn = keyframes`
  from { left: 0%; opacity: 0; }
`;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cuenta de 0 a `value` con desaceleración; sin animación si el sistema lo pide. */
function useCountUp(value, duration = 900) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (!Number.isFinite(value) || prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const step = (time) => {
      const t = Math.min(1, (time - start) / duration);
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return shown;
}

/**
 * Cómo se reparten los precios de la zona: una marca por gasolinera sobre una
 * escala de la más barata a la más cara, con la media señalada.
 *
 * Responde a la pregunta que las tres cifras sueltas (mínimo, media, máximo)
 * no contestaban: ¿la más barata es una excepción o hay muchas parecidas?
 */
function PriceSpread({ prices, min, max, average }) {
  const span = max - min;
  const pos = (price) => (span > 0 ? ((price - min) / span) * 100 : 50);
  const sorted = useMemo(() => [...prices].sort((a, b) => a - b), [prices]);
  const avgPos = pos(average);

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        role="img"
        aria-label={t("fuel.hero.spreadAria", {
          count: prices.length,
          min: formatLiterPrice(min),
          max: formatLiterPrice(max),
          units: LITER_UNITS,
          average: formatLiterPrice(average),
        })}
        sx={{ position: "relative", height: 44, mx: 0.5 }}
      >
        {/* Línea base */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 2,
            mt: "-1px",
            borderRadius: 1,
            bgcolor: "divider",
          }}
        />

        {/* Una marca por gasolinera */}
        {sorted.map((price, index) => (
          <Box
            key={index}
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: `${pos(price)}%`,
              top: "50%",
              width: 2,
              height: 16,
              mt: "-8px",
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.28),
              transformOrigin: "50% 50%",
              animation: `${tickIn} 0.45s ${EASE} ${Math.min(index * 12, 600)}ms both`,
            }}
          />
        ))}

        {/* Media */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: `${avgPos}%`,
            top: 4,
            bottom: 4,
            width: 2,
            ml: "-1px",
            borderRadius: 1,
            bgcolor: "text.primary",
            animation: `${slideIn} 0.9s ${EASE} 0.25s both`,
          }}
        />

        {/* La más barata */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: 0,
            top: "50%",
            width: 14,
            height: 14,
            mt: "-7px",
            ml: "-7px",
            borderRadius: "50%",
            bgcolor: "price.cheapest",
            boxShadow: (theme) => `0 0 0 4px ${alpha(theme.palette.price.cheapest, 0.22)}`,
          }}
        />
      </Box>

      {/* Etiquetas: extremos abajo, media centrada sobre su marca. */}
      <Box sx={{ position: "relative", height: 36, mt: 0.5 }}>
        <Box sx={{ position: "absolute", left: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t("fuel.hero.cheapestLabel")}
          </Typography>
          <Typography variant="body2" className="tabular" sx={{ fontWeight: 700, color: "price.cheapest" }}>
            {formatLiterPrice(min)}
          </Typography>
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: `clamp(25%, ${avgPos}%, 75%)`,
            transform: "translateX(-50%)",
            textAlign: "center",
            animation: `${slideIn} 0.9s ${EASE} 0.25s both`,
          }}
        >
          <Typography variant="caption" color="text.secondary" display="block">
            {t("fuel.hero.averageLabel")}
          </Typography>
          <Typography variant="body2" className="tabular" sx={{ fontWeight: 700 }}>
            {formatLiterPrice(average)}
          </Typography>
        </Box>
        <Box sx={{ position: "absolute", right: 0, textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {t("fuel.hero.priciestLabel")}
          </Typography>
          <Typography variant="body2" className="tabular" sx={{ fontWeight: 700 }}>
            {formatLiterPrice(max)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Cabecera de la pestaña: dónde está el combustible más barato, cuánto se
 * ahorra al llenar el depósito y cómo se reparten los precios de la zona.
 *
 * Sustituye al veredicto de antes y a las cuatro tarjetas de cifras, que
 * repetían el mismo precio (más barata, media) hasta tres veces en pantalla.
 * La animación es de entrada y única: las marcas de precio aparecen en orden
 * y la media se desliza a su sitio, y el ahorro cuenta hasta su cifra. Con
 * movimiento reducido todo aparece ya colocado.
 */
export function FuelHero({ fuelLabel, scopeLabel, stats, stations, liters }) {
  const { cheapest, priciest, average, count } = stats;
  const saving = fillCost(average, liters) - fillCost(cheapest.price, liters);
  const shownSaving = useCountUp(saving);
  const prices = useMemo(() => stations.map((station) => station.price), [stations]);

  const where = [
    cheapest.address,
    cheapest.locality,
    cheapest.distanceKm != null ? t("fuel.hero.distance", { distance: formatDistance(cheapest.distanceKm) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card component="section" aria-labelledby="fuel-hero-heading">
      <CardContent sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2.5, md: 4 }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "flex-start" }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "price.cheapest" }}>
              <LocalGasStationIcon sx={{ fontSize: 18 }} aria-hidden="true" />
              <Typography variant="subtitle2" sx={{ color: "inherit" }}>
                {t("fuel.hero.meta", { fuel: fuelLabel, scope: scopeLabel, count: formatNumber(count) })}
              </Typography>
            </Stack>

            <Typography
              variant="h2"
              component="h2"
              id="fuel-hero-heading"
              sx={{ mt: 1, fontSize: { xs: "1.375rem", sm: "1.625rem" }, lineHeight: 1.25 }}
            >
              {rich(
                t("fuel.hero.cheapest", {
                  brand: (
                    <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                      {cheapest.brand}
                    </Box>
                  ),
                  price: (
                    <Box component="span" className="tabular" sx={{ whiteSpace: "nowrap", color: "price.cheapest" }}>
                      {formatLiterPrice(cheapest.price)} {LITER_UNITS}
                    </Box>
                  ),
                })
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {where}
            </Typography>
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              minWidth: { md: 220 },
              p: 2,
              borderRadius: 2,
              bgcolor: "surfaceMuted",
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {t("fuel.hero.fill", { liters: formatNumber(liters) })}
            </Typography>
            <Typography className="tabular" sx={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>
              {formatEuros(fillCost(cheapest.price, liters))}
            </Typography>
            {saving >= 0.01 && (
              <Typography variant="body2" className="tabular" sx={{ color: "price.cheapest", fontWeight: 600 }}>
                {/* Dos decimales fijos: mientras cuenta, formatEuros cambiaría de 3 a 2. */}
                {t("fuel.hero.saving", { amount: formatMoney(shownSaving, 2) })}
              </Typography>
            )}
          </Box>
        </Stack>

        {count > 1 && priciest.price > cheapest.price && (
          <PriceSpread prices={prices} min={cheapest.price} max={priciest.price} average={average} />
        )}
      </CardContent>
    </Card>
  );
}

export default FuelHero;
