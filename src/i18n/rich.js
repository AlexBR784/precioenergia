import { Fragment, createElement } from "react";

/**
 * Frases con partes resaltadas: el diccionario devuelve una lista de trozos
 * (texto y elementos que le pasa el componente, como `cheap("…")`) y esto la
 * convierte en hijos de React con su `key`. Así cada idioma pone el resaltado
 * donde le toca en su orden de palabras.
 */
export const rich = (parts) =>
  Array.isArray(parts) ? parts.map((part, index) => createElement(Fragment, { key: index }, part)) : parts;

export default rich;
