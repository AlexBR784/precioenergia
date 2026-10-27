/**
 * Datos de referencia de España que cambian por ley o por decreto: impuestos,
 * peajes, bono social, butano, gas regulado y calendario.
 *
 * Están todos aquí, con la fecha de la última revisión y de dónde salen, para
 * que actualizarlos sea tocar un solo archivo. Nada de esto viene de una API:
 * si una cifra cambia en el BOE, hay que cambiarla a mano.
 *
 * Última revisión: 27 de octubre de 2026.
 */

import { t } from "../i18n";

export const REVIEWED_AT = "2026-10-27";

// ---------------------------------------------------------------------------
// Regiones
// ---------------------------------------------------------------------------

/**
 * El PVPC es el mismo en la Península, Baleares y Canarias (cada uno en su
 * hora local). Ceuta y Melilla tienen algunas horas distintas que la API
 * pública de REE no ofrece, y sus tramos horarios van una hora más tarde.
 * Lo que sí cambia en cada región es el impuesto indirecto.
 */
/** Impuesto indirecto: `id` fijo y nombre en el idioma activo (IVA, BEZ, VAT…). */
const tax = (id, rate) => ({
  id,
  rate,
  get name() {
    return t(`common.taxes.${id}`);
  },
});

export const REGIONS = {
  peninsula: { get label() { return t("common.regions.peninsula"); }, tax: tax("IVA", 0.21) },
  baleares: { get label() { return t("common.regions.baleares"); }, tax: tax("IVA", 0.21) },
  // IGIC al 0 % para personas físicas en su vivienda con hasta 10 kW
  // contratados (3 % en el resto de casos).
  canarias: { get label() { return t("common.regions.canarias"); }, tax: tax("IGIC", 0) },
  // IPSI: 4 % desde junio de 2026, cuando terminó la rebaja temporal al 1 %.
  ceuta: { get label() { return t("common.regions.ceuta"); }, tax: tax("IPSI", 0.04), ownPeriods: true, ownPrices: true },
  melilla: { get label() { return t("common.regions.melilla"); }, tax: tax("IPSI", 0.04), ownPeriods: true, ownPrices: true },
};

export const DEFAULT_REGION = "peninsula";

/** Región probable según la zona horaria del navegador (solo Canarias se distingue). */
export const guessRegion = () => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone === "Atlantic/Canary") return "canarias";
    if (zone === "Africa/Ceuta") return "ceuta";
  } catch {
    // Sin Intl completo: Península.
  }
  return DEFAULT_REGION;
};

// ---------------------------------------------------------------------------
// Impuestos de la electricidad
// ---------------------------------------------------------------------------

/**
 * Impuesto especial sobre la electricidad: 5,11269632 % sobre energía y
 * potencia (estuvo al 0,5 % entre marzo y mayo de 2026). El IVA general de la
 * luz es del 21 % desde el 1 de junio de 2026. El Gobierno puede rebajarlos de
 * nuevo si el IPC eléctrico se dispara: revisar en cada cambio.
 */
export const ELECTRICITY_TAX = 0.0511269632;

/**
 * Fechas en las que conviene mirar si han cambiado el IVA o el impuesto
 * eléctrico. No tienen calendario fijo (van por real decreto-ley), pero la
 * cláusula de 2026 permite volver a rebajarlos en noviembre y diciembre si el
 * IPC eléctrico se dispara. Lo usa la página de mantenimiento.
 */
export const TAX_WATCH_DATES = ["2026-11-01", "2026-12-01"];

/** Factor que convierte un precio de energía sin impuestos en precio final. */
export const taxFactor = (region = DEFAULT_REGION) =>
  (1 + ELECTRICITY_TAX) * (1 + (REGIONS[region] ?? REGIONS[DEFAULT_REGION]).tax.rate);

// ---------------------------------------------------------------------------
// Tarifa 2.0TD: término de potencia y otros fijos
// ---------------------------------------------------------------------------

