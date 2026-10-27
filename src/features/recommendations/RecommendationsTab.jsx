/* eslint-disable react/prop-types */
import { useMemo } from "react";
import dayjs from "dayjs";
import { Stack } from "@mui/material";

import DaySelector from "../../components/DaySelector";
import { EmptyState, ErrorState } from "../../components/StateViews";
import { usePriceStats } from "../../hooks/usePriceStats";
import { useNow } from "../../hooks/useNow";
import { useTomorrowForecast } from "../../hooks/useTomorrowForecast";
import { buildInsights } from "./dayInsights";
import DayPlan from "./DayPlan";
import RecommendationsSkeleton from "./RecommendationsSkeleton";
import TomorrowPreview, { TomorrowNote } from "./TomorrowPreview";
import TariffAdvice from "./TariffAdvice";
import SupplyButton from "../supply/SupplyButton";
import WhenToRun from "./WhenToRun";
import { t } from "../../i18n";

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
  onOpenBill,
}) {
  // El reloj entra por estado, no se lee dentro de la lógica: con la pestaña
  // abierta un rato, "ahora mismo estás en una hora cara" dejaría de ser cierto.
  const now = useNow();

  const stats = usePriceStats(energyCost, date);
  const isFuture = useMemo(() => dayjs(date).isAfter(dayjs(), "day"), [date]);
  const isTomorrow = useMemo(() => dayjs(date).isSame(dayjs().add(1, "day"), "day"), [date]);

  // El avance de mañana solo se apunta mirando hoy.
  const { forecast } = useTomorrowForecast(stats.isToday);

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

  // Resumen para compartir: veredicto y franjas, en una línea por idea.
  const share = useMemo(() => {
    if (!verdict) return null;
    const moments = insights
      .filter((insight) => insight.kind === "moment")
      .map((insight) => `${insight.label}: ${insight.when}`);
    const title = `${verdict.title.charAt(0).toLowerCase()}${verdict.title.slice(1)}`;
    const first = t("tips.plan.shareFirstLine", { date: dayjs(date).format(t("tips.plan.shareDate")), verdict: title });
    return [first, ...moments].join("\n");
  }, [verdict, insights, date]);

  // El mismo selector de día que en la pestaña de precios: el día es común a
  // las dos, así que cambiarlo aquí o allí da igual.
  const dateControl = (
    <Stack
      component="section"
      aria-label={t("tips.settings")}
      direction="row"
      spacing={1.5}
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      useFlexGap
    >
      <DaySelector value={date} onChange={onDateChange} />
      <SupplyButton />
    </Stack>
  );

  if (noData) {
    const empty = (
      <EmptyState
        title={t("tips.noData.title")}
        description={t("tips.noData.body")}
      />
    );
    return (
      <Stack spacing={3}>
        {dateControl}
        {/* Mañana sin PVPC: el avance con el mercado mayorista, si ya lo hay. */}
        {isTomorrow ? <TomorrowPreview fallback={empty} /> : empty}
      </Stack>
    );
  }

  if (timeoutFlag) {
    return (
      <Stack spacing={3}>
        {dateControl}
        <ErrorState
          title={t("tips.error.title")}
          description={t("tips.error.body")}
          onRetry={() => fetchEnergyCost(date)}
        />
      </Stack>
    );
  }

  if (loading) return <RecommendationsSkeleton />;

  return (
    <Stack spacing={3}>
      {dateControl}

      {/* Sin PVPC los consejos por horas no ahorran: primero, lo que sí. */}
      <TariffAdvice date={date} isToday={stats.isToday} now={now} onOpenBill={onOpenBill} />

      <DayPlan
        insights={insights}
        whenLabel={stats.isToday ? "today" : isFuture ? "future" : "past"}
        verdict={verdict}
        loadingBaseline={baselineLoading}
        share={share}
        aside={
          // Mañana como apunte, no como otro veredicto: aparece cuando REE ya
          // ha publicado el mercado de mañana (hacia mediodía).
          stats.isToday && forecast?.available ? (
            <TomorrowNote
              forecast={forecast}
              onShowTomorrow={() => onDateChange(dayjs().add(1, "day"))}
            />
          ) : null
        }
      />

      {/* Los consejos de arriba dan por supuesta una tarea genérica; esta
          sección responde a la concreta ("mi coche, 4 h a 7,4 kW"). Sustituye
          al antiguo diálogo de la calculadora y al gráfico "El día de un
          vistazo", que repetía la pestaña de precios. */}
      <WhenToRun energyCost={energyCost} units={units} isToday={stats.isToday} date={date} />
    </Stack>
  );
}

export default RecommendationsTab;
