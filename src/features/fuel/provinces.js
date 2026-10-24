/**
 * Provincias del Geoportal de gasolineras (ids tal y como los devuelve
 * `Listados/Provincias`) con uno o varios puntos de referencia.
 *
 * Sirven para el botón "Cerca de mí": bajar los 12 MB de toda España no es una
 * opción en un móvil, así que se elige la provincia más próxima y se pide solo
 * esa. Es una aproximación: un punto por provincia, y varios en los
 * archipiélagos (si no, un usuario en Lanzarote caería en Tenerife).
 */
export const PROVINCES = [
  { id: "01", name: "Araba/Álava", points: [[42.85, -2.67]] },
  { id: "02", name: "Albacete", points: [[38.95, -1.85]] },
  { id: "03", name: "Alicante", points: [[38.45, -0.6]] },
  { id: "04", name: "Almería", points: [[37.0, -2.35]] },
  { id: "05", name: "Ávila", points: [[40.65, -4.9]] },
  { id: "06", name: "Badajoz", points: [[38.85, -6.15]] },
  {
    id: "07",
    name: "Illes Balears",
    points: [
      [39.6, 2.95],
      [39.95, 4.1],
      [38.95, 1.45],
    ],
  },
  { id: "08", name: "Barcelona", points: [[41.65, 1.85]] },
  { id: "09", name: "Burgos", points: [[42.35, -3.7]] },
  { id: "10", name: "Cáceres", points: [[39.55, -6.15]] },
  { id: "11", name: "Cádiz", points: [[36.55, -5.85]] },
  { id: "12", name: "Castellón", points: [[40.25, -0.1]] },
  { id: "13", name: "Ciudad Real", points: [[38.95, -3.95]] },
  { id: "14", name: "Córdoba", points: [[37.9, -4.75]] },
  { id: "15", name: "A Coruña", points: [[43.0, -8.35]] },
  { id: "16", name: "Cuenca", points: [[40.1, -2.15]] },
  { id: "17", name: "Girona", points: [[42.1, 2.85]] },
  { id: "18", name: "Granada", points: [[37.2, -3.3]] },
  { id: "19", name: "Guadalajara", points: [[40.8, -2.6]] },
  { id: "20", name: "Gipuzkoa", points: [[43.15, -2.15]] },
  { id: "21", name: "Huelva", points: [[37.55, -6.85]] },
  { id: "22", name: "Huesca", points: [[42.15, -0.15]] },
  { id: "23", name: "Jaén", points: [[37.8, -3.45]] },
  { id: "24", name: "León", points: [[42.65, -5.8]] },
  { id: "25", name: "Lleida", points: [[41.8, 1.0]] },
  { id: "26", name: "La Rioja", points: [[42.3, -2.5]] },
  { id: "27", name: "Lugo", points: [[43.0, -7.45]] },
  { id: "28", name: "Madrid", points: [[40.5, -3.65]] },
  { id: "29", name: "Málaga", points: [[36.85, -4.6]] },
  { id: "30", name: "Murcia", points: [[38.0, -1.45]] },
  { id: "31", name: "Navarra", points: [[42.7, -1.65]] },
  { id: "32", name: "Ourense", points: [[42.25, -7.65]] },
  { id: "33", name: "Asturias", points: [[43.35, -5.95]] },
  { id: "34", name: "Palencia", points: [[42.35, -4.55]] },
  {
    id: "35",
    name: "Las Palmas",
    points: [
      [28.1, -15.5],
      [29.0, -13.6],
      [28.4, -14.0],
    ],
  },
  { id: "36", name: "Pontevedra", points: [[42.45, -8.6]] },
  { id: "37", name: "Salamanca", points: [[40.9, -5.85]] },
  {
    id: "38",
    name: "Santa Cruz de Tenerife",
    points: [
      [28.3, -16.55],
      [28.65, -17.85],
      [28.1, -17.15],
      [27.75, -18.0],
    ],
  },
  { id: "39", name: "Cantabria", points: [[43.2, -4.0]] },
  { id: "40", name: "Segovia", points: [[41.15, -4.1]] },
  { id: "41", name: "Sevilla", points: [[37.4, -5.6]] },
  { id: "42", name: "Soria", points: [[41.65, -2.5]] },
  { id: "43", name: "Tarragona", points: [[41.1, 1.0]] },
  { id: "44", name: "Teruel", points: [[40.5, -1.0]] },
  { id: "45", name: "Toledo", points: [[39.8, -4.05]] },
  { id: "46", name: "Valencia", points: [[39.4, -0.9]] },
  { id: "47", name: "Valladolid", points: [[41.6, -4.75]] },
  { id: "48", name: "Bizkaia", points: [[43.25, -2.9]] },
  { id: "49", name: "Zamora", points: [[41.6, -6.1]] },
  { id: "50", name: "Zaragoza", points: [[41.65, -1.0]] },
  { id: "51", name: "Ceuta", points: [[35.89, -5.32]] },
  { id: "52", name: "Melilla", points: [[35.29, -2.94]] },
];

/** Ordenadas alfabéticamente para el selector (con la locale, sin tildes al final). */
export const PROVINCES_SORTED = [...PROVINCES].sort((a, b) =>
  a.name.localeCompare(b.name, "es")
);

export const provinceName = (id) =>
  PROVINCES.find((province) => province.id === id)?.name ?? "";
