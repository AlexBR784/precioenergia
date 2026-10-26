/* eslint-disable react/prop-types */
import { useMemo } from "react";
import dayjs from "dayjs";
import { Box, Stack } from "@mui/material";

import DaySelector from "../../components/DaySelector";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats } from "../../hooks/usePriceStats";
import { useNow } from "../../hooks/useNow";
import { buildInsights } from "./dayInsights";
import DayPlan from "./DayPlan";
import RecommendationsSkeleton from "./RecommendationsSkeleton";
import WhenToRun from "./WhenToRun";

/**
 * Lectura del día: qué hacer y qué evitar según los precios publicados.
 *
 * La pestaña de precios enseña los datos; esta los traduce. Toda la lógica vive
 * en `dayInsights.js`, que es puro; aquí solo se orquesta y se pinta.
 */
export function RecommendationsTab({
  energyCost,
  loading,
  timeoutFlag,
  noData,
  fetchEnergyCost,
  date,
  onDateChange,
  units,
  baseline,
  sampleDays,
  baselineLoading,
}) {
  // El reloj entra por estado, no se lee dentro de la lógica: con la pestaña
  // abierta un rato, "ahora mismo estás en una hora cara" dejaría de ser cierto.
  const now = useNow();

  const stats = usePriceStats(energyCost, date);
  const isFuture = useMemo(() => dayjs(date).isAfter(dayjs(), "day"), [date]);

  const { verdict, insights } = useMemo(
    () =>
      buildInsights({
        energyCost,
        stats,
        baseline,
        sampleDays,
        units,
        isFuture,
        now,
      }),
    [
      energyCost,
      stats,
      baseline,
      sampleDays,
      units,
      isFuture,
      now,
    ]
  );

  // El mismo selector de día que en la pestaña de precios: el día es común a
  // las dos, así que cambiarlo aquí o allí da igual.
  const dateControl = (
    <Box component="section" aria-label="Fecha">
      <DaySelector value={date} onChange={onDateChange} />
    </Box>
  );

  if (noData) {
    return (
      <Stack spacing={3}>
        {dateControl}
        <EmptyState
          title="Todavía no hay precios para este día"
          description="Los precios del día siguiente se publican sobre las 20:15 h. Prueba con otra fecha."
        />
      </Stack>
    );
  }

  if (timeoutFlag) {
    return (
      <Stack spacing={3}>
        {dateControl}
        <ErrorState
          title="No se han podido cargar los precios"
          description="Red Eléctrica no ha respondido a tiempo. Puedes volver a intentarlo."
          onRetry={() => fetchEnergyCost(date)}
        />
      </Stack>
    );
  }

  if (loading) return <RecommendationsSkeleton />;

  return (
    <Stack spacing={3}>
      {dateControl}

      <DayPlan
        insights={insights}
        whenLabel={stats.isToday ? "hoy" : isFuture ? "mañana" : "ese día"}
        verdict={verdict}
        loadingBaseline={baselineLoading}
      />

      {/* Los consejos de arriba dan por supuesta una tarea genérica; esta
          sección responde a la concreta ("mi coche, 4 h a 7,4 kW"). Sustituye
          al antiguo diálogo de la calculadora y al gráfico "El día de un
          vistazo", que repetía la pestaña de precios. */}
      <WhenToRun energyCost={energyCost} units={units} isToday={stats.isToday} />
    </Stack>
  );
}

export default RecommendationsTab;
