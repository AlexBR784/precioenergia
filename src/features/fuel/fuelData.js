import { PROVINCES } from "./provinces";

/**
 * Lógica pura de la pestaña de carburantes: catálogo de combustibles,
 * normalización de lo que devuelve el Ministerio y cálculos sobre las
 * gasolineras. Sin React ni red, para poder razonar sobre ella (y testearla)
 * aparte, igual que `dayInsights.js` y `cheapRanges.js`.
 */

/**
 * Combustibles que se ofrecen. `field` es el nombre exacto del campo en la
 * respuesta del Ministerio y `productId` su id en `Listados/ProductosPetroliferos`
 * (lo usa el histórico filtrado por producto). Quedan fuera los que se venden por kilo (gas
 * natural, hidrógeno) o casi no existen (E10, E85): el cálculo de "llenar el
 * depósito" y el ranking tienen sentido en €/L y con suficientes estaciones.
 */
export const FUELS = {
  g95: { label: "Gasolina 95", field: "Precio Gasolina 95 E5", productId: 1, main: true },
  diesel: { label: "Gasóleo A", field: "Precio Gasoleo A", productId: 4, main: true },
  glp: { label: "GLP", field: "Precio Gases licuados del petróleo", productId: 17, main: true },
  g98: { label: "Gasolina 98", field: "Precio Gasolina 98 E5", productId: 3 },
  g95Premium: { label: "Gasolina 95 Premium", field: "Precio Gasolina 95 E5 Premium", productId: 20 },
  dieselPremium: { label: "Gasóleo Premium", field: "Precio Gasoleo Premium", productId: 5 },
};

export const MAIN_FUELS = Object.keys(FUELS).filter((key) => FUELS[key].main);
export const OTHER_FUELS = Object.keys(FUELS).filter((key) => !FUELS[key].main);
export const DEFAULT_FUEL = "g95";

/** "1,829" -> 1.829; cadena vacía o basura -> null. */
export const parseNumber = (raw) => {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = parseFloat(raw.replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

const SMALL_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "a", "en", "al"]);

/**
 * La API devuelve todo en mayúsculas ("AVENIDA CASTILLA LA MANCHA, 26"). Se
 * pasa a mayúscula inicial, pero se respetan siglas ("CR", "BP") y vías con
 * número ("CM-332", "AP-7").
 */
export const titleCase = (text) =>
  String(text ?? "")
    .trim()
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s*$/.test(token)) return token;
      if (/\d/.test(token)) return token.toUpperCase();
      const letters = token.replace(/[^\p{L}]/gu, "");
      const lower = token.toLowerCase();
      if (SMALL_WORDS.has(lower)) return lower;
      if (letters.length <= 2) return token.toUpperCase();
      return lower.replace(/(^|[(\-/])(\p{L})/gu, (_, sep, char) => sep + char.toUpperCase());
    })
    .join("")
    // La primera palabra siempre empieza en mayúscula, aunque sea "de" o "la".
    .replace(/^\p{L}/u, (char) => char.toUpperCase());

/** Rótulo "Nº 10.935" = sin marca reconocible. */
const brandOf = (raw) => {
  const text = String(raw ?? "").trim();
  if (!text || /^n[º°o]\.?\s*\d/i.test(text)) return "Independiente";
  return titleCase(text);
};

/**
 * Convierte una gasolinera cruda del Ministerio en lo mínimo que usa la app.
 * Se guarda así (y no el objeto original de ~40 campos) porque una provincia
 * grande son ~1 MB de JSON y se mantiene en caché.
 */
export const normalizeStation = (raw) => {
  const prices = {};
  Object.entries(FUELS).forEach(([key, fuel]) => {
    prices[key] = parseNumber(raw[fuel.field]);
  });

  return {
    id: String(raw.IDEESS),
    brand: brandOf(raw["Rótulo"]),
    address: titleCase(raw["Dirección"]),
    postalCode: raw["C.P."] ?? "",
    locality: titleCase(raw.Localidad),
    municipality: titleCase(raw.Municipio),
    municipalityId: String(raw.IDMunicipio),
    provinceId: String(raw.IDProvincia),
    lat: parseNumber(raw.Latitud),
    lon: parseNumber(raw["Longitud (WGS84)"]),
    schedule: String(raw.Horario ?? "").trim(),
    // "R" = venta restringida (socios, flotas): no sirve a un particular.
    restricted: raw["Tipo Venta"] === "R",
    prices,
  };
};

