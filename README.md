# Precio de la luz

SPA en React que muestra el precio horario de la electricidad en España y los intercambios
programados de energía con los países frontera, usando la API pública de
[Red Eléctrica de España](https://www.ree.es/es/apidatos) (sin necesidad de API key).

🔗 **Demo**: https://alexbr784.github.io/precioenergia/

## Funcionalidad

**Precios**
- Selector de día («‹ Hoy ›» con accesos a Hoy y Mañana) y unidad (€/kWh por defecto, recordada).
- Cabecera con el precio de ahora, su tramo y su diferencia con la media, más mínimo, máximo y media.
- Gráfica de línea escalonada con degradado térmico (de barato a caro), media, hora actual y extremos.
- Precio hora a hora en tres franjas del día, con barra frente a la media y el coste de cada hora a
  tu potencia; ordenable por hora o de más barata a más cara, y exportable a Excel.
- Todo lo que depende de la hora actual avanza solo (reloj compartido `useNow`), también al cruzar
  la medianoche.

**Consejos**
- Veredicto del día: si sale caro, normal o barato comparado con la media de los 7 días anteriores.
- «Qué hacer hoy»: lo que conviene ahora mismo, las franjas a evitar o casi gratis y el contexto del
  día, generado por reglas (`dayInsights.js`): un día plano y uno con pico de tarde dan consejos
  distintos.
- «¿Cuándo lo enciendo?»: eliges un aparato (lavadora, lavavajillas, coche eléctrico…) o ajustas
  horas y potencia, y te da el mejor momento del día con su coste en euros, el ahorro frente al
  peor tramo y otras opciones, situados en una pista de 24 h. La potencia se guarda (`usePowerKw`)
  y el desglose hora a hora de Precios la usa para el coste de cada hora.

**Carburantes**
- Precio de Gasolina 95, Gasóleo A y GLP (y Gasolina 98, 95 Premium y Gasóleo Premium) en las
  gasolineras de tu zona: por provincia/municipio, o «Cerca de mí» con radio configurable.
- Veredicto con la gasolinera más barata, precio medio, más cara y cuánto cuesta llenar el depósito
  (litros editables y guardados) frente a un precio medio.
- Ranking con tramo de precio, distancia, horario («abierta ahora», mejor esfuerzo según el texto
  del Ministerio) y enlace «Cómo llegar». Filtros por marca y «solo abiertas ahora».
- La ubicación solo se usa en el navegador: no se envía ni se guarda.

**Intercambios**
- Mapa de flujos de importación/exportación entre España y Francia, Portugal, Andorra y Marruecos
  para un rango de fechas.
- Totales agregados y desglose por frontera.

Las cuatro vistas soportan modo claro / oscuro / según el sistema (persistido en `localStorage`).

## Stack técnico

- **React 18** + **Vite** — sin router ni gestor de estado global, cuatro pestañas con estado en `App.jsx`.
- **MUI v5** como sistema de componentes, con un tema propio (`src/theme/`) que centraliza paleta,
  tipografía y overrides; sin librerías de estilos adicionales.
- **ECharts** (`echarts-for-react`) para el gráfico de precios y el mapa de intercambios.
- **IBM Plex Sans** (variable), autoalojada — ver `src/theme/fonts.css`.
- **dayjs**, **axios**, **xlsx** (exportación) y `@mui/x-date-pickers`.

## Estructura

```
src/
  theme/            tokens de color/tipografía, tema MUI, modo claro/oscuro, tema de ECharts
  layout/           cabecera, pie, contenedor de página, selector de tema
  features/
    prices/         pestaña de precios: KPIs, filtros, tabla, gráfico; y la búsqueda de tramos
                    baratos (cheapRanges.js) que usa la pestaña de consejos
    recommendations/ pestaña de consejos: motor de reglas (dayInsights.js), su presentación y
                     la calculadora «¿Cuándo lo enciendo?» (WhenToRun.jsx)
    fuel/            pestaña de carburantes: lógica pura (fuelData.js), provincias, filtros,
                     veredicto, KPIs y ranking de gasolineras
    interchanges/    pestaña de intercambios: mapa, filtros, totales
  components/        piezas compartidas entre pestañas (línea de tiempo, selector de fecha,
                     gráfico de distribución, estados vacío/error…)
  hooks/              useEnergyCost, useDailyBaseline, usePowerKw, useInterchanges, usePriceStats,
                      useFuelPrices, useFuelPrefs, useGeolocation
  assets/             iconos e imágenes propias
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

La luz y los intercambios provienen de la API pública de REE (`apidatos.ree.es`), sin
autenticación. Los carburantes, del servicio REST público del Ministerio para la Transición
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
