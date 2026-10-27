import {
  BUTANE,
  ELECTRICITY_TAX,
  GAS_TUR,
  POWER_TERM,
  REVIEWED_AT,
  SOCIAL_BONUS,
  TAX_WATCH_DATES,
} from "../../data/spain";

/**
 * Recordatorios de mantenimiento: qué cifra de `data/spain.js` toca revisar y
 * cuándo, calculado con las fechas que ya están en esos mismos datos. Al
 * actualizar una cifra (y su fecha) el recordatorio se resuelve solo.
 *
 * Los textos van solo en castellano: esta página es para quien mantiene la
 * web, no para los visitantes.
 */

/** Con esta antelación (días) un recordatorio pasa a "pronto". */
export const SOON_DAYS = 14;

/** Cada cuánto conviene un repaso general aunque no haya fechas a la vista. */
const GENERAL_REVIEW_DAYS = 180;

export const BOE_SEARCH_URL = "https://www.boe.es/buscar/boe.php";

const DAY_MS = 86_400_000;

const parseDay = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const isoDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const addDays = (iso, days) => {
  const date = parseDay(iso);
  date.setDate(date.getDate() + days);
  return isoDay(date);
};

const percent = (rate) => `${(rate * 100).toLocaleString("es-ES", { maximumFractionDigits: 2 })} %`;

/** Las tareas, con la fecha en que toca mirar (`due`, "AAAA-MM-DD" o null). */
const TASKS = () => [
  {
    id: "butane",
    title: "Precio de la bombona de butano",
    current: `${BUTANE.price.toLocaleString("es-ES")} € desde el ${BUTANE.since}`,
    due: BUTANE.nextReview,
    where:
      "BOE: resolución de la Dirección General de Política Energética y Minas con los «precios máximos de venta… del butano comercial». Sale unos días antes del tercer martes de enero, marzo, mayo, julio, septiembre y noviembre.",
    search: "butano comercial",
    fields: "BUTANE: price, previousPrice, since, nextReview (la siguiente revisión, dos meses después)",
  },
  {
    id: "tur",
    title: "Tarifa de último recurso del gas (TUR)",
    current: `TUR 1: ${GAS_TUR.tiers[0].variableKwh.toLocaleString("es-ES")} €/kWh desde el ${GAS_TUR.since}`,
    due: GAS_TUR.nextReview,
    where:
      "BOE: resolución sobre la tarifa de último recurso de gas natural, a finales de diciembre, marzo, junio y septiembre.",
    search: "tarifa de último recurso de gas natural",
    fields: "GAS_TUR: tiers (fixedMonth, variableKwh, previousVariableKwh), since, nextReview",
  },
  {
    id: "power",
    title: "Peajes y cargos del término de potencia",
    current: `P1 ${POWER_TERM.p1} · P2 ${POWER_TERM.p2} €/kW y año (hasta el ${POWER_TERM.validUntil})`,
    due: addDays(POWER_TERM.validUntil, 1),
    where:
      "Peajes: resolución de la CNMC (diciembre). Cargos: orden del Ministerio para la Transición Ecológica (diciembre o enero). Busca los del segmento 2.0TD.",
    search: "peajes de transporte y distribución de electricidad",
    fields: "POWER_TERM: p1, p2, pvpcMargin, validUntil",
  },
  {
    id: "bonus",
    title: "Descuentos y límites del bono social",
    current: `${percent(SOCIAL_BONUS.discount.vulnerable)} y ${percent(SOCIAL_BONUS.discount.severe)} hasta el ${SOCIAL_BONUS.validUntil}`,
    due: addDays(SOCIAL_BONUS.validUntil, 1),
    where:
      "Real decreto-ley que prorrogue o cambie los descuentos (suele salir a finales de diciembre). También en bonosocial.gob.es.",
    search: "bono social",
    fields: "SOCIAL_BONUS: discount, validUntil, annualLimitKwh",
  },
  {
    id: "iprem",
    title: "IPREM",
    current: `${SOCIAL_BONUS.iprem.toLocaleString("es-ES")} € (${SOCIAL_BONUS.ipremYear})`,
    due: `${SOCIAL_BONUS.ipremYear + 1}-01-01`,
    where: "Ley de Presupuestos Generales del Estado o, si se prorrogan, el decreto que lo actualice.",
    search: "indicador público de renta de efectos múltiples",
    fields: "SOCIAL_BONUS: iprem, ipremYear",
  },
  {
    id: "taxes",
    title: "IVA e impuesto eléctrico de la luz",
    current: `IVA 21 % · impuesto eléctrico ${percent(ELECTRICITY_TAX)}`,
    // La primera fecha de vigilancia posterior al último repaso general.
    due: TAX_WATCH_DATES.find((date) => date > REVIEWED_AT) ?? null,
    where:
      "Real decreto-ley (Jefatura del Estado). La cláusula de 2026 puede rebajar el IVA al 10 % y el impuesto al 0,5 % en noviembre o diciembre si el IPC de la electricidad sube más de un 15 %.",
    search: "Impuesto sobre el Valor Añadido energía eléctrica",
    fields: "REGIONS (tax rate), ELECTRICITY_TAX, TAX_WATCH_DATES",
  },
  {
    id: "general",
    title: "Repaso general de las cifras",
    current: `Última revisión: ${REVIEWED_AT}`,
    due: addDays(REVIEWED_AT, GENERAL_REVIEW_DAYS),
    where: "Mira que el resto sigue igual (IGIC, IPSI, alquiler del contador, margen del PVPC) y actualiza la fecha.",
    search: null,
    fields: "REVIEWED_AT",
  },
];

/**
 * Tareas con su estado: "overdue" (la fecha ya pasó), "soon" (faltan
 * `SOON_DAYS` días o menos), "ok" o "done" (marcada como mirada para esa fecha
 * concreta, en `acknowledged`: { id: "AAAA-MM-DD" }).
 */
export const maintenanceTasks = (today = new Date(), acknowledged = {}) => {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  return TASKS().map((task) => {
    if (!task.due) return { ...task, status: "ok", days: null };
    const days = Math.round((parseDay(task.due) - start) / DAY_MS);
    let status = "ok";
    if (acknowledged[task.id] === task.due) status = "done";
    else if (days < 0) status = "overdue";
    else if (days <= SOON_DAYS) status = "soon";
    return { ...task, status, days };
  });
};

/** Cuántas tareas piden atención (vencidas o próximas, sin marcar). */
export const pendingCount = (tasks) => tasks.filter((task) => task.status === "overdue" || task.status === "soon").length;
