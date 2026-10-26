import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Política de seguridad de contenido (CSP).
 *
 * GitHub Pages no deja configurar cabeceras HTTP, así que va como <meta> en el
 * HTML. Solo se añade al compilar: el servidor de desarrollo de Vite inyecta
 * scripts en línea (recarga en caliente) que esta política bloquearía.
 *
 * - script-src 'self': ningún script en línea ni de otro dominio. Por eso el
 *   título con la fecha se pone desde main.jsx y no desde un <script> en el HTML.
 * - style-src 'unsafe-inline': MUI (Emotion) inserta sus estilos en <style>.
 * - connect-src: solo las dos APIs que usa la app (luz de REE y carburantes
 *   del Ministerio). Si algún día se colara un script, no podría
 *   mandar datos a ningún otro sitio.
 * - img-src data: y blob:: iconos embebidos y la descarga del CSV.
 * frame-ancestors no funciona en <meta>; el clickjacking no se puede cerrar
 * desde GitHub Pages, aunque aquí no hay acciones sensibles.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://apidatos.ree.es https://sedeaplicaciones.minetur.gob.es",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const contentSecurityPolicy = () => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
      injectTo: 'head-prepend',
    },
    {
      tag: 'meta',
      attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      injectTo: 'head-prepend',
    },
  ],
})

// https://vitejs.dev/config/
export default defineConfig({
  base: '/precioenergia/',
  plugins: [react(), contentSecurityPolicy()],
});
