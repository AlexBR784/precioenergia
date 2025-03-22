/* eslint-disable react/prop-types */
import ReactECharts from "echarts-for-react";

function DistributionChart({ data, units, priceConversion }) {
  if (!data || data.length === 0) {
    // Si los datos no están disponibles, retorna un mensaje o un componente vacío
    return <div>No hay datos disponibles para mostrar.</div>;
  }

  const serieX = data.map((item, index) => {
    const startHour = index.toString().padStart(2, "0") + ":00";
    const endHour = (index + 1).toString().padStart(2, "0") + ":00";
    return `${startHour}-${endHour}`;
  });
  const serieY = data.map((item) => priceConversion(item.value).toFixed(4));

  const threshold = units === "€/MWh" ? 25 : 0.025;

  const markAreas = [];
  const pieces = [];
  for (let i = 1; i < serieY.length; i++) {
    const diff = serieY[i] - serieY[i - 1];
    if (diff > threshold) {
      markAreas.push([{ xAxis: serieX[i - 1] }, { xAxis: serieX[i] }]);

      pieces.push({
        gt: i - 1,
        lte: i,
        color: "red",
      });
    } else {
      pieces.push({
        gt: i - 1,
        lte: i,
        color: "green",
      });
    }
  }

  const options = {
    grid: { top: 8, right: 8, bottom: 24, left: 36 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: serieX,
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}",
      },
      axisPointer: {
        snap: true,
      },
    },
    visualMap: {
      show: false, // Ocultar el visualMap en el gráfico
      dimension: 0, // Basar los colores en los índices de serieX
      pieces: pieces, // Aplicar los colores dinámicos
    },
    series: [
      {
        name: "Coste",
        data: serieY,
        type: "line",
        smooth: true,
        lineStyle: {
          width: 2,
        },
        markArea: {
          itemStyle: {
            color: "rgba(184, 75, 81, 0.4)", // Color semitransparente para las áreas
          },
          data: markAreas, // Aplica las áreas dinámicas
        },
      },
    ],
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: {},
      },
    },
  };

  return <ReactECharts style={{ marginTop: 20 }} option={options} />;
}

export default DistributionChart;
