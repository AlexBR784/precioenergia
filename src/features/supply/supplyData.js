import { TARIFFS } from "../../hooks/useEnergyPrefs";
import { t } from "../../i18n";

/** Las tres tarifas; título y explicación en el idioma activo. */
export const TARIFF_OPTIONS = [TARIFFS.PVPC, TARIFFS.PERIODS, TARIFFS.FIXED].map((value) => ({
  value,
  get title() {
    return t(`supply.tariffs.${value}.title`);
  },
  get body() {
    return t(`supply.tariffs.${value}.body`);
  },
}));

export const tariffLabel = (tariff) =>
  Object.values(TARIFFS).includes(tariff) ? t(`supply.tariffs.${tariff}.short`) : t("supply.tariffs.none");

/** "3,45" -> 3.45; vacío, cero o basura -> null. */
export const numberOrNull = (text) => {
  const value = parseFloat(String(text).replace(",", "."));
  return Number.isFinite(value) && value > 0 ? value : null;
};
