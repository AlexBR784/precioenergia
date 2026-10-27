import { localeTag } from "./index";

/**
 * Números y fechas en el formato del idioma activo: coma decimal en
 * castellano, catalán, gallego y euskera; punto en inglés.
 */

/** Número con las opciones de `Intl.NumberFormat`. */
export const formatNumber = (value, options = {}) => new Intl.NumberFormat(localeTag(), options).format(value);

/** Número con un número fijo de decimales ("0,145"). */
export const fixed = (value, decimals) =>
  formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * Euros con el símbolo donde lo pone cada idioma ("1,23 €" en castellano,
 * "€1.23" en inglés).
 */
export const formatMoney = (amount, decimals = 2) =>
  new Intl.NumberFormat(localeTag(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

/** Fecha con las opciones de `Intl.DateTimeFormat`. */
export const formatDate = (date, options) => new Intl.DateTimeFormat(localeTag(), options).format(date);

/** Primera letra en mayúscula (los meses y días van en minúscula salvo en inglés). */
export const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);
