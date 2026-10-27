/*
 * Service worker de Precio de la luz: la app se puede instalar y abrir sin
 * conexión con los últimos datos que se vieron.
 *
 * - Páginas: primero la red; sin conexión, la última copia.
 * - Archivos de la app (JS, CSS, fuentes, imágenes): de la caché y se
 *   actualizan por detrás. Sus nombres llevan un hash, así que una versión
 *   nueva no pisa a la vieja.
 * - APIs (REE y Ministerio): primero la red; sin conexión, la última respuesta.
 *
 * Al cambiar VERSION se borran las cachés anteriores.
 */
const VERSION = "v1";
const APP_CACHE = `app-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;
const API_HOSTS = ["apidatos.ree.es", "sedeaplicaciones.minetur.gob.es"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.add(self.registration.scope)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.endsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/** Las respuestas de las APIs cambian de URL cada día: se guardan las últimas. */
const MAX_DATA_ENTRIES = 40;

const trim = async (cache) => {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_DATA_ENTRIES)).map((key) => cache.delete(key)));
};

const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      if (cacheName === DATA_CACHE) trim(cache);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
};

const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(APP_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
};

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, APP_CACHE).catch(() => caches.match(self.registration.scope))
    );
    return;
  }
  if (API_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
