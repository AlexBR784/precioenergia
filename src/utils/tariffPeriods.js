import { NATIONAL_FIXED_HOLIDAYS, REGIONS } from "../data/spain";
import { t } from "../i18n";

/**
 * Tramos horarios de la tarifa 2.0TD, la de todos los hogares con hasta 15 kW
 * (PVPC o mercado libre). Con precio fijo por tramos, lo que importa no es el
 * precio de cada hora sino en qué tramo cae.
 *
 * Cada región usa su hora local: un "valle hasta las 8:00" en Canarias son las
 * 8:00 de Canarias. Ceuta y Melilla tienen los tramos una hora más tarde.
 */

// Nombre y pista en el idioma activo (getters: se leen al pintar).
const period = (id) => ({
  id,
  get label() {
    return t(`common.periods.${id}`);
  },
  get hint() {
    return t(`common.periods.hint${id}`);
  },
});

export const PERIODS = { P1: period("P1"), P2: period("P2"), P3: period("P3") };

// [hora de inicio, tramo]: cada tramo dura hasta el inicio del siguiente.
const WEEKDAY = [
  [0, "P3"],
  [8, "P2"],
  [10, "P1"],
  [14, "P2"],
  [18, "P1"],
  [22, "P2"],
];

const WEEKDAY_CEUTA_MELILLA = [
  [0, "P3"],
  [8, "P2"],
  [11, "P1"],
  [15, "P2"],
  [19, "P1"],
  [23, "P2"],
];

const monthDay = (date) =>
  `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Festivo nacional que hace valle todo el día, o null. */
export const holidayOf = (date) =>
  NATIONAL_FIXED_HOLIDAYS.find((holiday) => holiday.md === monthDay(date)) ?? null;

/** true si el día entero es valle: fin de semana o festivo nacional. */
export const isAllDayValley = (date) => {
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6 || Boolean(holidayOf(date));
};

/** Tramo ("P1", "P2", "P3") de una hora concreta. */
export const periodAt = (date, region) => {
  if (isAllDayValley(date)) return "P3";
  const table = REGIONS[region]?.ownPeriods ? WEEKDAY_CEUTA_MELILLA : WEEKDAY;
  const hour = date.getHours();
  let period = table[0][1];
  for (const [start, id] of table) {
    if (hour >= start) period = id;
  }
  return period;
};

/** Los 24 tramos de un día, hora a hora. */
export const periodsOfDay = (date, region) =>
  Array.from({ length: 24 }, (_, hour) => {
    const moment = new Date(date);
    moment.setHours(hour, 0, 0, 0);
    return periodAt(moment, region);
  });

/**
 * Tramo actual, hasta cuándo dura y cuál viene después. Avanza hora a hora
 * (como mucho tres días: un puente largo sigue siendo valle).
 */
export const currentPeriod = (now, region) => {
  const period = periodAt(now, region);
  const probe = new Date(now);
  probe.setMinutes(0, 0, 0);
  for (let step = 0; step < 96; step += 1) {
    probe.setHours(probe.getHours() + 1);
    const next = periodAt(probe, region);
    if (next !== period) return { period, until: new Date(probe), next };
  }
  return { period, until: null, next: null };
};

/** Cuándo empieza el próximo valle (o null si ya se está en valle). */
export const nextValley = (now, region) => {
  if (periodAt(now, region) === "P3") return null;
  const probe = new Date(now);
  probe.setMinutes(0, 0, 0);
  for (let step = 0; step < 48; step += 1) {
    probe.setHours(probe.getHours() + 1);
    if (periodAt(probe, region) === "P3") return new Date(probe);
  }
  return null;
};

/** Por qué el día es valle entero, para decirlo con palabras. */
export const allDayValleyReason = (date) => {
  const holiday = holidayOf(date);
  if (holiday) return t("common.holidays.nationalHoliday", { name: holiday.name });
  const weekday = date.getDay();
  if (weekday === 6) return t("common.days.saturday");
  if (weekday === 0) return t("common.days.sunday");
  return null;
};
