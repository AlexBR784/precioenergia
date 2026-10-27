import { useCallback, useEffect, useState } from "react";

/**
 * Sección activa de la app, en la URL (`#/precios`, `#/consejos`…).
 *
 * Antes vivía solo en memoria: al recargar se volvía a Precios, el botón
 * "atrás" salía de la web y no había forma de compartir el enlace de una
 * sección. Con la sección en el hash todo eso funciona, también en GitHub
 * Pages (que no sabe de rutas: el hash nunca llega al servidor).
 *
 * Las direcciones van en castellano y no cambian con el idioma, para que un
 * enlace compartido funcione igual para todos.
 */

export const SECTIONS = ["prices", "tips", "bill", "fuel"];
export const DEFAULT_SECTION = "prices";

const SLUGS = { prices: "precios", tips: "consejos", bill: "factura", fuel: "carburantes" };

export const sectionHref = (section) => `#/${SLUGS[section]}`;

/** Sección del hash actual, o la de por defecto si no se reconoce. */
const sectionFromHash = () => {
  const match = /^#\/([a-z-]+)/.exec(window.location.hash);
  return SECTIONS.find((section) => SLUGS[section] === match?.[1]) ?? DEFAULT_SECTION;
};

export const useSection = () => {
  const [section, setSection] = useState(sectionFromHash);

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /** Ir a una sección desde código (botones como "Ver consejos del día"). */
  const navigate = useCallback((next) => {
    window.location.hash = sectionHref(next).slice(1);
  }, []);

  return { section, navigate };
};

export default useSection;
