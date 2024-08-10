import { useMemo } from "react";
import "./App.css";
import { useEnergyCost } from "./hooks/useEnergyCost";
import {
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  axisClasses,
} from "@mui/x-charts";

function App() {
  const { energyCost, loading, cheapPrice } = useEnergyCost();

  const chartSetting = {
    xAxis: [
      {
        label: "Coste €/MWh",
      },
    ],

    height: 400,
  };

  const getColor = (price) => {
    if (price == cheapPrice) {
      return "#98D8AA";
    } else if (price > cheapPrice && price <= cheapPrice * 1.5) {
      return "#F3E99F";
    } else if (price > cheapPrice * 1.5 && price < cheapPrice * 2) {
      return "#F7D060";
    } else {
      return "#FF6D60";
    }
  };

  let xAxisData = [];
  let yAxisData = [];
  let colors = [];

  energyCost?.map((item) => {
    yAxisData.push(item.price);
    xAxisData.push(item.hour);
    colors.push(getColor(item.price));
  });

  // Get the minimum price and assoiated hour

  const minPriceIndex = useMemo(() => {
    return yAxisData.indexOf(Math.min(...yAxisData));
  }, [yAxisData]);

  const currentHour = useMemo(() => new Date().getHours(), []);

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ width: "100%", overflow: "hidden" }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Coste por hora</Typography>
              <ResponsiveChartContainer
                sx={{
                  [`& .${axisClasses.left} .${axisClasses.label}`]: {
                    transform: "translateX(-10px)",
                  },
                }}
                height={chartSetting.height}
                series={[
                  {
                    type: "bar",
                    data: yAxisData,
                    label: "€/MWh",
                    valueFormatter: (value) => `${value}`,
                  },
                ]}
                xAxis={[
                  {
                    data: xAxisData,
                    scaleType: "band",
                    colorMap: {
                      type: "ordinal",
                      colors: colors,
                    },
                    zoom: true,
                    valueFormatter: (value) => `${value}`,
                  },
                ]}
              >
                <BarPlot />
                <ChartsYAxis label="€/MWh" />
                <ChartsXAxis label="Hora" />
                <ChartsTooltip />
              </ResponsiveChartContainer>

              <div>
                <Alert severity="info">{`El precio más bajo es de ${cheapPrice}€/MWh de las ${xAxisData[minPriceIndex]}h.`}</Alert>
                {
                  // Obtener la hora actual y comprobar si estamos en el rango horario donde el precio es mas bajo. El rango horario es en formato X - X
                  currentHour >= xAxisData[minPriceIndex].split("-")[0] &&
                  currentHour <= xAxisData[minPriceIndex].split("-")[1] ? (
                    <Alert severity="success">
                      Estamos en el rango horario más barato
                    </Alert>
                  ) : (
                    <Alert severity="warning">
                      No estamos en el rango horario más barato
                    </Alert>
                  )
                }
              </div>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}

export default App;
