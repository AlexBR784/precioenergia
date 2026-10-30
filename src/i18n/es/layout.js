/** Cabecera, pestañas, pie y menús generales. */
export default {
  skipLink: "Saltar al contenido",
  sections: "Secciones de la aplicación",
  tabs: {
    prices: "Precios",
    tips: "Consejos",
    bill: "Factura",
    fuel: "Carburantes",
  },
  theme: {
    light: "Claro",
    dark: "Oscuro",
    system: "Según el sistema",
    tooltip: "Tema: {name}",
    button: "Cambiar tema. Actual: {name}",
  },
  install: {
    tooltip: "Instalar la app",
    button: "Instalar la app en este dispositivo",
  },
  /** Aviso cuando no hay red: se ven los datos guardados. */
  offline: {
    title: "Sin conexión",
    body: "Puede que veas los últimos datos guardados, no los de ahora.",
  },
  /** Si una sección se rompe al pintarse. */
  crash: {
    title: "Algo ha fallado en esta sección",
    body: "Recarga la página para volver a intentarlo. Si sigue pasando, prueba otra sección.",
    reload: "Recargar",
  },
  footer: {
    data: "Datos:",
    ree: "Red Eléctrica de España — apidatos.ree.es",
    fuel: "Geoportal Gasolineras (MITECO)",
    withTaxes: "Luz: precio PVPC con impuesto eléctrico y {tax} ({rate}). No incluye el término de potencia ni el alquiler del contador.",
    withoutTaxes: "Luz: precio PVPC (tarifa regulada). No incluye IVA, impuesto eléctrico ni el término fijo de potencia.",
  },
};
