/* eslint-disable react/prop-types */
import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PublicIcon from "@mui/icons-material/PublicOutlined";

import InterchangesFilters from "./InterchangesFilters";
import InterchangesMap from "./InterchangesMap";
import InterchangesList from "./InterchangesList";
import InterchangesTotals from "./InterchangesTotals";
import { calculatePercentages, toDisplayFrontier } from "./interchangeFormat";
import { EmptyState, ErrorState } from "../../components/StateViews";

const INFO_TEXT =
  "Flujos de energía entre España y los países frontera en el periodo elegido. " +
  "Importación: energía que entra en España. Exportación: energía que sale. " +
  "Saldo: importación menos exportación.";

function InterchangesSkeleton() {
  return (
    <Box
      aria-busy="true"
      aria-label="Cargando intercambios"
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
      }}
    >
      <Skeleton variant="rounded" height={420} />
      <Skeleton variant="rounded" height={280} />
    </Box>
  );
}

export function InterchangesTab({
  data,
  loading,
  error,
  lastUpdate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
  rangeError,
}) {
  const normalizedFlows = useMemo(
    () =>
      data.map((flow) => {
        const importTotal = Number(flow.importTotal || 0);
        const exportTotalAbs = Number(flow.exportTotalAbs || 0);
        return {
          frontera: toDisplayFrontier(flow.frontera),
          importTotal,
          exportTotalAbs,
          saldo: Number(flow.saldo || 0),
          ...calculatePercentages(importTotal, exportTotalAbs),
        };
      }),
    [data]
  );

  const totals = useMemo(() => {
    const importTotal = normalizedFlows.reduce((acc, f) => acc + f.importTotal, 0);
    const exportTotalAbs = normalizedFlows.reduce((acc, f) => acc + f.exportTotalAbs, 0);
    const saldoTotal = normalizedFlows.reduce((acc, f) => acc + f.saldo, 0);

    return {
      importTotal,
      exportTotalAbs,
      saldoTotal,
      ...calculatePercentages(importTotal, exportTotalAbs),
    };
  }, [normalizedFlows]);

  const renderBody = () => {
    if (loading) return <InterchangesSkeleton />;

    if (error) {
      return (
        <ErrorState
          title="No se han podido cargar los intercambios"
          description={error}
          onRetry={onSubmit}
        />
      );
    }

    if (normalizedFlows.length === 0) {
      return (
        <EmptyState
          title="Sin datos para este rango"
          description="No hay intercambios publicados para las fechas seleccionadas. Prueba con un rango más amplio."
        />
      );
    }

    return (
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
          alignItems: "start",
        }}
      >
        <InterchangesMap flows={data} lastUpdate={lastUpdate} />

        {/*
          Las cifras viven aquí, en una sola columna, en todos los anchos.
          Antes se pintaban dos veces entre 600 y 900 px porque las etiquetas
          del mapa y esta lista usaban breakpoints distintos.
        */}
        <Stack spacing={2}>
          <InterchangesTotals totals={totals} />
          <InterchangesList flows={normalizedFlows} />
        </Stack>
      </Box>
    );
  };

  return (
    <Card component="section" aria-labelledby="interchanges-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <PublicIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="interchanges-heading">
            Intercambios por frontera
          </Typography>
          <Tooltip title={INFO_TEXT}>
            <IconButton size="small" aria-label="Qué muestra este mapa">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
          Importaciones y exportaciones entre España y los países frontera en el
          rango de fechas seleccionado.
        </Typography>

        <InterchangesFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onSubmit={onSubmit}
          error={rangeError}
          loading={loading}
        />

        <Box sx={{ mt: 2 }}>{renderBody()}</Box>
      </CardContent>
    </Card>
  );
}

export default InterchangesTab;
