/**
 * Formateo de precios en un solo sitio.
 *
 * El número de decimales depende de la unidad: 2 en €/MWh (valores de ~100)
 * y 5 en €/kWh (valores de ~0,1). Antes se llamaba a `.toFixed(4)` o
 * `.toFixed(5)` a mano en cada punto de uso, con resultados inconsistentes.
 */

export const UNITS = {
  MWH: "€/MWh",
  KWH: "€/kWh",
};

export const decimalsFor = (units) => (units === UNITS.MWH ? 2 : 5);

/** Convierte de €/MWh (unidad de la API) a la unidad elegida. */
export const convertPrice = (price, units) =>
  units === UNITS.MWH ? price : price / 1000;

export const formatPrice = (price, units) => {
  if (price == null || !Number.isFinite(price)) return "—";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimalsFor(units),
    maximumFractionDigits: decimalsFor(units),
  }).format(convertPrice(price, units));
};

/** Precio ya formateado junto a su unidad, p.ej. "92,45 €/MWh". */
export const formatPriceWithUnits = (price, units) =>
  price == null || !Number.isFinite(price)
    ? "—"
    : `${formatPrice(price, units)} ${units}`;

/** "14:00" -> "14:00 h"; también acepta rangos "14:00-15:00". */
export const formatHour = (hour) => (hour ? `${hour} h` : "—");

/**
 * Coste real de consumir `powerKw` durante una ventana horaria.
 *
 * La API da €/MWh por hora, así que la suma de los precios de la ventana por
 * kW consumido es: € = kW × Σ(€/MWh) / 1000.
 *
 * Es la cifra que sustituye al antiguo "Total (€/MWh)", que sumaba precios de
 * distintas horas y los etiquetaba como si el resultado siguiera siendo un
 * precio: dimensionalmente no significaba nada.
 *
 * Precio de mercado mayorista: no incluye peajes, cargos ni impuestos.
 */
export const euroCost = (sumPriceMWh, powerKw) => {
  if (!Number.isFinite(sumPriceMWh) || !Number.isFinite(powerKw)) return null;
  return (sumPriceMWh * powerKw) / 1000;
};

/** Euros con los decimales justos: céntimos importan, milésimas no. */
export const formatEuros = (amount) => {
  if (amount == null || !Number.isFinite(amount)) return "—";
  // Por debajo de 1 € las dos décimas se quedan cortas (0,03 € vs 0,04 €).
  const decimals = Math.abs(amount) < 1 ? 3 : 2;
  return `${new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)} €`;
};
