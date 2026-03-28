/* eslint-disable react/prop-types */
import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import {
  Alert,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import spainNeighborsGeoJson from "../assets/spain-neighbors.geo.json";

const COUNTRY_COORDS = {
  Espana: [-3.7038, 40.4168], // Madrid
  Francia: [2.3522, 48.8566], // Paris
  Portugal: [-9.1393, 38.7223], // Lisboa
  Marruecos: [-6.8498, 34.0209], // Rabat
  Andorra: [1.5218, 42.5063], // Andorra la Vella
};

const FRONTIER_NAME_MAP = {
  francia: "Francia",
  portugal: "Portugal",
  marruecos: "Marruecos",
  andorra: "Andorra",
};
const CALLOUT_POSITIONS = {
  Portugal: { left: "4%", top: "56%" },
  Francia: { left: "55%", top: "9%" },
  Andorra: { right: "6%", top: "34%" },
  Marruecos: { left: "44%", top: "75%" },
};
const EXPORT_COLOR = "#23b7d9";
const IMPORT_COLOR = "#2457a6";

const HUMAN_NUMBER = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

const PERCENT_FORMAT = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const toDisplayFrontier = (value = "") => {
  const normalized = value.toLowerCase();
  return FRONTIER_NAME_MAP[normalized] || value;
};

const formatDate = (value) => {
  if (!value) return "N/D";
  return new Date(value).toLocaleString("es-ES");
};

const formatPercent = (value) => `${PERCENT_FORMAT.format(value)} %`;

const formatSaldo = (value) =>
  `${value >= 0 ? "+" : ""}${HUMAN_NUMBER.format(Math.round(value))} MWh`;

const calculatePercentages = (importTotal, exportTotalAbs) => {
  const total = Number(importTotal || 0) + Number(exportTotalAbs || 0);
  if (total <= 0) {
    return { importPct: 0, exportPct: 0 };
  }

  return {
    importPct: (Number(importTotal || 0) / total) * 100,
    exportPct: (Number(exportTotalAbs || 0) / total) * 100,
  };
};

echarts.registerMap("spain-neighbors", spainNeighborsGeoJson);

function InterchangesMap({ flows = [], lastUpdate }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const normalizedFlows = useMemo(() => {
    return flows
      .map((flow) => {
        const frontera = toDisplayFrontier(flow.frontera);
        const importTotal = Number(flow.importTotal || 0);
        const exportTotalAbs = Number(flow.exportTotalAbs || 0);
        const saldo = Number(flow.saldo || 0);
        const percentages = calculatePercentages(importTotal, exportTotalAbs);

        return {
          frontera,
          importTotal,
          exportTotalAbs,
          saldo,
          ...percentages,
        };
      })
      .filter((flow) => COUNTRY_COORDS[flow.frontera]);
  }, [flows]);

  const totals = useMemo(() => {
    const importTotal = normalizedFlows.reduce(
      (acc, flow) => acc + flow.importTotal,
      0
    );
    const exportTotalAbs = normalizedFlows.reduce(
      (acc, flow) => acc + flow.exportTotalAbs,
      0
    );
    const saldoTotal = normalizedFlows.reduce((acc, flow) => acc + flow.saldo, 0);
    const percentages = calculatePercentages(importTotal, exportTotalAbs);

    return {
      importTotal,
      exportTotalAbs,
      saldoTotal,
      ...percentages,
    };
  }, [normalizedFlows]);

  const chartOption = useMemo(() => {
    const maxMagnitude = Math.max(
      1,
      ...normalizedFlows.flatMap((flow) => [flow.importTotal, flow.exportTotalAbs])
    );

    const lineWidth = (value) => 0.8 + (Math.max(0, value) / maxMagnitude) * 1.7;
    const lineOpacity = (value) => 0.35 + (Math.max(0, value) / maxMagnitude) * 0.4;

    const exportLines = normalizedFlows.map((flow) => ({
      fromName: "España",
      toName: flow.frontera,
      coords: [COUNTRY_COORDS.Espana, COUNTRY_COORDS[flow.frontera]],
      value: flow.exportTotalAbs,
      flowType: "export",
      frontera: flow.frontera,
      importTotal: flow.importTotal,
      exportTotalAbs: flow.exportTotalAbs,
      saldo: flow.saldo,
      lineStyle: {
        width: lineWidth(flow.exportTotalAbs),
        opacity: lineOpacity(flow.exportTotalAbs),
      },
    }));

    const importLines = normalizedFlows.map((flow) => ({
      fromName: flow.frontera,
      toName: "España",
      coords: [COUNTRY_COORDS[flow.frontera], COUNTRY_COORDS.Espana],
      value: flow.importTotal,
      flowType: "import",
      frontera: flow.frontera,
      importTotal: flow.importTotal,
      exportTotalAbs: flow.exportTotalAbs,
      saldo: flow.saldo,
      lineStyle: {
        width: lineWidth(flow.importTotal),
        opacity: lineOpacity(flow.importTotal),
      },
    }));

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (!params?.data?.flowType) return "";

          const { frontera, importTotal, exportTotalAbs, saldo, flowType } =
            params.data;
          const direction =
            flowType === "export"
              ? "Exportación España → frontera"
              : "Importación frontera → España";
          const { importPct, exportPct } = calculatePercentages(
            importTotal,
            exportTotalAbs
          );

          return [
            `<b>${frontera}</b>`,
            direction,
            `Importación: ${formatPercent(importPct)}`,
            `Exportación: ${formatPercent(exportPct)}`,
            `Saldo: ${formatSaldo(saldo)}`,
          ].join("<br/>");
        },
      },
      geo: {
        map: "spain-neighbors",
        roam: false,
        center: isMobile ? [-2.3, 41.2] : [-2.2, 42.2],
        zoom: isMobile ? 3.45 : 3.7,
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: "#f2f8fc",
          borderColor: "#b7d8ec",
          borderWidth: 1.2,
        },
        emphasis: {
          disabled: true,
        },
        regions: [
          {
            name: "Spain",
            itemStyle: {
              areaColor: "#e8f3fb",
              borderColor: "#2e81ac",
              borderWidth: 4,
            },
          },
          {
            name: "Portugal",
            itemStyle: {
              areaColor: "#edf7ff",
              borderColor: "#5da7cc",
              borderWidth: 2.2,
            },
          },
          {
            name: "France",
            itemStyle: {
              areaColor: "#eef4ff",
              borderColor: "#8ac0dc",
              borderWidth: 2,
            },
          },
          {
            name: "Andorra",
            itemStyle: {
              areaColor: "#f2f7ff",
              borderColor: "#8ac0dc",
              borderWidth: 2,
            },
          },
          {
            name: "Morocco",
            itemStyle: {
              areaColor: "#fff4e6",
              borderColor: "#d9b38c",
              borderWidth: 1.6,
            },
          },
        ],
      },
      series: [
        {
          name: "Exportación",
          type: "lines",
          coordinateSystem: "geo",
          zlevel: 2,
          symbol: ["none", "arrow"],
          symbolSize: 7,
          effect: {
            show: true,
            period: 4,
            trailLength: 0.08,
            symbol: "arrow",
            symbolSize: 7,
          },
          lineStyle: {
            color: EXPORT_COLOR,
            curveness: 0.24,
            type: "solid",
            cap: "round",
          },
          data: exportLines,
        },
        {
          name: "Importación",
          type: "lines",
          coordinateSystem: "geo",
          zlevel: 3,
          symbol: ["none", "arrow"],
          symbolSize: 7,
          effect: {
            show: true,
            period: 4,
            trailLength: 0.08,
            symbol: "arrow",
            symbolSize: 7,
          },
          lineStyle: {
            color: IMPORT_COLOR,
            curveness: 0.24,
            type: "dashed",
            cap: "round",
          },
          data: importLines,
        },
      ],
    };
  }, [normalizedFlows, isMobile]);

  if (normalizedFlows.length === 0) {
    return (
      <Alert severity="info">
        No hay fronteras con datos de intercambio para el rango seleccionado.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
        gap: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: 2,
          background:
            "linear-gradient(180deg, rgba(246,251,255,1) 0%, rgba(240,248,253,1) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          sx={{ px: 1, pb: 1 }}
        >
          <Stack spacing={0.8}>
            <Typography variant="subtitle1" fontWeight={700}>
              Mapa de Flujos Fronterizos
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Stack direction="row" spacing={0.7} alignItems="center">
                <Box
                  sx={{
                    width: 20,
                    height: 0,
                    borderTop: `3px solid ${EXPORT_COLOR}`,
                    borderRadius: 999,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Exportación
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.7} alignItems="center">
                <Box
                  sx={{
                    width: 20,
                    height: 0,
                    borderTop: `3px dashed ${IMPORT_COLOR}`,
                    borderRadius: 999,
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Importación
                </Typography>
              </Stack>
            </Stack>
          </Stack>
          <Chip
            size="small"
            label={`Actualizado: ${formatDate(lastUpdate)}`}
            variant="outlined"
          />
        </Stack>
        <Box sx={{ position: "relative" }}>
          <ReactECharts
            option={chartOption}
            style={{
              width: "100%",
              height: isMobile ? "320px" : "clamp(360px, 52vw, 560px)",
            }}
          />

          {!isMobile && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              {normalizedFlows.map((flow) => {
                const position = CALLOUT_POSITIONS[flow.frontera];
                if (!position) return null;

                return (
                  <Paper
                    key={`callout-${flow.frontera}`}
                    variant="outlined"
                    sx={{
                      position: "absolute",
                      ...position,
                      px: 1.1,
                      py: 0.9,
                      borderRadius: 1.2,
                      borderColor: "#cfe2f0",
                      bgcolor: "rgba(255,255,255,0.93)",
                      minWidth: 145,
                      boxShadow: "0 6px 20px rgba(38, 101, 148, 0.10)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "#1b4f72", lineHeight: 1.2 }}
                    >
                      {flow.frontera}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "#0f172a", mt: 0.25 }}
                    >
                      Saldo: {formatSaldo(flow.saldo)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "#64748b", mt: 0.15 }}
                    >
                      I {formatPercent(flow.importPct)} - E {formatPercent(flow.exportPct)}
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper
        variant="outlined"
        sx={{ p: 1.4, borderRadius: 2, display: { xs: "block", md: "none" } }}
      >
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Datos por frontera
        </Typography>
        <Stack spacing={1}>
          {normalizedFlows.map((flow) => (
            <Box
              key={`mobile-${flow.frontera}`}
              sx={{
                p: 1,
                border: "1px solid #d8e6f0",
                borderRadius: 1.2,
                bgcolor: "#f9fcff",
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                {flow.frontera}
              </Typography>
              <Typography variant="caption" display="block">
                Saldo: {formatSaldo(flow.saldo)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: "#64748b" }}>
                I {formatPercent(flow.importPct)} - E {formatPercent(flow.exportPct)}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total de todas las fronteras
          </Typography>

          <Box sx={{ mt: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              Exportación {formatPercent(totals.exportPct)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={totals.exportPct}
              sx={{
                mt: 0.6,
                height: 10,
                borderRadius: 10,
                bgcolor: "#e7eef4",
                "& .MuiLinearProgress-bar": { bgcolor: EXPORT_COLOR },
              }}
            />
          </Box>

          <Box sx={{ mt: 1.6 }}>
            <Typography variant="body2" fontWeight={600}>
              Importación {formatPercent(totals.importPct)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={totals.importPct}
              sx={{
                mt: 0.6,
                height: 10,
                borderRadius: 10,
                bgcolor: "#e7eef4",
                "& .MuiLinearProgress-bar": { bgcolor: IMPORT_COLOR },
              }}
            />
          </Box>

          <Divider sx={{ my: 1.7 }} />
          <Typography variant="h6" fontWeight={800}>
            SALDO {formatSaldo(totals.saldoTotal)}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}

export default InterchangesMap;
