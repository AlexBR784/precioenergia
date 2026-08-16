/* eslint-disable react/prop-types */
import {
  Box,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  formatEnergy,
  formatPercent,
  formatSaldo,
} from "./interchangeFormat";

function FlowBar({ label, percent, total, colorKey }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="body2" className="tabular" color="text.secondary">
          {formatPercent(percent)}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, percent))}
        aria-label={`${label}: ${formatPercent(percent)}`}
        sx={{
          mt: 0.75,
          bgcolor: "surfaceMuted",
          "& .MuiLinearProgress-bar": { bgcolor: `flow.${colorKey}` },
        }}
      />
      <Typography variant="caption" color="text.secondary" className="tabular">
        {formatEnergy(total)}
      </Typography>
    </Box>
  );
}

/** Panel de totales agregados de todas las fronteras. */
export function InterchangesTotals({ totals }) {
  const positive = totals.saldoTotal >= 0;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Todas las fronteras
      </Typography>

      <Stack spacing={2.5} sx={{ mt: 2 }}>
        <FlowBar
          label="Importación"
          percent={totals.importPct}
          total={totals.importTotal}
          colorKey="import"
        />
        <FlowBar
          label="Exportación"
          percent={totals.exportPct}
          total={totals.exportTotalAbs}
          colorKey="export"
        />
      </Stack>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" color="text.secondary">
        Saldo neto
      </Typography>
      <Typography
        className="tabular"
        sx={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: positive ? "flow.import" : "flow.export",
        }}
      >
        {formatSaldo(totals.saldoTotal)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {positive
          ? "España importó más energía de la que exportó."
          : "España exportó más energía de la que importó."}
      </Typography>
    </Paper>
  );
}

export default InterchangesTotals;
