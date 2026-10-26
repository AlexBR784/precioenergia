import { useEffect, useState } from "react";

/**
 * Reloj compartido de la app, que avanza cada minuto en punto.
 *
 * Antes cada pieza leía `new Date()` al pintarse y se quedaba con esa hora: con
 * la pestaña abierta de 16:55 a 18:10, la tarjeta "Ahora", la marca de la
 * gráfica y la hora destacada seguían en las 16:00, y pasada la medianoche
 * "Hoy" seguía siendo ayer. Consejos tenía su propio intervalo; Precios no.
 *
 * Un único temporizador para toda la app (se crea con el primer componente que
 * lo usa y se para con el último) y un tic extra al volver a la pestaña del
 * navegador, porque en segundo plano los temporizadores se ralentizan.
 */

const listeners = new Set();
let timeout = null;
let interval = null;

const tick = () => {
  const now = new Date();
  listeners.forEach((listener) => listener(now));
};

const onVisible = () => {
  if (document.visibilityState === "visible") tick();
};

const start = () => {
  // Primer tic en el siguiente minuto exacto; después, cada 60 s.
  timeout = setTimeout(() => {
    tick();
    interval = setInterval(tick, 60_000);
  }, 60_000 - (Date.now() % 60_000));
  document.addEventListener("visibilitychange", onVisible);
};

const stop = () => {
  clearTimeout(timeout);
  clearInterval(interval);
  timeout = null;
  interval = null;
  document.removeEventListener("visibilitychange", onVisible);
};

export const useNow = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    listeners.add(setNow);
    if (listeners.size === 1) start();
    return () => {
      listeners.delete(setNow);
      if (listeners.size === 0) stop();
    };
  }, []);

  return now;
};

export default useNow;