/** "24/10/2026 15:01:58" (hora de Madrid) -> Date, o null. */
export const parseUpdatedAt = (raw) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/.exec(raw ?? "");
  if (!match) return null;
  const [, day, month, year, hour, minute] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

/** Distancia en km entre dos coordenadas (fórmula de Haversine). */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

/**
 * Las `count` provincias más cercanas a un punto. Se piden dos porque cerca de
 * un límite provincial la gasolinera más próxima puede estar en la vecina, y
 * con un solo punto por provincia la "más cercana" no siempre es la correcta.
 */
export const nearestProvinceIds = (lat, lon, count = 2) =>
  PROVINCES.map((province) => ({
    id: province.id,
    distance: Math.min(
      ...province.points.map(([pLat, pLon]) => haversineKm(lat, lon, pLat, pLon))
    ),
  }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(({ id }) => id);

// ---------------------------------------------------------------------------
// Horarios
// ---------------------------------------------------------------------------

const DAY_INDEX = { L: 0, M: 1, X: 2, J: 3, V: 4, S: 5, D: 6 };

/** "L-V" -> [0..4]; "S-D" -> [5,6]; "D" -> [6]; con comas o "y" -> unión. */
const parseDays = (spec) => {
  const days = new Set();
  for (const part of spec.split(/[,y]/i)) {
    const range = /^\s*([LMXJVSD])\s*-\s*([LMXJVSD])\s*$/i.exec(part);
    const single = /^\s*([LMXJVSD])\s*$/i.exec(part);
    if (range) {
      let day = DAY_INDEX[range[1].toUpperCase()];
      const end = DAY_INDEX[range[2].toUpperCase()];
      // Un rango "S-L" daría la vuelta a la semana.
      for (let guard = 0; guard < 7; guard += 1) {
        days.add(day);
        if (day === end) break;
        day = (day + 1) % 7;
      }
    } else if (single) {
      days.add(DAY_INDEX[single[1].toUpperCase()]);
    } else if (part.trim()) {
      return null;
    }
  }
  return days.size ? days : null;
};

/** "07:00-14:00 y 16:00-20:00" o "24H" -> [[420, 840], [960, 1200]] (minutos). */
const parseTimes = (spec) => {
  if (/24\s*H/i.test(spec)) return [[0, 1440]];
  const ranges = [];
  const pattern = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g;
  let match = pattern.exec(spec);
  while (match) {
    const open = Number(match[1]) * 60 + Number(match[2]);
    let close = Number(match[3]) * 60 + Number(match[4]);
    // "06:00-00:00" cierra a medianoche; "22:00-06:00" cruza al día siguiente.
    if (close <= open) close += 1440;
    ranges.push([open, close]);
    match = pattern.exec(spec);
  }
  return ranges.length ? ranges : null;
};

/**
 * Convierte el texto libre del Ministerio ("L-V: 06:00-22:00; S-D: 07:00-22:00")
 * en tramos por día de la semana. Devuelve null si no se entiende nada, para
 * no afirmar "cerrada" cuando solo es un formato que no conocemos.
 */
export const parseSchedule = (text) => {
  const week = Array.from({ length: 7 }, () => []);
  let understood = false;

  for (const segment of String(text ?? "").split(";")) {
    const colon = segment.indexOf(":");
    if (colon === -1) continue;
    const days = parseDays(segment.slice(0, colon));
    const times = parseTimes(segment.slice(colon + 1));
    if (!days || !times) continue;
    understood = true;
    days.forEach((day) => week[day].push(...times));
  }

  return understood ? week : null;
};

/** true / false según el horario, o null si no se puede saber. */
export const isOpenNow = (text, now = new Date()) => {
  const week = parseSchedule(text);
  if (!week) return null;

  const today = (now.getDay() + 6) % 7;
  const yesterday = (today + 6) % 7;
  const minutes = now.getHours() * 60 + now.getMinutes();

  const openToday = week[today].some(([open, close]) => minutes >= open && minutes < close);
  // El tramo de ayer que cruzó la medianoche sigue abierto esta madrugada.
  const spillFromYesterday = week[yesterday].some(
    ([, close]) => close > 1440 && minutes < close - 1440
  );

  return openToday || spillFromYesterday;
};

// ---------------------------------------------------------------------------
// Filtrado y estadísticas
// ---------------------------------------------------------------------------

/**
 * Gasolineras que pueden aparecer en el ranking: venta al público y con precio
 * del combustible elegido. Añade `price` y, si hay origen, `distanceKm`.
 */
export const priceStations = (stations, fuel, origin = null) =>
  stations
    .filter((station) => !station.restricted && station.prices[fuel] != null)
    .map((station) => ({
      ...station,
      price: station.prices[fuel],
      distanceKm:
        origin && station.lat != null && station.lon != null
          ? haversineKm(origin.lat, origin.lon, station.lat, station.lon)
          : null,
    }));

const percentile = (sorted, fraction) => {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * fraction;
  const low = Math.floor(index);
  const high = Math.ceil(index);
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
};

/**
 * Resumen de precios de un conjunto de gasolineras ya filtrado y con `price`.
 *
 * `low`/`high` son los percentiles 5 y 95, no el mínimo y el máximo: hay
 * estaciones con precios disparatados (un error de tecleo, una gasolinera en
 * una isla remota) que, usadas como extremos, dejarían casi todo en el mismo
 * tramo de color. Se usan solo para clasificar en `getPriceTier`.
 */
export const computeStats = (priced) => {
  if (!priced.length) return null;

  const sorted = priced.map((station) => station.price).sort((a, b) => a - b);
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const cheapest = priced.reduce((best, s) => (s.price < best.price ? s : best));
  const priciest = priced.reduce((worst, s) => (s.price > worst.price ? s : worst));

  return {
    count: sorted.length,
    cheapest,
    priciest,
    average: sum / sorted.length,
    median: percentile(sorted, 0.5),
    low: percentile(sorted, 0.05),
    high: percentile(sorted, 0.95),
  };
};

/** Coste de repostar `liters` litros a `price` €/L. */
export const fillCost = (price, liters) =>
  Number.isFinite(price) && Number.isFinite(liters) ? price * liters : null;

export const SORTS = {
  PRICE: "price",
  DISTANCE: "distance",
};

/** Ordena por precio (desempate: más cerca) o por distancia (desempate: más barata). */
export const sortStations = (priced, sort) =>
  [...priced].sort((a, b) => {
    const byPrice = a.price - b.price;
    const byDistance = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    if (sort === SORTS.DISTANCE) return byDistance || byPrice;
    return byPrice || byDistance;
  });

// ---------------------------------------------------------------------------
// Tendencia
// ---------------------------------------------------------------------------

/**
 * Por debajo de medio céntimo por litro en una semana el precio se considera
 * estable: en un depósito de 50 L son 25 céntimos, nada por lo que esperar.
 */
const TREND_THRESHOLD = 0.005;

/**
 * Resume la evolución del precio medio (`[{ date, average }]`, el último es
 * hoy) en una dirección para la última semana y el cambio en todo el periodo.
 * La dirección se mira en la última semana y no en las dos: lo que pasó hace
 * 14 días dice poco de lo que pasará mañana.
 */
export const summarizeTrend = (points) => {
  if (!points || points.length < 3) return null;

  const sorted = [...points].sort((a, b) => a.date - b.date);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const weekAgo = new Date(last.date);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekRef = [...sorted].reverse().find((point) => point.date <= weekAgo) ?? first;

  const weekChange = last.average - weekRef.average;
  let direction = "flat";
  if (weekChange <= -TREND_THRESHOLD) direction = "down";
  else if (weekChange >= TREND_THRESHOLD) direction = "up";

  const averages = sorted.map((point) => point.average);
  return {
    points: sorted,
    direction,
    weekChange,
    change: last.average - first.average,
    changePct: ((last.average - first.average) / first.average) * 100,
    first,
    last,
    min: Math.min(...averages),
    max: Math.max(...averages),
  };
};
