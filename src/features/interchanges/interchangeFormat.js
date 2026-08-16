const HUMAN_NUMBER = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 0,
});

const PERCENT_FORMAT = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const FRONTIER_NAME_MAP = {
  francia: "Francia",
  portugal: "Portugal",
  marruecos: "Marruecos",
  andorra: "Andorra",
};

export const toDisplayFrontier = (value = "") =>
  FRONTIER_NAME_MAP[value.toLowerCase()] || value;

export const formatDate = (value) =>
  value ? new Date(value).toLocaleString("es-ES") : "N/D";

export const formatPercent = (value) => `${PERCENT_FORMAT.format(value)} %`;

export const formatEnergy = (value) =>
  `${HUMAN_NUMBER.format(Math.round(value))} MWh`;

export const formatSaldo = (value) =>
  `${value >= 0 ? "+" : ""}${HUMAN_NUMBER.format(Math.round(value))} MWh`;

export const calculatePercentages = (importTotal, exportTotalAbs) => {
  const total = Number(importTotal || 0) + Number(exportTotalAbs || 0);
  if (total <= 0) return { importPct: 0, exportPct: 0 };

  return {
    importPct: (Number(importTotal || 0) / total) * 100,
    exportPct: (Number(exportTotalAbs || 0) / total) * 100,
  };
};
