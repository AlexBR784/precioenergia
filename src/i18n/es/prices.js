/** Pestaña Precios. */
export default {
  loading: "Cargando precios",
  settings: "Ajustes",
  unitLabel: "Unidad de precio",

  noData: {
    title: "Todavía no hay precios para este día",
    body: "Red Eléctrica publica los precios del día siguiente sobre las 20:15 h. Prueba con otra fecha.",
  },
  error: {
    title: "No se han podido cargar los precios",
    body: "Red Eléctrica no ha respondido a tiempo. Puedes volver a intentarlo.",
  },
  csv: {
    file: "Precios luz {date}.csv",
    hour: "Hora",
    price: "Precio ({units})",
    priceTaxes: "Precio ({units}, con impuestos)",
  },

  headline: {
    summary: "Resumen del día",
    now: "Ahora · {hour}",
    dayAverage: "Media del día",
    atAverage: "En la media del día",
    vsAverage: ({ percent, below }) => `${percent} % ${below ? "por debajo" : "por encima"} de la media`,
    min: "Mínimo",
    max: "Máximo",
    average: "Media",
    atHour: "a las {hour}",
    ofDay: "del día",
    // "Tramo punta hasta las 22:00": `period` llega resaltado.
    period: ({ period, until }) => ["Tramo ", period, until ? ` hasta las ${until}` : ""],
  },

  chart: {
    title: "Precio por hora",
    body: "El precio de cada hora. El color va de frío (barato) a caliente (caro). Pasa el ratón o toca la gráfica para ver el precio de una hora.",
    legendGradient: "De más barato a más caro",
    legendAverage: "Media del día",
    legendNow: "Hora actual",
  },

  hours: {
    title: "Precio hora a hora",
    body: "Precio en {units} y lo que cuesta una hora de consumo a {kw} kW.",
    order: "Orden de las horas",
    byHour: "Por hora",
    cheapestFirst: "Más baratas primero",
    csvTooltip: "Descargar los precios del día en CSV (se abre en Excel, Numbers o Google Sheets)",
    toTips: "Ver consejos del día",
    styleLabel: "Cómo mostrar la comparación con la media",
    stylePercent: "Porcentaje",
    styleBar: "Barra",
    styleArrow: "Flecha",
    night: "Madrugada",
    day: "Mañana y mediodía",
    evening: "Tarde y noche",
    periodSubtitle: "{from}–{to} h · media {mean}",
    cheapest: "Las {count} más baratas",
    middle: "Intermedias",
    dearest: "Las más caras",
    colHour: "Hora",
    colPrice: "Precio",
    colVsAverage: "vs. media",
    colCost: "1 h a {kw} kW",
    nearAverage: "≈ media",
    rowAtAverage: "en la media del día",
    rowVsAverage: ({ percent, below }) => `un ${percent} % ${below ? "más barata" : "más cara"} que la media`,
    rowNow: "Hora actual. ",
    rowSummary: "{tier}, {relation}. Coste de esa hora: {cost}.",
    // Leyendas: `mean` es la media resaltada; `cheap` y `dear` resaltan su texto.
    legendBar: ({ mean, cheap, dear }) => [
      "La raya del centro es la media del día (",
      mean,
      "). La barra crece ",
      cheap("a la izquierda si la hora es más barata"),
      " y ",
      dear("a la derecha si es más cara"),
      ": cuanto más larga, más se aleja.",
    ],
    legendArrow: ({ mean, cheap, dear }) => [
      "Frente a la media del día (",
      mean,
      "): ",
      cheap("↓ más barata"),
      ", ",
      dear("↑ más cara"),
      " y «–» en la media. El color es el tramo de precio.",
    ],
    legendPercent: ({ mean, cheap, dear }) => [
      "El % compara cada hora con la media del día (",
      mean,
      "): ",
      cheap("en negativo, más barata"),
      "; ",
      dear("en positivo, más cara"),
      ".",
    ],
    footnote: ({ kw, withTaxes }) =>
      `«1 h a ${kw} kW»: lo que cuesta una hora de consumo a esa potencia (término de energía PVPC, ${
        withTaxes ? "con impuestos, sin término de potencia" : "sin impuestos ni término de potencia"
      }). Cambia la potencia en «¿Cuándo lo enciendo?».`,
  },

  month: {
    title: "Cómo va el mes",
    body: "La media de la luz este mes frente al anterior y al mismo mes del año pasado: lo que notarás en la factura.",
    load: "Ver cómo va el mes",
    loading: "Cargando tres meses de precios…",
    error: "Red Eléctrica no ha respondido. Vuelve a intentarlo en un rato.",
    similar: "{current} va parecido a {previous}",
    change: ({ current, previous, percent, cheaper }) =>
      `${current} va un ${percent} % ${cheaper ? "más barato" : "más caro"} que ${previous}`,
    throughDay: "{month} (hasta el día {day})",
    vsYear: ({ percent, cheaper }) => `Este mes va un ${percent} % ${cheaper ? "más barato" : "más caro"} que hace un año`,
    daily: "Media de cada día",
    dailyAria: "Media diaria de {days} días de {month}.",
    dailyLegend: "En verde, los días por debajo de la media del mes; en rojo, por encima.",
  },
};
