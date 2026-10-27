import { useCallback, useEffect, useState } from "react";
import { REGIONS, guessRegion } from "../data/spain";

/**
 * Lo que la app sabe del suministro del usuario, compartido y persistido:
 *
 * - `tariff`: "pvpc" (precio por horas), "periods" (mercado libre con precio
 *   por tramos), "fixed" (mercado libre con un único precio) o null (aún no
 *   lo ha dicho). Cambia qué consejos tienen sentido.
 * - `region`: decide el impuesto (IVA, IGIC o IPSI) y, en Ceuta y Melilla,
 *   los tramos horarios. Si no se ha elegido, se adivina por la zona horaria.
 * - `withTaxes`: enseñar los precios con impuestos (lo que se paga) o sin
 *   ellos (como los publica Red Eléctrica).
 * - `contractedKw`: potencia contratada, para la factura.
 * - `myPrices`: precios del contrato de mercado libre (€/kWh), para comparar.
 * - `monthlyKwh`, `bonus`, `household`, `valleyShare`: datos de la factura
 *   (consumo al mes, bono social, tamaño del hogar para su límite y qué parte
 *   del consumo cae en valle).
 */

export const ENERGY_PREFS_KEY = "precioenergia:energy-prefs";

export const TARIFFS = {
  PVPC: "pvpc",
  PERIODS: "periods",
  FIXED: "fixed",
};

const DEFAULTS = {
  tariff: null,
  region: null,
  withTaxes: false,
  contractedKw: 3.45,
  myPrices: { single: null, p1: null, p2: null, p3: null, powerKwDay: null },
  monthlyKwh: 250,
  bonus: null,
  household: "small",
  valleyShare: 0.45,
};

const BONUS_LEVELS = ["vulnerable", "severe"];
const HOUSEHOLDS = ["small", "three", "four", "large"];

const positiveOrNull = (value) => (Number.isFinite(value) && value > 0 ? value : null);

const sanitize = (raw) => {
  const prefs = { ...DEFAULTS, ...(raw && typeof raw === "object" ? raw : {}) };
  if (!Object.values(TARIFFS).includes(prefs.tariff)) prefs.tariff = null;
  if (!REGIONS[prefs.region]) prefs.region = null;
  prefs.withTaxes = prefs.withTaxes === true;
  prefs.contractedKw = positiveOrNull(Number(prefs.contractedKw)) ?? DEFAULTS.contractedKw;
  const prices = { ...DEFAULTS.myPrices, ...(prefs.myPrices ?? {}) };
  Object.keys(DEFAULTS.myPrices).forEach((key) => {
    prices[key] = positiveOrNull(Number(prices[key]));
  });
  prefs.myPrices = prices;
  prefs.monthlyKwh = positiveOrNull(Number(prefs.monthlyKwh)) ?? DEFAULTS.monthlyKwh;
  if (!BONUS_LEVELS.includes(prefs.bonus)) prefs.bonus = null;
  if (!HOUSEHOLDS.includes(prefs.household)) prefs.household = DEFAULTS.household;
  const valley = Number(prefs.valleyShare);
  prefs.valleyShare = Number.isFinite(valley) && valley >= 0 && valley <= 1 ? valley : DEFAULTS.valleyShare;
  return prefs;
};

const read = () => {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(ENERGY_PREFS_KEY)));
  } catch {
    return sanitize(null);
  }
};

// Varios componentes hermanos leen y escriben: el cambio se reparte sin props.
const listeners = new Set();
let current = null;

export const useEnergyPrefs = () => {
  const [prefs, setPrefs] = useState(() => {
    current = current ?? read();
    return current;
  });

  useEffect(() => {
    listeners.add(setPrefs);
    const onStorage = (event) => {
      if (event.key !== ENERGY_PREFS_KEY) return;
      current = read();
      listeners.forEach((listener) => listener(current));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(setPrefs);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const updatePrefs = useCallback((patch) => {
    current = sanitize({ ...(current ?? read()), ...patch });
    try {
      window.localStorage.setItem(ENERGY_PREFS_KEY, JSON.stringify(current));
    } catch {
      // Persistir es opcional; el cambio sigue vivo en esta sesión.
    }
    listeners.forEach((listener) => listener(current));
  }, []);

  return {
    prefs,
    // La región efectiva: la elegida o, si no, la que sugiere la zona horaria.
    region: prefs.region ?? guessRegion(),
    updatePrefs,
  };
};

export default useEnergyPrefs;
