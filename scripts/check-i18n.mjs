/**
 * Comprueba que cada idioma tiene las mismas claves que el castellano y del
 * mismo tipo (texto o función), y que los `{parámetros}` de cada texto son los
 * mismos. Uso: `node scripts/check-i18n.mjs`. Sale con código 1 si hay fallos.
 */
import es from "../src/i18n/es/index.js";
import ca from "../src/i18n/ca/index.js";
import gl from "../src/i18n/gl/index.js";
import eu from "../src/i18n/eu/index.js";
import en from "../src/i18n/en/index.js";

const languages = { ca, gl, eu, en };

const flatten = (node, prefix = "", out = {}) => {
  Object.entries(node).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flatten(value, path, out);
    else out[path] = value;
  });
  return out;
};

const params = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",");

const source = flatten(es);
let problems = 0;

for (const [code, dictionary] of Object.entries(languages)) {
  const target = flatten(dictionary);
  const report = (message) => {
    problems += 1;
    console.log(`[${code}] ${message}`);
  };
  for (const [key, value] of Object.entries(source)) {
    if (!(key in target)) {
      report(`falta ${key}`);
      continue;
    }
    if (typeof value !== typeof target[key]) report(`tipo distinto en ${key}`);
    else if (typeof value === "string" && params(value) !== params(target[key])) {
      report(`parámetros distintos en ${key}: {${params(value)}} vs {${params(target[key])}}`);
    }
  }
  Object.keys(target)
    .filter((key) => !(key in source))
    .forEach((key) => report(`sobra ${key}`));
}

console.log(problems ? `\n${problems} problemas` : "Todas las claves coinciden.");
process.exit(problems ? 1 : 0);
