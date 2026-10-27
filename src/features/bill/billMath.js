import {
  ELECTRICITY_TAX,
  METER_RENT_MONTH,
  POWER_TERM,
  REGIONS,
  SOCIAL_BONUS,
} from "../../data/spain";
import { t } from "../../i18n";

/**
 * Cálculo de la factura de la luz de un hogar (tarifa 2.0TD), sin React, para
 * poder razonar sobre él aparte. Todas las cifras reguladas salen de
 * `data/spain.js`.
 *
 * Es una estimación: deja fuera conceptos pequeños (financiación del bono
 * social, mínimos del impuesto eléctrico) y, sin el consumo real hora a hora,
 * usa el precio medio del PVPC, que pesa igual todas las horas.
 */

/** Reparto típico del consumo de un hogar entre punta, llano y valle. */
export const DEFAULT_SPLIT = { P1: 0.25, P2: 0.3, P3: 0.45 };

/** Término de potencia regulado (peajes + cargos), con o sin el margen del PVPC. */
export const powerCost = ({ contractedKw, days, withPvpcMargin = true }) => {
  const perKwYear = POWER_TERM.p1 + POWER_TERM.p2 + (withPvpcMargin ? POWER_TERM.pvpcMargin : 0);
  return (contractedKw * days * perKwYear) / 365;
};

const meterCost = (days) => (METER_RENT_MONTH * 12 * days) / 365;

/**
 * Impuestos y total a partir de energía y potencia (ya con el descuento del
 * bono social restado, si lo hay).
 */
const closeBill = ({ energy, power, discount = 0, days, region }) => {
  const taxable = energy + power - discount;
  const electricityTax = taxable * ELECTRICITY_TAX;
  const meter = meterCost(days);
  const { tax } = REGIONS[region] ?? REGIONS.peninsula;
  const indirect = (taxable + electricityTax + meter) * tax.rate;
  const total = taxable + electricityTax + meter + indirect;

  const lines = [
    { id: "energy", label: t("bill.lines.energy"), amount: energy },
    { id: "power", label: t("bill.lines.power"), amount: power },
  ];
  if (discount > 0) lines.push({ id: "discount", label: t("bill.lines.discount"), amount: -discount });
  lines.push(
    { id: "iee", label: t("bill.lines.iee"), amount: electricityTax },
    { id: "meter", label: t("bill.lines.meter"), amount: meter },
    { id: "tax", label: t("bill.lines.tax", { tax: tax.name, rate: Math.round(tax.rate * 100) }), amount: indirect }
  );
  return { lines, total, energy, power, discount };
};

/**
 * Factura con PVPC.
 *
 * - `energyCost`: euros de energía sin impuestos. Si se conoce exacto (consumo
 *   real × precio de cada hora) se pasa tal cual; si no, se calcula como
 *   `kwh × averagePriceKwh`.
 * - `bonus`: null, "vulnerable" o "severe". El descuento se aplica a la
 *   potencia y a la energía hasta el límite de kWh del hogar (prorrateado a
 *   los días de la factura); el resto de kWh se paga sin descuento.
 */
export const pvpcBill = ({
  kwh,
  days,
  contractedKw,
  averagePriceKwh,
  energyCost = null,
  region,
  bonus = null,
  household = "small",
}) => {
  const energy = energyCost ?? kwh * averagePriceKwh;
  const power = powerCost({ contractedKw, days });

  let discount = 0;
  if (bonus && SOCIAL_BONUS.discount[bonus]) {
    const limit = ((SOCIAL_BONUS.annualLimitKwh[household] ?? SOCIAL_BONUS.annualLimitKwh.small) * days) / 365;
    const discountedShare = kwh > 0 ? Math.min(1, limit / kwh) : 1;
    discount = SOCIAL_BONUS.discount[bonus] * (power + energy * discountedShare);
  }

  return closeBill({ energy, power, discount, days, region });
};

/**
 * Factura de mercado libre con los precios del contrato del usuario: un precio
 * único o uno por tramo, y su término de potencia en €/kW·día. Sin término de
 * potencia propio se usa el regulado (sin margen), que es el mínimo posible.
 */
export const marketBill = ({ kwh, days, contractedKw, prices, split = DEFAULT_SPLIT, region }) => {
  const { single, p1, p2, p3, powerKwDay } = prices ?? {};
  let energy = null;
  if (p1 && p2 && p3) energy = kwh * (split.P1 * p1 + split.P2 * p2 + split.P3 * p3);
  else if (single) energy = kwh * single;
  if (energy == null) return null;

  const power = powerKwDay
    ? contractedKw * days * powerKwDay
    : powerCost({ contractedKw, days, withPvpcMargin: false });

  return { ...closeBill({ energy, power, days, region }), assumedPower: !powerKwDay };
};

// ---------------------------------------------------------------------------
// Bono social: ¿podría tenerlo?
// ---------------------------------------------------------------------------

/**
 * Comprobación orientativa de los requisitos de renta del bono social
 * eléctrico (RD 897/2017 y cambios posteriores):
 *
 * - Umbral de renta anual del hogar: 1,5 × IPREM para una persona, +0,3 por
 *   cada adulto más y +0,5 por cada menor; +0,5 más si hay alguien con
 *   discapacidad ≥ 33 %, dependencia II/III o víctima de violencia de género o
 *   terrorismo. Vulnerable severo: renta por debajo de la mitad del umbral.
 * - Familia numerosa o pensionistas con pensión mínima: vulnerables sin mirar
 *   la renta (severos con renta ≤ 2 × IPREM y ≤ 1 × IPREM, respectivamente).
 * - El Ingreso Mínimo Vital también da derecho.
 *
 * Devuelve `{ level: "severe" | "vulnerable" | "no" | "unknown", reasons: [] }`;
 * los motivos son claves de `bill.bonus.reasons`.
 */
export const checkSocialBonus = ({
  adults = 1,
  minors = 0,
  income = null,
  largeFamily = false,
  minimumPension = false,
  minimumIncome = false,
  specialCircumstances = false,
}) => {
  const { iprem } = SOCIAL_BONUS;
  const threshold =
    iprem * (1.5 + 0.3 * Math.max(0, adults - 1) + 0.5 * Math.max(0, minors) + (specialCircumstances ? 0.5 : 0));
  const hasIncome = Number.isFinite(income) && income >= 0;
  const reasons = [];

  if (largeFamily) {
    reasons.push("largeFamily");
    return { level: hasIncome && income <= 2 * iprem ? "severe" : "vulnerable", reasons, threshold };
  }
  if (minimumPension) {
    reasons.push("minimumPension");
    return { level: hasIncome && income <= iprem ? "severe" : "vulnerable", reasons, threshold };
  }
  if (minimumIncome) {
    reasons.push("minimumIncome");
    return { level: hasIncome && income <= threshold / 2 ? "severe" : "vulnerable", reasons, threshold };
  }
  if (!hasIncome) return { level: "unknown", reasons, threshold };
  if (income <= threshold / 2) {
    reasons.push("halfLimit");
    return { level: "severe", reasons, threshold };
  }
  if (income <= threshold) {
    reasons.push("limit");
    return { level: "vulnerable", reasons, threshold };
  }
  return { level: "no", reasons, threshold };
};

/** Límite de kWh con descuento según el hogar (para la estimación). */
export const householdFor = ({ adults = 1, minors = 0, largeFamily = false, minimumPension = false }) => {
  if (largeFamily) return "large";
  const people = adults + minors;
  if (people >= 4 || minors >= 2) return "four";
  if (people === 3 || minors === 1 || minimumPension) return "three";
  return "small";
};
