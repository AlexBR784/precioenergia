# Precio de la luz

SPA en React que muestra el precio horario de la electricidad en España y los intercambios
programados de energía con los países frontera, usando la API pública de
[Red Eléctrica de España](https://www.ree.es/es/apidatos) (sin necesidad de API key).

🔗 **Demo**: https://alexbr784.github.io/precioenergia/

## Funcionalidad

**Precios**
- Precio horario del día seleccionado (€/MWh o €/kWh), con gráfico de evolución y tabla ordenable.
- KPIs del día: precio actual, mínimo, máximo, media y ahorro potencial.
- Calculadora de tramos baratos: indica la mejor ventana de N horas consecutivas para poner un
  electrodoméstico, con coste estimado en euros según la potencia (kW) del aparato.
- Exportación a Excel.

**Intercambios**
- Mapa de flujos de importación/exportación entre España y Francia, Portugal, Andorra y Marruecos
  para un rango de fechas.
- Totales agregados y desglose por frontera.

Ambas vistas soportan modo claro / oscuro / según el sistema (persistido en `localStorage`).

## Stack técnico

- **React 18** + **Vite** — sin router ni gestor de estado global, dos pestañas con estado en `App.jsx`.
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
    prices/         pestaña de precios: KPIs, filtros, tabla, gráfico, calculadora de tramos
    interchanges/    pestaña de intercambios: mapa, filtros, totales
  components/        piezas compartidas entre pestañas (gráfico de distribución, estados vacío/error…)
  hooks/              useEnergyCost, useInterchanges, usePriceStats — acceso a datos y derivados
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

Toda la información proviene de la API pública de REE (`apidatos.ree.es`), sin autenticación.
Los precios son de mercado mayorista: no incluyen peajes, cargos ni impuestos.
