/**
 * Escapa texto para meterlo en HTML construido a mano.
 *
 * Los tooltips de ECharts se pintan como HTML: cualquier texto que venga de
 * una API (nombres de fronteras, por ejemplo) tiene que pasar por aquí antes,
 * o un valor como `<img onerror=…>` se ejecutaría en la página.
 */
const ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ENTITIES[char]);

export default escapeHtml;
