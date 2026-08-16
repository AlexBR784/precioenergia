/* eslint-disable react/prop-types */
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import spainNeighborsGeoJson from "../../assets/spain-neighbors.geo.json";
import { getEChartsBase, prefersReducedMotion } from "../../theme/echartsTheme";
import {
  calculatePercentages,
  formatDate,
  formatPercent,
  formatSaldo,
  toDisplayFrontier,
} from "./interchangeFormat";

/** Destino de las líneas de flujo: capital de cada país. */
const COUNTRY_COORDS = {
  Espana: [-3.7038, 40.4168],
  Francia: [2.3522, 48.8566],
  Portugal: [-9.1393, 38.7223],
  Marruecos: [-6.8498, 34.0209],
  Andorra: [1.5218, 42.5063],
};

echarts.registerMap("spain-neighbors", spainNeighborsGeoJson);

/** Nombres de las regiones tal como vienen en el GeoJSON. */
const REGION_NAMES = ["Spain", "Portugal", "France", "Andorra", "Morocco"];

export function InterchangesMap({ flows = [], lastUpdate }) {
  const theme = useTheme();
  // Un único corte responsive en toda la app. Antes convivían `down("sm")`
  // para las etiquetas y `md` para la lista, así que entre 600 y 900 px se
  // pintaban las dos cosas y los datos aparecían duplicados.
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const normalizedFlows = useMemo(
    () =>
      flows
        .map((flow) => {
          const frontera = toDisplayFrontier(flow.frontera);
          const importTotal = Number(flow.importTotal || 0);
          const exportTotalAbs = Number(flow.exportTotalAbs || 0);

          return {
            frontera,
            importTotal,
            exportTotalAbs,
            saldo: Number(flow.saldo || 0),
            ...calculatePercentages(importTotal, exportTotalAbs),
          };
        })
        .filter((flow) => COUNTRY_COORDS[flow.frontera]),
    [flows]
  );

  const chartOption = useMemo(() => {
    const base = getEChartsBase(theme);
    const { palette } = theme;
    const animate = !prefersReducedMotion();

    const maxMagnitude = Math.max(
      1,
      ...normalizedFlows.flatMap((flow) => [flow.importTotal, flow.exportTotalAbs])
    );
    const lineWidth = (value) => 0.8 + (Math.max(0, value) / maxMagnitude) * 1.7;
    const lineOpacity = (value) => 0.4 + (Math.max(0, value) / maxMagnitude) * 0.45;

    const buildLine = (flow, type) => {
      const isExport = type === "export";
      const value = isExport ? flow.exportTotalAbs : flow.importTotal;

      return {
        fromName: isExport ? "España" : flow.frontera,
        toName: isExport ? flow.frontera : "España",
        coords: isExport
          ? [COUNTRY_COORDS.Espana, COUNTRY_COORDS[flow.frontera]]
          : [COUNTRY_COORDS[flow.frontera], COUNTRY_COORDS.Espana],
        value,
        flowType: type,
        ...flow,
        lineStyle: { width: lineWidth(value), opacity: lineOpacity(value) },
      };
    };

    const flowSeries = (type, color, dashed) => ({
      name: type === "export" ? "Exportación" : "Importación",
      type: "lines",
      coordinateSystem: "geo",
      zlevel: type === "export" ? 2 : 3,
      symbol: ["none", "arrow"],
      symbolSize: 7,
      effect: {
        show: animate,
        period: 4,
        trailLength: 0.08,
        symbol: "arrow",
        symbolSize: 7,
      },
      lineStyle: { color, curveness: 0.24, type: dashed ? "dashed" : "solid", cap: "round" },
      data: normalizedFlows.map((flow) => buildLine(flow, type)),
    });

    return {
      backgroundColor: base.backgroundColor,
      textStyle: base.textStyle,
      animation: animate,
      tooltip: {
        ...base.tooltip,
        trigger: "item",
        formatter: (params) => {
          const data = params?.data;
          if (!data?.flowType) return "";
          const direction =
            data.flowType === "export"
              ? "Exportación España → frontera"
              : "Importación frontera → España";

          return [
            `<b>${data.frontera}</b>`,
            direction,
            `Importación: ${formatPercent(data.importPct)}`,
            `Exportación: ${formatPercent(data.exportPct)}`,
            `Saldo: ${formatSaldo(data.saldo)}`,
          ].join("<br/>");
        },
      },
      geo: {
        map: "spain-neighbors",
        roam: false,
        center: isCompact ? [-2.3, 41.2] : [-2.2, 42.2],
        zoom: isCompact ? 3.45 : 3.7,
        label: { show: false },
        itemStyle: {
          areaColor: palette.map.land,
          borderColor: palette.map.landBorder,
          borderWidth: 1,
        },
        emphasis: { disabled: true },
        regions: REGION_NAMES.map((name) => ({
          name,
          itemStyle:
            name === "Spain"
              ? {
                  areaColor: palette.map.spain,
                  borderColor: palette.map.spainBorder,
                  borderWidth: 2.5,
                }
              : {
                  areaColor: palette.map.land,
                  borderColor: palette.map.landBorder,
                  borderWidth: 1.2,
                },
        })),
      },
      series: [
        flowSeries("export", palette.flow.export, false),
        flowSeries("import", palette.flow.import, true),

        // Solo el nombre del país sobre el mapa. Las cifras exactas van en la
        // columna lateral: superponerlas al mapa obligaba a calibrar posiciones
        // a mano y se solapaban entre sí a ciertos anchos.
        {
          type: "scatter",
          coordinateSystem: "geo",
          zlevel: 5,
          silent: true,
          symbolSize: 1,
          data: normalizedFlows.map((flow) => ({
            name: flow.frontera,
            value: COUNTRY_COORDS[flow.frontera],
            label: {
              show: true,
              position: "top",
              distance: 6,
              color: palette.text.secondary,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: theme.typography.fontFamily,
              textBorderColor: palette.background.paper,
              textBorderWidth: 3,
              formatter: flow.frontera,
            },
          })),
        },
      ],
    };
  }, [normalizedFlows, isCompact, theme]);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <LegendItem color={theme.palette.flow.export} label="Exportación" />
          <LegendItem color={theme.palette.flow.import} label="Importación" dashed />
        </Stack>

        <Chip
          size="small"
          variant="outlined"
          label={
            <>
              Actualizado:{" "}
              <Box component="time" dateTime={lastUpdate || undefined}>
                {formatDate(lastUpdate)}
              </Box>
            </>
          }
        />
      </Stack>

      <ReactECharts
        option={chartOption}
        notMerge
        style={{
          width: "100%",
          height: isCompact ? 320 : "clamp(380px, 46vw, 540px)",
        }}
      />
    </Paper>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box
        aria-hidden="true"
        sx={{
          width: 22,
          height: 0,
          borderTop: `3px ${dashed ? "dashed" : "solid"} ${color}`,
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}

export default InterchangesMap;
