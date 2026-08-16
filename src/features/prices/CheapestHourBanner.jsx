/* eslint-disable react/prop-types */
import { Alert, AlertTitle } from "@mui/material";
import { formatPriceWithUnits } from "./priceFormat";
import { hourOf } from "../../hooks/usePriceStats";

/**
 * Banda de estado sobre la hora más barata del día.
 *
 * Mantiene los mismos mensajes que antes vivían sueltos en App.jsx, pero
 * agrupa el precio y el contexto temporal en un único elemento en vez de dos
 * <Alert> apilados.
 */
export function CheapestHourBanner({ min, units, isToday }) {
  if (!min) return null;

  const priceText = `El precio más bajo del día es ${formatPriceWithUnits(
    min.value,
    units
  )}, a las ${min.hour} h.`;

  if (!isToday) {
    return (
      <Alert severity="info" variant="outlined">
        {priceText}
      </Alert>
    );
  }

  const currentHour = new Date().getHours();
  const cheapestHour = hourOf(min.hour);

  let severity = "info";
  let title = "";

  if (currentHour < cheapestHour) {
    const remaining = cheapestHour - currentHour;
    severity = "warning";
    title = `Faltan ${remaining} hora${remaining > 1 ? "s" : ""} para la hora más barata`;
  } else if (currentHour === cheapestHour) {
    severity = "success";
    title = "Estás en la hora más barata del día";
  } else {
    severity = "info";
    title = "La hora más barata del día ya ha pasado";
  }

  return (
    <Alert severity={severity} variant="outlined">
      <AlertTitle sx={{ fontWeight: 700, mb: 0.25 }}>{title}</AlertTitle>
      {priceText}
    </Alert>
  );
}

export default CheapestHourBanner;
