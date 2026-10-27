/** Textos compartidos por toda la app (castellano, idioma de origen). */
export default {
  appName: "Precio de la luz",
  liveTitle: "{price} €/kWh · {app}",
  dateTitle: "{app} · {date}",

  actions: {
    retry: "Reintentar",
    done: "Hecho",
    share: "Compartir",
    copy: "Copiar resultado",
    copied: "Copiado",
    remove: "Quitar",
  },

  /** Tramos de precio relativos al día: el color nunca va solo. */
  tiers: {
    cheapest: "Barato",
    low: "Moderado",
    medium: "Alto",
    high: "Muy alto",
  },

  /** Tramos horarios de la tarifa 2.0TD. */
  periods: {
    P1: "Punta",
    P2: "Llano",
    P3: "Valle",
    hintP1: "la más cara",
    hintP2: "intermedia",
    hintP3: "la más barata",
  },

  days: {
    today: "Hoy",
    tomorrow: "Mañana",
    yesterday: "Ayer",
    previous: "Día anterior",
    next: "Día siguiente",
    pick: "Elegir día. Ahora: {name}, {date}",
    quick: "Accesos rápidos de día",
    tomorrowNotYet: "Los precios de mañana se publican sobre las 20:15 h",
    saturday: "sábado",
    sunday: "domingo",
  },

  /** "14:00 h". */
  hour: "{hour} h",

  ranges: {
    running: "En curso ahora",
    startsIn: "Empieza en {hours} h",
    past: "Ya ha pasado",
  },

  chart: {
    min: "Mín.",
    max: "Máx.",
    average: "Media {value}",
    now: "Ahora",
    nowSuffix: " · ahora",
    atAverage: "en la media",
    vsAverage: ({ percent, below }) => `${percent} % ${below ? "por debajo" : "por encima"} de la media`,
    series: "Precio ({units})",
    emptyTitle: "Sin datos para el gráfico",
    emptyBody: "No hay precios disponibles para representar en esta fecha.",
  },

  periodStrip: {
    title: "Tramos de la tarifa",
    allDay: "Valle todo el día: {reason}",
    subtitle: "Valle, llano y punta (2.0TD)",
    block: "{period} de {from} a {to}",
  },

  taxes: { IVA: "IVA", IGIC: "IGIC", IPSI: "IPSI" },
  regions: {
    peninsula: "Península",
    baleares: "Illes Balears",
    canarias: "Canarias",
    ceuta: "Ceuta",
    melilla: "Melilla",
  },

  holidays: {
    "01-01": "Año Nuevo",
    "01-06": "Reyes",
    "05-01": "Día del Trabajo",
    "08-15": "La Asunción",
    "10-12": "Fiesta Nacional",
    "11-01": "Todos los Santos",
    "12-06": "Día de la Constitución",
    "12-08": "La Inmaculada",
    "12-25": "Navidad",
    nationalHoliday: "festivo nacional ({name})",
    easter: "Semana Santa",
    august: "la salida de agosto",
    christmas: "las vacaciones de Navidad",
  },

  language: {
    button: "Idioma: {name}",
    menu: "Cambiar idioma",
  },
};
