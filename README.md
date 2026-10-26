# Precio de la luz

SPA en React para un particular que quiere saber cuánto le cuesta la luz que consume y cuándo le
sale más barata, y dónde repostar más barato. Usa la API pública de
[Red Eléctrica de España](https://www.ree.es/es/apidatos) y el servicio de precios de carburantes
del Ministerio para la Transición Ecológica, ambos sin necesidad de clave.

🔗 **Demo**: https://alexbr784.github.io/precioenergia/

## Funcionalidad

**Precios**
- Selector de día («‹ Hoy ›» con accesos a Hoy y Mañana) y unidad (€/kWh por defecto, recordada).
- Cabecera con el precio de ahora, su tramo y su diferencia con la media, más mínimo, máximo y media.
- Gráfica de línea escalonada con degradado térmico (de barato a caro), media, hora actual y extremos.
- Precio hora a hora en tres franjas del día, con la comparación frente a la media (porcentaje,
  barra o flecha, a elegir) y el coste de cada hora a tu potencia; ordenable por hora o de más
  barata a más cara, y exportable a CSV.
- Todo lo que depende de la hora actual avanza solo (reloj compartido `useNow`), también al cruzar
  la medianoche.

**Consejos**
- «Qué hacer hoy»: abre con el veredicto del día (caro, normal o barato frente a los 7 días
  anteriores, con una carita animada) y sigue con lo que conviene ahora mismo, las franjas a evitar
  o casi gratis y el contexto del día, generado por reglas (`dayInsights.js`).
- «¿Cuándo lo enciendo?»: eliges un aparato (lavadora, lavavajillas, coche eléctrico…) o ajustas
  horas y potencia, y te da el mejor momento del día con su coste en euros, el ahorro frente al
  peor tramo y otras opciones, situados en una pista de 24 h. La potencia se guarda (`usePowerKw`)
  y el desglose hora a hora de Precios la usa para el coste de cada hora.

**Carburantes**
- Precio de Gasolina 95, Gasóleo A y GLP (y Gasolina 98, 95 Premium y Gasóleo Premium) en las
  gasolineras de tu zona: por provincia/municipio, o «Cerca de mí» con radio configurable.
- Cabecera con la gasolinera más barata, lo que cuesta llenar el depósito (litros editables y
  guardados) frente a la media, y la distribución de precios de la zona.
- Ranking con la diferencia frente a la más barata, distancia, horario («abierta ahora», mejor
  esfuerzo según el texto del Ministerio) y enlace «Cómo llegar». Filtros por marca y «solo
  abiertas ahora».
- La ubicación solo se usa en el navegador: no se envía ni se guarda.

Las tres pestañas soportan modo claro / oscuro / según el sistema (persistido en `localStorage`).

Hubo una cuarta pestaña, «Intercambios» (mapa de importaciones y exportaciones de electricidad con
los países frontera), que se quitó: era un dato macro que no ayudaba a un particular a gastar menos.

## Stack técnico

- **React 18** + **Vite** — sin router ni gestor de estado global, tres pestañas con estado en `App.jsx`.
- **MUI v5** como sistema de componentes, con un tema propio (`src/theme/`) que centraliza paleta,
  tipografía y overrides; sin librerías de estilos adicionales.
- **ECharts 6** (`echarts-for-react`) para la gráfica de precios, importado por piezas
  (`src/theme/echarts.js`).
- **IBM Plex Sans** (variable), autoalojada — ver `src/theme/fonts.css`.
- **dayjs**, **axios** y `@mui/x-date-pickers`. La exportación a CSV no usa librerías.
- Política de seguridad de contenido (CSP) añadida en el build (`vite.config.js`).

## Estructura

```
src/
  theme/            tokens de color/tipografía, tema MUI, modo claro/oscuro, ECharts por piezas
  layout/           cabecera, pie, contenedor de página, selector de tema
  features/
    prices/         pestaña de precios: cabecera, gráfica, desglose hora a hora; y la búsqueda de
                    tramos baratos (cheapRanges.js) que usa la pestaña de consejos
    recommendations/ pestaña de consejos: motor de reglas (dayInsights.js), el plan del día con su
                     carita (DayPlan.jsx, MoodFace.jsx) y «¿Cuándo lo enciendo?» (WhenToRun.jsx)
    fuel/            pestaña de carburantes: lógica pura (fuelData.js), provincias, filtros,
                     cabecera con la distribución de precios y ranking de gasolineras
  components/        piezas compartidas: selector de día, gráfica de precios, mascota, estados
                     vacío/error…
  hooks/              useEnergyCost, useDailyBaseline, usePowerKw, usePriceStats, useNow,
                      useFuelPrices, useFuelPrefs, useGeolocation
  utils/              descarga de CSV
  assets/             mascota (WebP)
```

## Desarrollo

```bash
npm install
npm run dev       # servidor de desarrollo
npm run lint       # ESLint
npm run build      # build de producción en dist/
npm run preview    # sirve el build localmente
```

No hay suite de tests automatizados; los cambios se verifican con lint, build y comprobación
manual en el navegador.

## Despliegue

Publicado en GitHub Pages desde `dist/` con [`gh-pages`](https://www.npmjs.com/package/gh-pages):

```bash
npm run deploy
```

`vite.config.js` fija `base: '/precioenergia/'` para que las rutas funcionen bajo ese subpath.

## Fuente de datos

La luz proviene de la API pública de REE (`apidatos.ree.es`), sin autenticación. Los carburantes, del servicio REST público del Ministerio para la Transición
Ecológica (`sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes`, el de
[geoportalgasolineras.es](https://geoportalgasolineras.es/)), también sin clave y con CORS abierto.
Como el listado de toda España pesa unos 12 MB, solo se pide la provincia elegida (≈0,3–1 MB) y se
cachea 15 minutos; con «Cerca de mí» se piden las dos provincias más próximas a tu ubicación.

El endpoint `precios-mercados-tiempo-real` devuelve **dos** series: `PVPC` (horaria) y
`Precio mercado spot` (cuartohoraria). La app consume la primera, así que los precios que muestra
son los del **PVPC**, la tarifa regulada del pequeño consumidor: ya incluyen peajes de acceso y
cargos, y quedan fuera el IVA, el impuesto especial sobre la electricidad y el término fijo de
potencia. Solo aplican a quien tenga contratado el PVPC con una comercializadora de referencia;
en mercado libre el precio lo fija el contrato.
