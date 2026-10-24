/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Stack, Typography } from "@mui/material";
import TipsIcon from "@mui/icons-material/EmojiObjectsOutlined";

import DateField from "../../components/DateField";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats } from "../../hooks/usePriceStats";
import { usePowerKw } from "../../hooks/usePowerKw";
import { buildInsights } from "./dayInsights";
import DayVerdict from "./DayVerdict";
import InsightCard from "./InsightCard";
import RecommendationsSkeleton from "./RecommendationsSkeleton";
import WhenToRun from "./WhenToRun";

/** Cada cuánto se refresca el reloj que alimenta los consejos horarios. */
const TICK_MS = 60_000;

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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const { powerKw, isCustom: powerIsCustom } = usePowerKw();
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
        powerKw,
        powerIsCustom,
        now,
      }),
    [
      energyCost,
      stats,
      baseline,
      sampleDays,
      units,
      isFuture,
      powerKw,
      powerIsCustom,
      now,
    ]
  );

  // Sin icono al lado: el propio DatePicker ya trae uno de calendario, y dos
  // seguidos solo hacían ruido.
  const dateControl = (
    <Box component="section" aria-label="Fecha">
      <DateField value={date} onChange={onDateChange} label="Día" />
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
          description="La API de Red Eléctrica no ha respondido a tiempo."
          onRetry={() => fetchEnergyCost(date)}
        />
      </Stack>
    );
  }

  if (loading) return <RecommendationsSkeleton />;

  return (
    <Stack spacing={3}>
      {dateControl}

      <DayVerdict
        verdict={verdict}
        units={units}
        loadingBaseline={baselineLoading}
      />

      <Box component="section" aria-labelledby="tips-heading">
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TipsIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="tips-heading">
            Qué hacer {stats.isToday ? "hoy" : isFuture ? "mañana" : "ese día"}
          </Typography>
        </Stack>

        {insights.length ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </Box>
        ) : (
          <EmptyState
            title="Nada que destacar"
            description="Los precios de este día no dan pie a ninguna recomendación concreta."
          />
        )}
      </Box>

      {/* Los consejos de arriba dan por supuesta una tarea genérica; esta
          sección responde a la concreta ("mi coche, 4 h a 7,4 kW"). Sustituye
          al antiguo diálogo de la calculadora y al gráfico "El día de un
          vistazo", que repetía la pestaña de precios. */}
      <WhenToRun energyCost={energyCost} units={units} isToday={stats.isToday} />
    </Stack>
  );
}

export default RecommendationsTab;
