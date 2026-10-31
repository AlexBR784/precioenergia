/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { visuallyHidden } from "@mui/utils";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import ArrowDownIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpIcon from "@mui/icons-material/ArrowUpwardRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";

import { hourOf } from "../../hooks/usePriceStats";
import { usePowerKw } from "../../hooks/usePowerKw";
import { useNow } from "../../hooks/useNow";
import { PRICE_TIER_LABELS } from "../../theme/tokens";
import { euroCost, formatEuros, formatPrice } from "./priceFormat";
import { t } from "../../i18n";
import { formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";

/** Las tres partes del día en las que se agrupan las horas. */
const PERIODS = [
  { id: "night", from: 0, to: 8 },
  { id: "day", from: 8, to: 16 },
  { id: "evening", from: 16, to: 24 },
];

const ORDER = { HOUR: "hour", PRICE: "price" };

/**
 * Cómo se enseña la comparación con la media. Cada usuario entiende mejor una:
 * el número exacto, la barra (dirección y tamaño) o solo la dirección.
 */
const STYLES = { PERCENT: "percent", BAR: "bar", ARROW: "arrow" };
const STYLE_KEY = "precioenergia:average-style";

const readStoredStyle = () => {
  try {
    const stored = window.localStorage.getItem(STYLE_KEY);
    if (Object.values(STYLES).includes(stored)) return stored;
  } catch {
    // Sin localStorage: valor por defecto.
  }
  return STYLES.PERCENT;
};

/** Hora | precio | comparación con la media | coste. */
// La barra se lleva el espacio sobrante para que se lea su longitud, pero el
// precio tiene un mínimo: en móvil la barra fija lo recortaba ("0,21…").
const columnsFor = (style) =>
  style === STYLES.BAR
    ? "52px minmax(56px, auto) minmax(64px, 1fr) 68px"
    : "52px minmax(0, 1fr) 76px 68px";

const pad = (hour) => `${String(hour).padStart(2, "0")}`;

/** Por debajo de este % se considera "en la media": ±2 % no cambia la decisión. */
const NEAR_AVERAGE = 3;

/** % de la hora frente a la media del día (negativo = más barata). */
const percentVsAverage = (value, average) =>
  average ? ((value - average) / Math.abs(average)) * 100 : 0;

/**
 * Cuánto más barata o más cara es la hora que la media, dicho con un número:
 * "−78 %", "+77 %" o "≈ media", en el color de su tramo (texto, sin pastilla).
 *
 * Antes era una barra divergente (izquierda = más barata, derecha = más cara)
 * que los usuarios no entendían: la media era una rayita tenue, la longitud
 * no tenía unidades y casi todo dependía de la cabecera "← Media →".
 */
function AverageDelta({ value, average, tier }) {
  const percent = percentVsAverage(value, average);
  const near = Math.abs(percent) < NEAR_AVERAGE;
  const label = near
    ? t("prices.hours.nearAverage")
    : `${percent < 0 ? "−" : "+"}${Math.round(Math.abs(percent))} %`;

  return (
    <Box
      component="span"
      className="tabular"
      sx={{
        justifySelf: "center",
        minWidth: 64,
        textAlign: "center",
        fontSize: "0.875rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: near ? "text.secondary" : `price.${tier}`,
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Barra divergente: la raya central es la media; la barra crece hacia la
 * izquierda si la hora es más barata y hacia la derecha si es más cara, más
 * larga cuanto más se aleja (respecto a la hora que más se aleja ese día).
 */
function AverageBar({ value, average, maxDeviation, tier }) {
  const deviation = value - average;
  const width = maxDeviation > 0 ? (Math.abs(deviation) / maxDeviation) * 50 : 0;

  return (
    <Box
      aria-hidden="true"
      sx={{ position: "relative", height: 10, borderRadius: 999, bgcolor: "surfaceMuted" }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: deviation < 0 ? `${50 - width}%` : "50%",
          width: `${Math.max(width, 2)}%`,
          borderRadius: 999,
          bgcolor: `price.${tier}`,
        }}
      />
      {/* La media, bien visible: es la referencia de toda la barra */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: -4,
          bottom: -4,
          width: 2,
          ml: "-1px",
          borderRadius: 1,
          bgcolor: "text.primary",
        }}
      />
    </Box>
  );
}

/** Solo la dirección: flecha abajo (más barata) o arriba (más cara) sobre su color. */
function AverageArrow({ value, average, tier }) {
  const percent = percentVsAverage(value, average);
  const near = Math.abs(percent) < NEAR_AVERAGE;
  const Icon = near ? RemoveIcon : percent < 0 ? ArrowDownIcon : ArrowUpIcon;

  return (
    <Box
      aria-hidden="true"
      sx={{
        justifySelf: "center",
        display: "grid",
        placeItems: "center",
        width: 56,
        height: 22,
        borderRadius: 999,
        bgcolor: near ? "surfaceMuted" : `price.${tier}`,
        color: near ? "text.secondary" : "background.paper",
      }}
    >
      <Icon sx={{ fontSize: 18 }} />
    </Box>
  );
}

function AverageIndicator({ style, ...props }) {
  if (style === STYLES.BAR) return <AverageBar {...props} />;
  if (style === STYLES.ARROW) return <AverageArrow {...props} />;
  return <AverageDelta {...props} />;
}

/** Leyenda de cada estilo, en palabras y con la media en cifra. */
function AverageLegend({ style, average, units }) {
  const mean = (
    <Box component="span" className="tabular" sx={{ fontWeight: 600, color: "text.primary" }}>
      {formatPrice(average, units)} {units}
    </Box>
  );
  const cheap = (text) => (
    <Box component="span" sx={{ color: "price.cheapest", fontWeight: 600 }}>
      {text}
    </Box>
  );
  const dear = (text) => (
    <Box component="span" sx={{ color: "price.high", fontWeight: 600 }}>
      {text}
    </Box>
  );

  const key = style === STYLES.BAR ? "legendBar" : style === STYLES.ARROW ? "legendArrow" : "legendPercent";
  return rich(t(`prices.hours.${key}`, { mean, cheap, dear }));
}

function HourRow({ row, units, powerKw, average, maxDeviation, style, past, rank }) {
  const cost = euroCost(row.value, powerKw);
  const percent = percentVsAverage(row.value, average);
  const relation =
    Math.abs(percent) < NEAR_AVERAGE
      ? t("prices.hours.rowAtAverage")
      : t("prices.hours.rowVsAverage", { percent: Math.round(Math.abs(percent)), below: percent < 0 });

  return (
    <Box
      component="li"
      title={`${PRICE_TIER_LABELS[row.tier]} · ${relation}`}
      sx={{
        listStyle: "none",
        display: "grid",
        gridTemplateColumns: columnsFor(style),
        alignItems: "center",
        columnGap: 1.5,
        px: 1.25,
        py: 0.75,
        borderRadius: 1.5,
        // Las horas que ya pasaron se quedan como referencia, sin competir.
        opacity: past ? 0.45 : 1,
        bgcolor: row.isNow ? (theme) => alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.06) : "transparent",
        outline: (theme) => (row.isNow ? `1px solid ${theme.palette.primary.main}` : "none"),
      }}
    >
      <Typography className="tabular" sx={{ fontWeight: row.isNow ? 700 : 600, fontSize: "0.9375rem" }}>
        {rank != null ? (
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, mr: 0.75, fontSize: "0.75rem" }}>
            {rank}.
          </Box>
        ) : null}
        {row.datetime.slice(0, 2)}
        <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
          :00
        </Box>
      </Typography>

      <Typography className="tabular" sx={{ fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>
        {formatPrice(row.value, units)}
      </Typography>

      <AverageIndicator
        style={style}
        value={row.value}
        average={average}
        maxDeviation={maxDeviation}
        tier={row.tier}
      />

      {/* El coste va más pequeño y en gris: es otra magnitud (euros por una
          hora de consumo), no un segundo precio ni la media. */}
      <Typography
        variant="caption"
        color="text.secondary"
        className="tabular"
        sx={{ textAlign: "right", whiteSpace: "nowrap", fontSize: "0.8125rem" }}
      >
        {formatEuros(cost)}
      </Typography>

      <Box component="span" sx={visuallyHidden}>
        {row.isNow ? t("prices.hours.rowNow") : ""}
        {t("prices.hours.rowSummary", { tier: PRICE_TIER_LABELS[row.tier], relation, cost: formatEuros(cost) })}
      </Box>
    </Box>
  );
}

function Column({ title, subtitle, header, rows, renderRow }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ px: 1.25, mb: 0.75 }}>
        <Typography variant="body2" component="h3" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" className="tabular">
            {subtitle}
          </Typography>
        )}
      </Stack>
      {header}
      <Stack component="ul" spacing={0.25} sx={{ m: 0, p: 0 }}>
        {rows.map(renderRow)}
      </Stack>
    </Box>
  );
}

