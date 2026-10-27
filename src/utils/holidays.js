import { NATIONAL_FIXED_HOLIDAYS, easterSunday } from "../data/spain";
import { t } from "../i18n";

/**
 * Próximas fechas de muchos desplazamientos en España: festivos nacionales,
 * Semana Santa, la salida de agosto y Navidad. Sirven para avisar de que, si
 * se va a viajar, conviene no esperar al último día para repostar.
 */
const peaksOfYear = (year) => {
  const easter = easterSunday(year);
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);

  return [
    ...NATIONAL_FIXED_HOLIDAYS.map(({ md, name }) => {
      const [month, day] = md.split("-").map(Number);
      return { date: new Date(year, month - 1, day), name };
    }),
    { date: holyThursday, name: t("common.holidays.easter") },
    { date: new Date(year, 7, 1), name: t("common.holidays.august") },
    { date: new Date(year, 11, 23), name: t("common.holidays.christmas") },
  ];
};

/**
 * El primer pico de viajes en los próximos `withinDays` días (sin contar hoy),
 * o null. Un festivo en fin de semana no cuenta: no alarga nada.
 */
export const upcomingTravelPeak = (now = new Date(), withinDays = 5) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);

  return (
    [...peaksOfYear(today.getFullYear()), ...peaksOfYear(today.getFullYear() + 1)]
      .filter(({ date }) => date > today && date <= limit)
      .filter(({ date }) => date.getDay() !== 0 && date.getDay() !== 6)
      .sort((a, b) => a.date - b.date)[0] ?? null
  );
};
