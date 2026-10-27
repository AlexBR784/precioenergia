import { useEffect } from "react";
import { getPriceTier, palette } from "../theme/tokens";
import { t } from "../i18n";
import { fixed, formatDate } from "../i18n/format";

const dateLabel = () => formatDate(new Date(), { month: "long", day: "numeric" });

let originalIcon = null;

/** Favicon redondo del color del precio de ahora (verde barato … rojo caro). */
const setPriceIcon = (color) => {
  const link = document.querySelector('link[rel="icon"][sizes="32x32"]') ?? document.querySelector('link[rel="icon"]');
  if (!link) return;
  if (originalIcon == null) originalIcon = link.href;
  if (!color) {
    link.href = originalIcon;
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = color;
  context.beginPath();
  context.arc(16, 16, 14, 0, Math.PI * 2);
  context.fill();
  link.href = canvas.toDataURL("image/png");
};

/**
 * El precio de ahora en el título de la pestaña ("0,231 €/kWh · Precio de la
 * luz") y en el color del favicon: se ve sin abrir la pestaña. Solo con los
 * precios de hoy; con otro día, el título de siempre.
 *
 * @param energyCost precios del día que se está viendo (los que se enseñan)
 * @param isToday si ese día es hoy
 * @param now reloj compartido (cambia de hora sola)
 * @param prefix nombre de la sección, delante del título ("Factura · …"), o null
 */
export const useLiveTitle = (energyCost, isToday, now, prefix = null) => {
  const hour = now.getHours();

  useEffect(() => {
    const current = isToday ? energyCost?.find((item) => Number(item.datetime.slice(0, 2)) === hour) : null;
    const withPrefix = (title) => (prefix ? `${prefix} · ${title}` : title);
    if (!current) {
      document.title = withPrefix(t("common.dateTitle", { app: t("common.appName"), date: dateLabel() }));
      setPriceIcon(null);
      return;
    }
    const values = energyCost.map((item) => item.value);
    const tier = getPriceTier(current.value, Math.min(...values), Math.max(...values));
    document.title = withPrefix(t("common.liveTitle", { price: fixed(current.value / 1000, 3), app: t("common.appName") }));
    setPriceIcon(palette.light.price[tier]);
  }, [energyCost, isToday, hour, prefix]);
};

export default useLiveTitle;