/**
 * Peajes (CNMC, Resolución de 18-12-2025) y cargos (Orden TED/1524/2025) del
 * término de potencia en 2026, en €/kW y año. Con PVPC se suma el margen de
 * comercialización, que va solo en P1.
 */
export const POWER_TERM = {
  p1: 27.704413,
  p2: 0.725423,
  pvpcMargin: 3.113,
  /** Se fijan cada año (la CNMC en diciembre, los cargos por orden ministerial). */
  validUntil: "2026-12-31",
};

/** Alquiler del contador monofásico más habitual, en €/mes. */
export const METER_RENT_MONTH = 0.81;

// ---------------------------------------------------------------------------
// Bono social eléctrico
// ---------------------------------------------------------------------------

/**
 * Descuentos vigentes hasta el 31-12-2026 sobre energía y potencia, solo con
 * PVPC, en vivienda habitual y con hasta 10 kW. Se aplican hasta un límite de
 * consumo anual que depende del hogar; lo que lo supera se paga sin descuento.
 */
export const SOCIAL_BONUS = {
  validUntil: "2026-12-31",
  discount: { vulnerable: 0.425, severe: 0.575 },
  /** IPREM anual de 14 pagas (congelado desde 2023). Lo fijan los Presupuestos. */
  iprem: 8400,
  ipremYear: 2026,
  /** kWh al año con descuento. */
  annualLimitKwh: {
    small: 1587, // una o dos personas
    three: 2222, // tres personas, o dos con un menor, o pensionistas
    four: 2698, // cuatro personas, o dos adultos con dos menores
    large: 4761, // familia numerosa
  },
  officialUrl: "https://www.bonosocial.gob.es/",
};

// ---------------------------------------------------------------------------
// Precios regulados de otros suministros
// ---------------------------------------------------------------------------

/**
 * Bombona de butano de 12,5 kg (Península y Baleares), precio máximo con
 * impuestos. Se revisa cada dos meses (el tercer martes de enero, marzo, mayo,
 * julio, septiembre y noviembre) con un tope de subida del 5 %; además hay un
 * techo de 19,55 € hasta el 30-06-2027.
 */
export const BUTANE = {
  price: 18.84,
  previousPrice: 17.95,
  since: "2026-09-15",
  nextReview: "2026-11-17",
  cap: { price: 19.55, until: "2027-06-30" },
};

/**
 * Tarifa de último recurso (TUR) del gas natural, sin impuestos. Se revisa
 * cada trimestre (enero, abril, julio y octubre). El tramo de consumo de
 * cada una está en `bill.regulated.tiers` (textos traducidos).
 */
export const GAS_TUR = {
  since: "2026-10-01",
  nextReview: "2027-01-01",
  tiers: [
    { id: "TUR1", label: "TUR 1", fixedMonth: 3.83, variableKwh: 0.052526, previousVariableKwh: 0.0433 },
    { id: "TUR2", label: "TUR 2", fixedMonth: 8.17, variableKwh: 0.050428, previousVariableKwh: 0.041199 },
    { id: "TUR3", label: "TUR 3", fixedMonth: 19.32, variableKwh: 0.046988, previousVariableKwh: null },
  ],
};

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------

/**
 * Festivos que cuentan como valle todo el día en la tarifa 2.0TD: los
 * nacionales de fecha fija que no se pueden sustituir (y el 6 de enero). Los
 * autonómicos y locales NO cuentan, ni el Viernes Santo (no tiene fecha fija).
 * El nombre de cada uno sale del idioma activo.
 */
export const NATIONAL_FIXED_HOLIDAYS = ["01-01", "01-06", "05-01", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"].map(
  (md) => ({
    md,
    get name() {
      return t(`common.holidays.${md}`);
    },
  })
);

/** Domingo de Pascua (algoritmo de Meeus/Butcher), para Semana Santa. */
export const easterSunday = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

export const CNMC_COMPARATOR_URL = "https://comparador.cnmc.gob.es/";
