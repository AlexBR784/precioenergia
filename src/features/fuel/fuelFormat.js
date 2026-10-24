/** Formateo de la pestaña de carburantes. Los euros sueltos usan `formatEuros`. */

const literFormat = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** 1.699 -> "1,699". El Ministerio publica tres decimales, y se ven los tres. */
export const formatLiterPrice = (price) =>
  price == null || !Number.isFinite(price) ? "—" : literFormat.format(price);

export const LITER_UNITS = "€/L";

/** 0.85 -> "850 m"; 3.4 -> "3,4 km"; 27.6 -> "28 km". */
export const formatDistance = (km) => {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: km < 10 ? 1 : 0,
  }).format(km)} km`;
};

/** Fecha de actualización del Ministerio, p. ej. "24 oct, 15:01". */
export const formatUpdated = (date) =>
  date
    ? new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : "";

export const directionsUrl = (station) =>
  `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lon}`;
