/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import TipsIcon from "@mui/icons-material/EmojiObjectsOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";

import DateField from "../../components/DateField";
import DayTimeline from "../../components/DayTimeline";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats } from "../../hooks/usePriceStats";
import { usePowerKw } from "../../hooks/usePowerKw";
import { findRanges } from "../prices/cheapRanges";
import CheapRangesDialog from "../prices/CheapRangesDialog";
import { buildInsights } from "./dayInsights";
import DayVerdict from "./DayVerdict";
import InsightCard from "./InsightCard";
import RecommendationsSkeleton from "./RecommendationsSkeleton";

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
  const [dialogOpen, setDialogOpen] = useState(false);

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

  // La franja recomendada que se recuadra en la línea de tiempo es la misma
  // que menciona el consejo "Mejor franja".
  const valley = useMemo(
    () => findRanges(energyCost, { hours: 3, topN: 1 }).best[0] ?? null,
    [energyCost]
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

      <Card component="section" aria-labelledby="timeline-heading">
        <CardContent>
          <Typography variant="h2" component="h2" id="timeline-heading">
            El día de un vistazo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Cada segmento es una hora, con la misma escala de color que la tabla
            de precios. El recuadro marca la mejor franja de 3 horas seguidas.
          </Typography>

          <DayTimeline
            energyCost={energyCost}
            range={valley}
            isToday={stats.isToday}
          />
        </CardContent>
      </Card>

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

      {/* Los consejos de arriba dan por supuesta una tarea genérica. Quien
          tenga una concreta ("seis horas de carga a 7,4 kW") necesita la
          calculadora, y este es el sitio donde surge esa pregunta: es su única
          entrada, desde la pestaña de precios solo se enlaza aquí. */}
      <Paper
        component="section"
        aria-labelledby="tune-heading"
        variant="outlined"
        sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "surfaceMuted" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h3" component="h2" id="tune-heading">
              ¿Tienes una tarea concreta?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Ajusta cuántas horas seguidas necesitas y la potencia de tu aparato
              {powerIsCustom
                ? ` (ahora mismo, ${powerKw.toLocaleString("es-ES")} kW)`
                : ""}
              , y te dice el mejor momento con su coste.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ flexShrink: 0, minHeight: 44 }}
          >
            Calcular tramos baratos
          </Button>
        </Stack>
      </Paper>

      <CheapRangesDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        energyCost={energyCost}
        units={units}
        isToday={stats.isToday}
      />
    </Stack>
  );
}

export default RecommendationsTab;
