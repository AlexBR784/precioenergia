import dayjs from "dayjs";
import "dayjs/locale/es";
import "dayjs/locale/ca";
import "dayjs/locale/gl";
import "dayjs/locale/eu";
import "dayjs/locale/en-gb";

import es from "./es";

/**
 * Idiomas de la app: castellano (por defecto y de respaldo), catalán, gallego,
 * euskera e inglés.
 *
 * Sin librería: `t("clave.de.texto", { parámetros })` busca en el diccionario
 * del idioma activo y, si falta la clave, en el de castellano. Un texto puede
 * ser una cadena con `{parámetros}` o una función que recibe los parámetros
 * (para plurales y frases cuyo orden cambia de un idioma a otro, como en
 * euskera).
 *
 * El castellano va en el paquete principal; los otros idiomas se cargan aparte
 * solo si se eligen, así que no pesan a quien no los usa. Al cambiar de idioma
 * la app se vuelve a montar entera (ver `LanguageProvider`), de modo que
 * `t()` puede ser una función normal, también en la lógica pura.
 */

export const LANGUAGES = {
  es: { label: "Castellano", tag: "es-ES", dayjs: "es" },
  ca: { label: "Català", tag: "ca-ES", dayjs: "ca" },
  gl: { label: "Galego", tag: "gl-ES", dayjs: "gl" },
  eu: { label: "Euskara", tag: "eu-ES", dayjs: "eu" },
  en: { label: "English", tag: "en-GB", dayjs: "en-gb" },
};

export const DEFAULT_LANGUAGE = "es";
export const LANGUAGE_KEY = "precioenergia:language";

const loaders = {
  ca: () => import("./ca"),
  gl: () => import("./gl"),
  eu: () => import("./eu"),
  en: () => import("./en"),
};

let current = DEFAULT_LANGUAGE;
let dictionary = es;

export const getLanguage = () => current;

/** Etiqueta BCP 47 para `Intl` ("ca-ES"…). */
export const localeTag = () => LANGUAGES[current].tag;

const lookup = (source, key) =>
  key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), source);

/**
 * Texto traducido. Si la clave no existe en ningún idioma devuelve la clave,
 * para que el hueco se vea al probar en vez de quedar en blanco.
 */
export const t = (key, params = {}) => {
  const value = lookup(dictionary, key) ?? lookup(es, key);
  if (value == null) return key;
  if (typeof value === "function") return value(params);
  if (typeof value === "string") {
    return value.replace(/\{(\w+)\}/g, (match, name) => (params[name] != null ? String(params[name]) : match));
  }
  return value;
};

/** Idioma guardado o, si no, el primero del navegador que tengamos. */
export const detectLanguage = () => {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    if (LANGUAGES[stored]) return stored;
  } catch {
    // Sin localStorage: se mira el navegador.
  }
  const preferred = (navigator.languages ?? [navigator.language]).filter(Boolean);
  for (const tag of preferred) {
    const code = tag.toLowerCase().split("-")[0];
    if (LANGUAGES[code]) return code;
  }
  return DEFAULT_LANGUAGE;
};

/** Carga el diccionario y deja listos dayjs y `<html lang>`. */
export const loadLanguage = async (language) => {
  const code = LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
  dictionary = code === DEFAULT_LANGUAGE ? es : (await loaders[code]()).default;
  current = code;
  dayjs.locale(LANGUAGES[code].dayjs);
  document.documentElement.lang = code;
  return code;
};

export const saveLanguage = (language) => {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Recordarlo es opcional.
  }
};
