/* eslint-disable react/prop-types */
import { useMemo } from "react";
import ReactECharts from "echarts-for-react/lib/core";
import { useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import echarts from "../theme/echarts";
import { getEChartsBase, prefersReducedMotion } from "../theme/echartsTheme";
import { getPriceTier, PRICE_TIER_LABELS } from "../theme/tokens";
import { hourOf } from "../hooks/usePriceStats";
import { useNow } from "../hooks/useNow";
import { EmptyState } from "./StateViews";
import { convertPrice, decimalsFor, UNITS } from "../features/prices/priceFormat";

/**
 * El precio del día como una línea escalonada con degradado térmico.
 *
 * - Escalonada y no curva: el PVPC es constante dentro de cada hora, así que
 *   cada hora es un tramo plano. La curva suavizada de antes se inventaba
 *   valores entre horas y se pasaba de largo en picos y valles.
 * - Degradado térmico: el color de la línea cambia de forma continua con el
 *   precio, de verde azulado (barato) a rojo teja (caro), con los mismos tonos
 *   que los tramos de la tabla. El área se desvanece hacia abajo.
 * - Referencias justas: la media del día (discontinua), la hora actual y el
 *   mínimo y el máximo marcados. Sin barra de herramientas ni bandas de
 *   "subida brusca": eran para analizar, no para decidir.
 */
function HourlyPriceChart({ data, units, isToday }) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const currentHour = useNow().getHours();

  const option = useMemo(() => {
    if (!data?.length) return null;

    const base = getEChartsBase(theme);
    const { palette } = theme;
    const animate = !prefersReducedMotion();
    const decimals = decimalsFor(units);
    const number = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    // Los tramos se calculan con los precios originales (€/MWh), igual que en
    // la tabla, para que el tooltip diga lo mismo que la fila de esa hora.
    const raw = data.map((item) => item.value);
    const rawMin = Math.min(...raw);
    const rawMax = Math.max(...raw);
    const tiers = raw.map((value) => getPriceTier(value, rawMin, rawMax));

    const values = raw.map((value) => Number(convertPrice(value, units)));
    const categories = data.map((item) => item.datetime);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const minIndex = values.indexOf(min);
    const maxIndex = values.indexOf(max);
    const nowIndex = isToday
      ? data.findIndex((item) => hourOf(item.datetime) === currentHour)
      : -1;

    const { price } = palette;
    const ring = palette.background.paper;

    const keyPoint = (index, color, text) => ({
      value: values[index],
      symbol: "circle",
      symbolSize: 9,
      itemStyle: { color, borderColor: ring, borderWidth: 2 },
      // En móvil el rótulo pisaba la línea vecina: allí se consulta tocando.
      label:
        text && !isCompact
          ? {
              show: true,
              position: values[index] >= 0 ? "top" : "bottom",
              distance: 8,
              formatter: `${text} ${number.format(values[index])}`,
              color: palette.text.primary,
              fontWeight: 600,
              fontSize: 11,
            }
          : undefined,
    });

    const seriesData = values.map((value, index) => {
      if (index === minIndex) return keyPoint(index, price.cheapest, "Mín.");
      if (index === maxIndex) return keyPoint(index, price.high, "Máx.");
      if (index === nowIndex) return keyPoint(index, palette.text.primary, null);
      return value;
    });

    const markLines = [
      {
        yAxis: average,
        lineStyle: { color: palette.text.secondary, type: "dashed", width: 1 },
        // A la izquierda y con fondo: al final quedaba tapada por el tramo de
        // la noche, que suele ser el más alto.
        label: {
          position: "insideStartTop",
          formatter: `Media ${number.format(average)}`,
          color: palette.text.secondary,
          backgroundColor: palette.background.paper,
          padding: [1, 4],
          borderRadius: 4,
          fontSize: 11,
        },
      },
    ];
    if (nowIndex !== -1) {
      markLines.push({
        xAxis: categories[nowIndex],
        lineStyle: { color: alpha(palette.text.primary, 0.5), type: "solid", width: 1 },
        label: {
          position: "end",
          formatter: "Ahora",
          color: palette.background.paper,
          backgroundColor: palette.text.primary,
          padding: [2, 6],
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
        },
      });
    }

    const isDark = palette.mode === "dark";

    return {
      backgroundColor: base.backgroundColor,
      textStyle: base.textStyle,
      animation: animate,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: {
        top: 36,
        right: 12,
        bottom: 28,
        // €/kWh muestra valores tipo 0,09231: necesita más margen izquierdo.
        left: units === UNITS.MWH ? 44 : 60,
      },
      // El degradado de la línea: el color de cada punto sale de su precio,
      // con la misma escala de cuatro tonos que los tramos.
      visualMap: {
        show: false,
        type: "continuous",
        seriesIndex: 0,
        dimension: 1,
        min,
        max: max > min ? max : min + 1,
        inRange: { color: [price.cheapest, price.low, price.medium, price.high] },
      },
      tooltip: {
        ...base.tooltip,
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: { color: alpha(palette.text.primary, 0.25), width: 1 },
        },
        formatter: (points) => {
          const index = points[0].dataIndex;
          const value = values[index];
          const diff = average !== 0 ? ((value - average) / Math.abs(average)) * 100 : 0;
          const vsAverage =
            Math.abs(diff) < 1
              ? "en la media"
              : `${Math.abs(Math.round(diff))} % ${diff < 0 ? "por debajo" : "por encima"} de la media`;
          const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:${price[tiers[index]]}"></span>`;
          return [
            `<div style="font-weight:600">${categories[index]} h${index === nowIndex ? " · ahora" : ""}</div>`,
            `<div style="font-size:15px;font-weight:700;margin:2px 0">${number.format(value)} ${units}</div>`,
            `<div>${dot}${PRICE_TIER_LABELS[tiers[index]]} · ${vsAverage}</div>`,
          ].join("");
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: categories,
        ...base.axisCommon,
        splitLine: { show: false },
        axisLabel: {
          ...base.axisCommon.axisLabel,
          // "00", "03"… en móvil; cada dos horas, sin ":00", en escritorio.
          formatter: (value) => value.slice(0, 2),
          interval: isCompact ? 2 : 1,
        },
      },
      yAxis: {
        type: "value",
        // Desde cero (o desde el mínimo, si hay horas con precio negativo):
        // así la altura del área es proporcional al precio.
        min: (extent) => Math.min(0, extent.min),
        ...base.axisCommon,
        axisLine: { show: false },
        axisLabel: {
          ...base.axisCommon.axisLabel,
          formatter: (value) =>
            new Intl.NumberFormat("es-ES", {
              maximumFractionDigits: units === UNITS.MWH ? 0 : 3,
            }).format(value),
        },
      },
      series: [
        {
          name: `Precio (${units})`,
          type: "line",
          step: "middle",
          data: seriesData,
          showSymbol: true,
          symbol: "none",
          lineStyle: { width: 2.5, cap: "round", join: "round" },
          // Área que se desvanece hacia abajo, cálida arriba: da volumen sin
          // tapar la cuadrícula ni competir con la línea.
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: alpha(price.medium, isDark ? 0.24 : 0.18) },
                { offset: 1, color: alpha(price.cheapest, 0) },
              ],
            },
          },
          emphasis: { disabled: true },
          markLine: {
            silent: true,
            symbol: "none",
            animation: false,
            data: markLines,
          },
        },
      ],
    };
  }, [data, units, theme, isCompact, isToday, currentHour]);

  if (!option) {
    return (
      <EmptyState
        title="Sin datos para el gráfico"
        description="No hay precios disponibles para representar en esta fecha."
      />
    );
  }

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      notMerge
      style={{ width: "100%", height: isCompact ? 260 : 340 }}
    />
  );
}

export default HourlyPriceChart;
