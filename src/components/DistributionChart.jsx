/* eslint-disable react/prop-types */
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getEChartsBase, prefersReducedMotion } from "../theme/echartsTheme";
import { EmptyState } from "./StateViews";
import {
  convertPrice,
  decimalsFor,
  UNITS,
} from "../features/prices/priceFormat";

/** Subida brusca respecto a la hora anterior, en la unidad mostrada. */
const jumpThreshold = (units) => (units === UNITS.MWH ? 25 : 0.025);

function DistributionChart({ data, units }) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const option = useMemo(() => {
    if (!data?.length) return null;

    const base = getEChartsBase(theme);
    const { palette } = theme;
    const animate = !prefersReducedMotion();
    const decimals = decimalsFor(units);

    // Las etiquetas salen del propio dato. Antes se regeneraban a partir del
    // índice del array, así que en los días de cambio de hora (23 o 25 horas)
    // se desincronizaban de los valores.
    const categories = data.map((item) => item.datetime);
    const values = data.map((item) => Number(convertPrice(item.value, units)));

    const threshold = jumpThreshold(units);

    // Tramos con subida brusca: se colorean en rojo y se sombrea el área.
    const pieces = [];
    const markAreas = [];
    for (let i = 1; i < values.length; i++) {
      const isJump = values[i] - values[i - 1] > threshold;
      pieces.push({
        gt: i - 1,
        lte: i,
        color: isJump ? palette.price.high : palette.price.cheapest,
      });
      if (isJump) {
        markAreas.push([{ xAxis: categories[i - 1] }, { xAxis: categories[i] }]);
      }
    }

    return {
      backgroundColor: base.backgroundColor,
      textStyle: base.textStyle,
      animation: animate,
      grid: {
        top: 32,
        // La última etiqueta ("23:00") se centra sobre el punto final, así que
        // necesita media etiqueta de margen o el contenedor la recorta.
        right: 28,
        bottom: isCompact ? 56 : 32,
        // €/kWh muestra valores tipo 0,09231: necesita más margen izquierdo.
        left: units === UNITS.MWH ? 48 : 68,
        containLabel: false,
      },
      tooltip: {
        ...base.tooltip,
        trigger: "axis",
        axisPointer: { type: "cross", label: { show: false } },
        valueFormatter: (value) =>
          `${new Intl.NumberFormat("es-ES", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(value)} ${units}`,
      },
      toolbox: {
        show: true,
        right: 8,
        top: 0,
        iconStyle: { borderColor: palette.text.secondary },
        emphasis: { iconStyle: { borderColor: palette.primary.main } },
        feature: {
          magicType: { type: ["line", "bar"], title: { line: "Líneas", bar: "Barras" } },
          dataZoom: { yAxisIndex: "none", title: { zoom: "Zoom", back: "Deshacer zoom" } },
          restore: { title: "Restaurar" },
          saveAsImage: {
            title: "Guardar",
            name: `Precio_luz_${new Date().toLocaleDateString("es-ES").replaceAll("/", "-")}`,
            backgroundColor: palette.background.paper,
          },
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
          // En pantallas estrechas 24 etiquetas se solapan: se rotan y se
          // muestra una de cada dos.
          rotate: isCompact ? 45 : 0,
          interval: isCompact ? 1 : "auto",
        },
      },
      yAxis: {
        type: "value",
        scale: true,
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
      visualMap: {
        show: false,
        dimension: 0,
        pieces,
        outOfRange: { color: palette.price.cheapest },
      },
      series: [
        {
          name: `Precio (${units})`,
          type: "line",
          smooth: true,
          showSymbol: false,
          data: values,
          lineStyle: { width: 2.5 },
          areaStyle: {
            opacity: 0.12,
            color: palette.primary.main,
          },
          markArea: {
            silent: true,
            itemStyle: { color: alpha(palette.price.high, 0.14) },
            data: markAreas,
          },
        },
      ],
    };
  }, [data, units, theme, isCompact]);

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
      option={option}
      notMerge
      style={{ width: "100%", height: isCompact ? 300 : 380 }}
    />
  );
}

export default DistributionChart;
