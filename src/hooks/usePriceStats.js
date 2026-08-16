import { useMemo } from "react";
import dayjs from "dayjs";
import { getPriceTier } from "../theme/tokens";

/** Hora entera ("14:00" -> 14) tal y como la normaliza useEnergyCost. */
export const hourOf = (datetime = "") => parseInt(datetime.split(":")[0], 10);

/**
 * Deriva de los precios del día todo lo que la UI necesita mostrar:
 * mínimo, máximo, media, precio de la hora actual, ahorro potencial y el
 * tramo de cada hora.
 *
 * Antes esto se recalculaba suelto en el cuerpo de App.jsx en cada render.
 *
 * @param energyCost datos crudos del hook useEnergyCost ([{ datetime, value }])
 * @param selectedDate fecha mostrada; "ahora" solo tiene sentido si es hoy
 */
export const usePriceStats = (energyCost, selectedDate) => {
  const isToday = useMemo(
    () => dayjs(selectedDate).isSame(dayjs(), "day"),
    [selectedDate]
  );

  return useMemo(() => {
    if (!energyCost || energyCost.length === 0) {
      return {
        isToday,
        min: null,
        max: null,
        average: null,
        current: null,
        savingPct: null,
        tierOf: () => "medium",
        hours: [],
      };
    }

    const values = energyCost.map((item) => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;

    const minEntry = energyCost.find((item) => item.value === minValue);
    const maxEntry = energyCost.find((item) => item.value === maxValue);

    const nowHour = new Date().getHours();
    const currentEntry = isToday
      ? energyCost.find((item) => hourOf(item.datetime) === nowHour)
      : null;

    // Cuánto se ahorra consumiendo en la hora más barata en vez de la más cara.
    const savingPct =
      maxValue > 0 ? ((maxValue - minValue) / maxValue) * 100 : null;

    const tierOf = (value) => getPriceTier(value, minValue, maxValue);

    return {
      isToday,
      min: minEntry ? { value: minValue, hour: minEntry.datetime } : null,
      max: maxEntry ? { value: maxValue, hour: maxEntry.datetime } : null,
      average,
      current: currentEntry
        ? { value: currentEntry.value, hour: currentEntry.datetime }
        : null,
      savingPct,
      tierOf,
      hours: energyCost.map((item) => ({
        ...item,
        tier: tierOf(item.value),
        isNow: isToday && hourOf(item.datetime) === nowHour,
      })),
    };
  }, [energyCost, isToday]);
};

export default usePriceStats;
