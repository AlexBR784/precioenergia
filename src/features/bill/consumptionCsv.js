import { periodAt } from "../../utils/tariffPeriods";
import { t } from "../../i18n";

/**
 * Lectura del consumo horario que descargan las distribuidoras (i-DE,
 * e-distribución, UFD, Viesgo…) y Datadis. Todas dan un CSV parecido pero no
 * igual:
 *
 *   CUPS;Fecha;Hora;Consumo_kWh;Metodo_obtencion     (Datadis, i-DE)
 *   CUPS;Fecha;Hora;AE_kWh;REAL/ESTIMADO             (e-distribución)
 *
 * con la fecha como "01/09/2026" o "2026/09/01", la hora como "1".."24" o
 * "01:00".."24:00" (la hora que TERMINA: "1" es de 00:00 a 01:00) y coma
 * decimal. Se buscan las columnas por nombre para no depender del orden.
 */

const normalize = (text) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();

const splitLine = (line, delimiter) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""));

/** "01/09/2026", "2026/09/01", "2026-09-01" o "01-09-2026" -> "2026-09-01". */
const parseDate = (raw) => {
  const text = String(raw).trim();
  let match = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/.exec(text);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(text);
  if (match) return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return null;
};

/** "1", "01", "01:00" o "00:00-01:00" -> número de la primera hora que aparece. */
const parseHour = (raw) => {
  const match = /(\d{1,2})/.exec(String(raw));
  return match ? Number(match[1]) : null;
};

/** "0,215" o "0.215" -> 0.215; con coma decimal, los puntos son de miles. */
const parseKwh = (raw) => {
  const text = String(raw).trim();
  const value = parseFloat(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/**
 * Convierte el texto del CSV en `[{ date, hour (0-23), kwh }]`.
 * Lanza un Error con un mensaje para el usuario si no lo entiende.
 */
export const parseConsumptionCsv = (text) => {
  const lines = String(text)
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) throw new Error(t("bill.import.errors.empty"));

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = splitLine(lines[0], delimiter).map(normalize);
  const dateCol = header.findIndex((name) => name.includes("fecha"));
  const hourCol = header.findIndex((name) => name.includes("hora"));
  const kwhCol = header.findIndex(
    (name, index) =>
      index !== dateCol && index !== hourCol && (name.includes("consumo") || name.includes("ae_kwh") || name.includes("kwh"))
  );
  if (dateCol < 0 || hourCol < 0 || kwhCol < 0) {
    throw new Error(t("bill.import.errors.columns"));
  }

  const raw = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delimiter);
    const date = parseDate(cells[dateCol]);
    const hour = parseHour(cells[hourCol]);
    const kwh = parseKwh(cells[kwhCol]);
    if (date && hour != null && kwh != null) raw.push({ date, hour, kwh });
  }
  if (!raw.length) throw new Error(t("bill.import.errors.rows"));

  // Si alguna hora es 0, las horas son de inicio (0-23); si no, son de fin
  // (1-24, o 25 el día del cambio de hora de octubre).
  const startsAtZero = raw.some((row) => row.hour === 0);
  return raw.map((row) => ({
    date: row.date,
    hour: Math.min(23, Math.max(0, startsAtZero ? row.hour : row.hour - 1)),
    kwh: row.kwh,
  }));
};

/**
 * Resumen del consumo: total, días, reparto por tramos y perfil por hora del
 * día (kWh medios). Opcionalmente cruzado con el PVPC de cada hora
 * (`prices`: Map "fecha|hora" -> €/MWh).
 */
export const summarizeConsumption = (rows, region, prices = null) => {
  const days = new Set(rows.map((row) => row.date));
  const byPeriod = { P1: 0, P2: 0, P3: 0 };
  const profile = Array.from({ length: 24 }, () => 0);
  let kwh = 0;
  let energyCost = 0;
  let pricedKwh = 0;

  rows.forEach((row) => {
    const [year, month, day] = row.date.split("-").map(Number);
    const moment = new Date(year, month - 1, day, row.hour);
    byPeriod[periodAt(moment, region)] += row.kwh;
    profile[row.hour] += row.kwh;
    kwh += row.kwh;
    const price = prices?.get(`${row.date}|${row.hour}`);
    if (price != null) {
      energyCost += (row.kwh * price) / 1000;
      pricedKwh += row.kwh;
    }
  });

  const sortedDays = [...days].sort();
  return {
    kwh,
    days: days.size,
    from: sortedDays[0],
    to: sortedDays[sortedDays.length - 1],
    split: {
      P1: kwh ? byPeriod.P1 / kwh : 0,
      P2: kwh ? byPeriod.P2 / kwh : 0,
      P3: kwh ? byPeriod.P3 / kwh : 0,
    },
    profile: profile.map((total) => total / Math.max(1, days.size)),
    // Precio medio que de verdad has pagado por kWh (ponderado por tu consumo).
    weightedPriceKwh: pricedKwh ? energyCost / pricedKwh : null,
    // Si faltan precios de algunas horas, la energía se escala a todo el consumo.
    pvpcEnergyCost: pricedKwh ? (energyCost * kwh) / pricedKwh : null,
    pricedShare: kwh ? pricedKwh / kwh : 0,
  };
};
