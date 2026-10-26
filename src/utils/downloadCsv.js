/**
 * Genera y descarga un CSV que Excel en español abre bien a la primera.
 *
 * Sustituye a la librería `xlsx` (SheetJS): la versión de npm está abandonada,
 * arrastra dos avisos de seguridad sin arreglo y pesaba cientos de KB en la
 * carga inicial solo para un botón. Un CSV no necesita librería.
 *
 * - Separador ";" y coma decimal: es lo que espera Excel con configuración
 *   regional española (con "," lo metería todo en una columna).
 * - BOM UTF-8 al principio, para que Excel no rompa las tildes y el "€".
 * - Campos entre comillas cuando hace falta, y protección frente a fórmulas:
 *   un texto que empiece por "=", "+", "-" o "@" se abriría como fórmula.
 */

const SEPARATOR = ";";

const formulaStart = /^[=+\-@\t\r]/;

const cell = (value) => {
  if (typeof value === "number") return String(value).replace(".", ",");
  let text = String(value ?? "");
  if (formulaStart.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** `rows`: array de arrays; la primera fila es la cabecera. */
export const downloadCsv = (filename, rows) => {
  const content = rows.map((row) => row.map(cell).join(SEPARATOR)).join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Se libera después: algunos navegadores leen el blob de forma asíncrona.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default downloadCsv;
