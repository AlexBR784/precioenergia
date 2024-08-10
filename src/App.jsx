import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { useEnergyCost } from "./hooks/useEnergyCost";
import {
  CircularProgress,
  Card,
  Chip,
  CardContent,
  Alert,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts";

function App() {
  const { energyCost, loading, cheapPrice } = useEnergyCost();
  const isMobile = useMediaQuery("(max-width:600px)");

  const chartSetting = {
    xAxis: [
      {
        label: "Coste €/MWh",
      },
    ],
    yAxis: [
      {
        tickCount: isMobile ? 5 : 10, // Reduce el número de etiquetas en dispositivos móviles
        tickLabelAngle: isMobile ? -45 : 0, // Rota las etiquetas en dispositivos móviles
      },
    ],
    width: isMobile ? 300 : 500,
    height: isMobile ? 200 : 400,
  };

  const getColor = (price) => {
    // "#9ADE7B" : "#FF8F8F"
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
    xAxisData.push(item.price);
    yAxisData.push(item.hour);
    colors.push(getColor(item.price));
  });

  // Get the minimum price and assoiated hour
  const minPrice = Math.min(...xAxisData);
  const minPriceIndex = xAxisData.indexOf(minPrice);

  return (
    <section>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Coste por hora</Typography>
          {loading ? (
            <CircularProgress />
          ) : (
            <BarChart
              yAxis={[
                {
                  scaleType: "band",
                  data: yAxisData,
                  colorMap: {
                    type: "ordinal",
                    colors: colors,
                  },
                },
              ]}
              series={[
                {
                  data: xAxisData,
                  type: "bar",
                },
              ]}
              layout="horizontal"
              grid={{ vertical: true }}
              {...chartSetting}
            />
          )}

          <Alert severity="info">{`El precio más bajo es de ${cheapPrice}€/MWh de las ${yAxisData[minPriceIndex]}h.`}</Alert>
        </CardContent>
      </Card>
    </section>
  );
}

export default App;
