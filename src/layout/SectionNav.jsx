/* eslint-disable react/prop-types */
import { Box, ButtonBase, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import TipsIcon from "@mui/icons-material/EmojiObjects";
import TipsOutlinedIcon from "@mui/icons-material/EmojiObjectsOutlined";
import BillIcon from "@mui/icons-material/ReceiptLong";
import BillOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import FuelIcon from "@mui/icons-material/LocalGasStation";
import FuelOutlinedIcon from "@mui/icons-material/LocalGasStationOutlined";

import { SECTIONS, sectionHref } from "../hooks/useSection";
import { t } from "../i18n";

/*
 * Navegación entre secciones con el patrón de barra de navegación de
 * Material 3: superficie sólida, un "indicador" tonal (píldora suave en
 * `selected`, el tinte dorado de selección de la paleta) detrás de la sección
 * activa y su icono relleno. El indicador se desliza de una sección a otra.
 *
 * Encaja con el resto de la app: mismas superficies opacas, mismos tokens y
 * sin materiales nuevos; y es el patrón que reconoce quien usa Android.
 *
 * Semántica: enlaces dentro de un <nav> con `aria-current="page"` en la
 * activa; se recorren con Tab. Lo activo se marca con tres señales a la vez
 * (fondo, icono relleno y texto en negrita), nunca solo con el color.
 */

const ICONS = {
  prices: [BoltIcon, BoltOutlinedIcon],
  tips: [TipsIcon, TipsOutlinedIcon],
  bill: [BillIcon, BillOutlinedIcon],
  fuel: [FuelIcon, FuelOutlinedIcon],
};
const iconFor = (section, active) => ICONS[section][active ? 0 : 1];

const COUNT = SECTIONS.length;

/** Curva "emphasized" de Material 3: arranca rápido y se posa suave, sin rebote. */
const SLIDE = "left 250ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease";

/**
 * Indicador deslizante: una sola píldora que cambia de columna. Las columnas
 * son iguales, así que basta con moverla una fracción del ancho. Sin sección
 * activa (página de mantenimiento) se oculta.
 */
function Indicator({ index, width, height, top }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        top,
        height,
        width: width ?? `calc(100% / ${COUNT})`,
        left: width
          ? `calc(${Math.max(index, 0)} * (100% / ${COUNT}) + (100% / ${COUNT} - ${width}px) / 2)`
          : `calc(${Math.max(index, 0)} * (100% / ${COUNT}))`,
        opacity: index < 0 ? 0 : 1,
        borderRadius: 999,
        bgcolor: "selected",
        transition: SLIDE,
        pointerEvents: "none",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        "@media (prefers-contrast: more)": { outline: "2px solid", outlineColor: "text.primary" },
      }}
    />
  );
}

/**
 * Escritorio (desde `md`): las secciones en la fila de la cabecera, junto a la
 * marca. La píldora ocupa toda la sección activa (icono y nombre).
 */
export function HeaderNav({ section }) {
  const index = SECTIONS.indexOf(section);
  return (
    <Box
      component="nav"
      aria-label={t("layout.sections")}
      sx={{ display: { xs: "none", md: "flex" }, flexGrow: 1, ml: 3 }}
    >
      <Box
        component="ul"
        sx={{
          position: "relative",
          display: "inline-grid",
          gridTemplateColumns: `repeat(${COUNT}, minmax(0, 1fr))`,
          m: 0,
          p: 0,
          listStyle: "none",
        }}
      >
        <Indicator index={index} top={0} height="100%" />
        {SECTIONS.map((id) => {
          const active = id === section;
          const Icon = iconFor(id, active);
          return (
            <li key={id} style={{ position: "relative" }}>
              <ButtonBase
                component="a"
                href={sectionHref(id)}
                aria-current={active ? "page" : undefined}
                // Sin la onda de MUI: la píldora que se desliza ya es la
                // respuesta al toque, y las dos a la vez se pisaban.
                disableRipple
                sx={{
                  width: "100%",
                  minWidth: 124,
                  height: 40,
                  gap: 0.75,
                  px: 1.75,
                  borderRadius: 999,
                  typography: "body2",
                  fontWeight: active ? 700 : 600,
                  color: active ? "text.primary" : "text.secondary",
                  transition: "color 150ms ease, background-color 150ms ease",
                  "&:hover": { color: "text.primary", bgcolor: active ? "transparent" : "action.hover" },
                  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                }}
              >
                <Icon fontSize="small" sx={{ color: active ? "primary.main" : "inherit" }} aria-hidden="true" />
                {t(`layout.tabs.${id}`)}
              </ButtonBase>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Móvil y tableta (hasta `md`): barra fija abajo, a todo el ancho, al alcance
 * del pulgar. Como en Material 3, la píldora (56 × 32 px) va solo detrás del
 * icono y el nombre queda debajo, siempre visible. Respeta la barra de inicio
 * del iPhone (`safe-area-inset-bottom`).
 */
export function BottomNav({ section }) {
  const index = SECTIONS.indexOf(section);
  return (
    <Box
      component="nav"
      aria-label={t("layout.sections")}
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        pb: "env(safe-area-inset-bottom)",
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Box
        component="ul"
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: `repeat(${COUNT}, minmax(0, 1fr))`,
          maxWidth: 640,
          mx: "auto",
          my: 0,
          p: 0,
          listStyle: "none",
        }}
      >
        <Indicator index={index} width={56} height={32} top={10} />
        {SECTIONS.map((id) => {
          const active = id === section;
          const Icon = iconFor(id, active);
          return (
            <li key={id} style={{ position: "relative", minWidth: 0 }}>
              <ButtonBase
                component="a"
                href={sectionHref(id)}
                aria-current={active ? "page" : undefined}
                // Sin la onda de MUI: la píldora que se desliza ya es la
                // respuesta al toque, y las dos a la vez se pisaban.
                disableRipple
                sx={{
                  width: "100%",
                  minHeight: 68,
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  gap: 0.5,
                  pt: "14px",
                  pb: 1,
                  color: active ? "text.primary" : "text.secondary",
                  "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -4 },
                }}
              >
                <Icon sx={{ fontSize: 24, color: active ? "primary.main" : "inherit" }} aria-hidden="true" />
                <Typography
                  component="span"
                  noWrap
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: active ? 700 : 500,
                    maxWidth: "100%",
                    px: 0.5,
                    color: "inherit",
                  }}
                >
                  {t(`layout.tabs.${id}`)}
                </Typography>
              </ButtonBase>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}
