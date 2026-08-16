/* eslint-disable react/prop-types */
import { Box, Paper, Stack, Typography } from "@mui/material";
import { formatEnergy, formatPercent, formatSaldo } from "./interchangeFormat";

/**
 * Detalle por frontera en tarjetas.
 *
 * Se muestra por debajo de `md`, cuando las etiquetas sobre el mapa no caben.
 * Antes esta lista y las etiquetas del mapa usaban breakpoints distintos y se
 * solapaban entre 600 y 900 px.
 */
export function InterchangesList({ flows }) {
  return (
    <Stack spacing={1.5} component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
      {flows.map((flow) => (
        <Paper
          key={flow.frontera}
          component="li"
          variant="outlined"
          sx={{ p: 1.75, borderRadius: 2 }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            spacing={1}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {flow.frontera}
            </Typography>
            <Typography
              variant="body2"
              className="tabular"
              sx={{
                fontWeight: 700,
                color: flow.saldo >= 0 ? "flow.import" : "flow.export",
              }}
            >
              {formatSaldo(flow.saldo)}
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <Metric
              label="Importación"
              percent={flow.importPct}
              total={flow.importTotal}
              colorKey="import"
            />
            <Metric
              label="Exportación"
              percent={flow.exportPct}
              total={flow.exportTotalAbs}
              colorKey="export"
            />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

function Metric({ label, percent, total, colorKey }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box
          aria-hidden="true"
          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: `flow.${colorKey}` }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="body2" className="tabular" sx={{ fontWeight: 600 }}>
        {formatPercent(percent)}
      </Typography>
      <Typography variant="caption" color="text.secondary" className="tabular">
        {formatEnergy(total)}
      </Typography>
    </Box>
  );
}

export default InterchangesList;
