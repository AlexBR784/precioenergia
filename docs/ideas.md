# Ideas y mantenimiento

## Hecho (27/10/2026)
- Avance de la luz de mañana con el mercado mayorista (Consejos y «Mañana» sin PVPC).
- «¿Lleno ahora o espero?»: tendencia de 14 días por provincia con el histórico del Ministerio,
  día de la semana más barato (bajo demanda) y aviso antes de puentes y vacaciones.
- «Mi suministro»: tarifa (PVPC, por tramos, precio fijo), región (IVA / IGIC / IPSI), precios con
  impuestos y potencia contratada. Consejos se adapta a la tarifa.
- Tramos 2.0TD (valle, llano, punta) con festivos nacionales y hora local; en Ceuta y Melilla, una
  hora más tarde.
- Pestaña Factura: estimación con potencia, impuestos y bono social; comparación con el contrato de
  mercado libre; enlace al comparador de la CNMC; comprobación del bono social; importación del
  CSV de consumo horario (distribuidora o Datadis); butano y TUR de gas.
- «Cómo va el mes» en Precios (este mes frente al anterior y al de hace un año).
- App instalable y sin conexión (service worker), evento de calendario y compartir, precio en el
  título de la pestaña y favicon de color.
- Carburantes: descuento de fidelización, gasolineras favoritas, coste del viaje y comparación con
  un eléctrico cargado en las horas baratas.
- Guía sin tour forzado (`src/guide`): una pista por sección la primera vez (como mucho una por
  visita, nunca en la primera hasta pasados 8 s ni si se llega por un enlace a una sección),
  «Novedades» una sola vez para quien ya usaba la web, «Instalar» desde la tercera visita y
  «Ver recorrido» a demanda en el pie. Todo en `precioenergia:guide`; para volver a verlo, borrar
  esa clave.

## Mantenimiento: cifras que cambian por ley
Todas están en `src/data/spain.js`, con la fecha de revisión. La página `#mantenimiento`
(https://alexbr784.github.io/precioenergia/#mantenimiento, no enlazada) lista qué toca revisar y
cuándo; tras abrirla una vez, ese dispositivo enseña un aviso con contador en la cabecera. Revisar:
- **Cada dos meses** (enero, marzo, mayo, julio, septiembre, noviembre): precio de la bombona de
  butano (`BUTANE`).
- **Cada trimestre** (enero, abril, julio, octubre): TUR del gas (`GAS_TUR`).
- **Cada año** (enero): peajes y cargos del término de potencia (`POWER_TERM`), IPREM, descuentos y
  límites del bono social (`SOCIAL_BONUS`, vigentes hasta el 31/12/2026).
- **Cuando el Gobierno los toque**: IVA de la luz e impuesto eléctrico (pueden volver a bajar si
  el IPC eléctrico se dispara), IGIC e IPSI.

## Pendiente
- **Idiomas** (catalán, gallego, euskera e inglés): obliga a sacar todos los textos de los
  componentes a ficheros de traducción y a revisar cada idioma con alguien nativo. Mejor como
  tarea aparte.
- PVPC propio de Ceuta y Melilla: algunas horas difieren del peninsular y la API pública de REE
  no lo ofrece (con `geo_limit` distinto de peninsular responde 400). Hoy se avisa al usuario.

## Descartado
- Avisos push («avísame cuando baje de X»): requieren servidor. Sustituido por el evento de
  calendario con aviso.
- Renovable y CO₂ por hora: la API solo los da por día.
- Pestaña de intercambios internacionales: no ayudaba a un particular a gastar menos.
