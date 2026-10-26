/**
 * ECharts importado por piezas.
 *
 * `import * as echarts from "echarts"` metía en el bundle todos los tipos de
 * gráfico y componentes de la librería (~1 MB minificado), y la app solo usa
 * la línea escalonada con degradado (visualMap continuo) y las líneas de
 * referencia del gráfico de precios por hora.
 *
 * Si un gráfico nuevo necesita otro tipo o componente, hay que registrarlo
 * aquí; si no, ECharts avisa en consola de que no lo encuentra.
 */
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
  CanvasRenderer,
]);

export default echarts;
