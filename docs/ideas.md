# Ideas pendientes

Análisis del 26/10/2026 sobre qué más se puede sacar de las APIs que ya usa la app (REE y
Ministerio de carburantes) para el usuario final. Comprobado con llamadas reales.

## Prioridad alta (mucho valor, poco coste)

### 1. Avance de la luz de mañana (Consejos / Precios)
- `mercados/precios-mercados-tiempo-real` con la fecha de mañana ya devuelve el **precio
  mayorista de mañana** (serie `Precio mercado spot`, 96 valores cuartohorarios) antes de
  mediodía. El PVPC de mañana no sale hasta ~20:15.
- Usarlo para un **avance** marcado como tal: «Mañana pinta un X % más barata/cara que hoy» y las
  horas previsiblemente más baratas. Se sustituye por el PVPC real cuando se publica.
- Responde a «¿pongo la lavadora hoy o espero a mañana?». Misma llamada que ya usa la app
  (`useEnergyCost`): hoy se queda con la serie PVPC y descarta la spot.

### 2. ¿Lleno ahora o espero? (Carburantes)
- Histórico diario filtrado: `EstacionesTerrestresHist/FiltroProvinciaProducto/{dd-mm-aaaa}/{prov}/{idProducto}`
  (fecha con guiones; con `/` da 404). ~27 KB por día (Ávila, Gasolina 95). El histórico sin
  filtrar pesa 12 MB/día: no usarlo.
- 14 días ≈ 380 KB → minigráfica del precio medio de la provincia y veredicto: «hoy está un X %
  más barata que hace dos semanas y bajando: puedes esperar» / «subiendo: llena ahora».
- Ids de producto en `Listados/ProductosPetroliferos` (G95 = 1, Gasóleo A = 4, GLP = 17…).
- Ojo con la CSP: el dominio ya está permitido en `connect-src`.

## Posibles, menos retorno
3. **Tendencia de la luz en 30 días** («¿está subiendo este mes?»). Misma API con más días; ojo:
   `time_trunc=day` da 400 en ese endpoint, hay que pedir horas y agregar.
4. **Renovable y CO₂**: `generacion/evolucion-renovable-no-renovable` y
   `generacion/no-renovables-detalle-emisiones-CO2` funcionan **solo por día**
   (`time_trunc=hour` → 400 «no disponible»). Sin dato horario no sirve para «enciende cuando la
   luz es más verde»; como mucho, un dato en «Para tener en cuenta».
5. **Estimador de la factura del mes**: útil, pero necesita término de potencia, IVA, impuesto
   eléctrico y bono social, que no vienen de la API y habría que mantener a mano.

## Descartado
- Avisos push («avísame cuando baje de X»): requieren servidor; la web es estática.
- Pestaña de intercambios internacionales: se quitó por no ayudar a un particular a gastar menos.
