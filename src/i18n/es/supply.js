/** "Mi suministro": tarifa, región, impuestos y potencia. */
export default {
  button: "Mi suministro",
  withTaxes: "con impuestos",
  withoutTaxes: "sin impuestos",
  title: "Mi suministro",
  yourTariff: "Tu tarifa",
  tariffGroup: "Tu tarifa de luz",
  tariffs: {
    pvpc: { title: "PVPC (tarifa regulada)", body: "El precio cambia cada hora. Es la que enseña esta web.", short: "PVPC" },
    periods: { title: "Mercado libre por tramos", body: "Un precio para punta, otro para llano y otro para valle.", short: "Por tramos" },
    fixed: { title: "Mercado libre con precio fijo", body: "El mismo precio a cualquier hora.", short: "Precio fijo" },
    none: "Sin indicar",
  },
  help: ({ strong }) => [
    strong("¿No lo sabes?"),
    " Mira tu factura: si pone «PVPC» o «precio voluntario para el pequeño consumidor», o la emite una comercializadora de referencia (Energía XXI, Curenergía, Comercializadora Regulada, Régsiti, Baser…), tienes PVPC. Si no, es mercado libre.",
  ],
  region: "Dónde vives",
  regionHelp: "Cambia el impuesto: IVA, IGIC o IPSI.",
  power: "Potencia contratada",
  powerHelp: "Viene en tu factura. Lo habitual: 3,45 o 4,6 kW.",
  taxesSwitch: "Ver precios con impuestos",
  taxesHelp: "Suma el impuesto eléctrico y el {tax}: lo que pagas de verdad por cada kWh.",
  ownPrices:
    "En {region} el PVPC de algunas horas es algo distinto del peninsular y Red Eléctrica no lo publica en abierto: los precios de esta web son los de la Península. Los tramos sí son los tuyos (una hora más tarde).",
};