/**
 * "Precio hora a hora": las horas del día en tres columnas por franjas
 * (madrugada, mañana y mediodía, tarde y noche), sin scroll interno.
 *
 * Cada hora lleva su precio, su comparación con la media del día (como %, barra
 * o flecha, a elegir y recordado) y lo que
 * cuesta consumir esa hora con la potencia del usuario (la misma que usa
 * "Cuándo poner cada aparato"). Así deja de repetir la gráfica, que ya da la forma
 * del día, y responde a "¿cuánto me cuesta a esta hora?".
 *
 * Sustituye a la tabla de escritorio (tres columnas estiradas, con su propio
 * scroll) y a las 24 tarjetas de móvil. El orden vive aquí, junto a lo que
 * ordena, y no arriba con la fecha.
 */
export function HourlyBreakdown({ hours, units, average, isToday, onNavigateToTips, onExport }) {
  const [order, setOrder] = useState(ORDER.HOUR);
  const [style, setStyleState] = useState(readStoredStyle);
  const setStyle = (value) => {
    setStyleState(value);
    try {
      window.localStorage.setItem(STYLE_KEY, value);
    } catch {
      // Persistir es opcional.
    }
  };
  const { powerKw } = usePowerKw();
  const currentHour = useNow().getHours();

  const maxDeviation = useMemo(
    () => Math.max(...hours.map((row) => Math.abs(row.value - average))),
    [hours, average]
  );

  // Cabecera de columnas de cada franja, visible también en móvil (antes solo
  // salía en escritorio y en el teléfono quedaban dos cifras sin rótulo).
  const columnHeader = (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        gridTemplateColumns: columnsFor(style),
        columnGap: 1.5,
        px: 1.25,
        pb: 0.5,
        mb: 0.5,
        borderBottom: 1,
        borderColor: "divider",
        typography: "caption",
        color: "text.secondary",
      }}
    >
      <span>{t("prices.hours.colHour")}</span>
      <Box component="span" sx={{ textAlign: "right" }}>
        {t("prices.hours.colPrice")}
      </Box>
      <Box component="span" sx={{ textAlign: "center" }}>
        {t("prices.hours.colVsAverage")}
      </Box>
      <Box component="span" sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
        {t("prices.hours.colCost", { kw: formatNumber(powerKw) })}
      </Box>
    </Box>
  );

  const columns = useMemo(() => {
    if (order === ORDER.PRICE) {
      const sorted = [...hours].sort((a, b) => a.value - b.value);
      const size = Math.ceil(sorted.length / 3);
      return [
        { id: "cheap", title: t("prices.hours.cheapest", { count: size }), rows: sorted.slice(0, size), offset: 0 },
        { id: "mid", title: t("prices.hours.middle"), rows: sorted.slice(size, size * 2), offset: size },
        { id: "dear", title: t("prices.hours.dearest"), rows: sorted.slice(size * 2), offset: size * 2 },
      ];
    }
    return PERIODS.map((period) => {
      const rows = hours.filter((row) => {
        const hour = hourOf(row.datetime);
        return hour >= period.from && hour < period.to;
      });
      const mean = rows.length ? rows.reduce((sum, row) => sum + row.value, 0) / rows.length : null;
      return {
        id: period.id,
        title: t(`prices.hours.${period.id}`),
        subtitle:
          mean != null
            ? t("prices.hours.periodSubtitle", { from: pad(period.from), to: pad(period.to), mean: formatPrice(mean, units) })
            : null,
        rows,
      };
    });
  }, [hours, order, units]);

  return (
    <Box component="section" aria-labelledby="hours-heading" sx={{ pt: 3, borderTop: 1, borderColor: "divider" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" component="h2" id="hours-heading">
            {t("prices.hours.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {t("prices.hours.body", { units, kw: formatNumber(powerKw) })}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={order}
            aria-label={t("prices.hours.order")}
            onChange={(_, value) => value && setOrder(value)}
          >
            <ToggleButton value={ORDER.HOUR}>{t("prices.hours.byHour")}</ToggleButton>
            <ToggleButton value={ORDER.PRICE}>{t("prices.hours.cheapestFirst")}</ToggleButton>
          </ToggleButtonGroup>
          {onExport && (
            <Tooltip title={t("prices.hours.csvTooltip")}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onExport}
                sx={{ minHeight: { xs: 44, sm: 36 } }}
              >
                CSV
              </Button>
            </Tooltip>
          )}
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={onNavigateToTips}
            sx={{ minHeight: { xs: 44, sm: 36 } }}
          >
            {t("prices.hours.toTips")}
          </Button>
        </Stack>
      </Stack>

      {/* Leyenda del estilo elegido y el selector, a todo el ancho */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mt: -1, mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
          <AverageLegend style={style} average={average} units={units} />
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={style}
          aria-label={t("prices.hours.styleLabel")}
          onChange={(_, value) => value && setStyle(value)}
          sx={{ flexShrink: 0, "& .MuiToggleButton-root": { px: 1.25, minHeight: 32 } }}
        >
          <ToggleButton value={STYLES.PERCENT} aria-label={t("prices.hours.stylePercent")}>
            %
          </ToggleButton>
          <ToggleButton value={STYLES.BAR}>{t("prices.hours.styleBar")}</ToggleButton>
          <ToggleButton value={STYLES.ARROW}>{t("prices.hours.styleArrow")}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          columnGap: 3,
          rowGap: 3,
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            title={column.title}
            subtitle={column.subtitle}
            header={columnHeader}
            rows={column.rows}
            renderRow={(row, index) => (
              <HourRow
                key={row.datetime}
                row={row}
                units={units}
                powerKw={powerKw}
                average={average}
                maxDeviation={maxDeviation}
                style={style}
                past={isToday && hourOf(row.datetime) < currentHour}
                rank={order === ORDER.PRICE ? column.offset + index + 1 : null}
              />
            )}
          />
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
        {t("prices.hours.footnote", { kw: formatNumber(powerKw) })}
      </Typography>
    </Box>
  );
}

export default HourlyBreakdown;
