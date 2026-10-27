/**
 * Evento de calendario (.ics) para "pon la lavadora a las 03:00": se abre con
 * el calendario del móvil o del ordenador y avisa un rato antes. Sustituye a
 * las notificaciones, que necesitarían un servidor.
 *
 * Las horas van "flotantes" (sin zona horaria): el calendario las pone en la
 * hora local de quien lo abre, que es como se aplica el PVPC (en Canarias, sus
 * 03:00).
 */

const pad = (value) => String(value).padStart(2, "0");

const localStamp = (date) =>
  `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(
    date.getMinutes()
  )}00`;

const utcStamp = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(
    date.getUTCMinutes()
  )}${pad(date.getUTCSeconds())}Z`;

/** Escapa el texto según RFC 5545 (comas, puntos y coma, saltos de línea). */
const escape = (text) =>
  String(text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

export const buildIcs = ({ title, start, end, description = "", alarmMinutes = 10 }) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Precio de la luz//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@precioenergia`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${localStamp(start)}`,
    `DTEND:${localStamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(title)}`,
    `TRIGGER:-PT${alarmMinutes}M`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

export const downloadIcs = (filename, event) => {
  const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
