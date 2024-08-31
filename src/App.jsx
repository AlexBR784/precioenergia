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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
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

  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(min-width:769px) and (max-width:1338px)");

  const tickLabelStyle = isMobile
    ? {
        angle: 90,
        textAnchor: "start",
        fontSize: 10,
      }
    : isTablet
    ? {
        angle: 45,
        textAnchor: "start",
        fontSize: 12,
      }
    : {
        angle: 0,
        textAnchor: "middle",
        fontSize: 14,
      };

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
  let finalEnergyCost = [];
  // If is mobile, only show since currrent hour
  if (isMobile) {
    const currentHour = new Date().getHours();
    finalEnergyCost = energyCost?.filter((item) => {
      return item.hour.split("-")[0] >= currentHour;
    });
  } else {
    finalEnergyCost = energyCost;
  }
  finalEnergyCost?.map((item) => {
    yAxisData.push(item.price);
    xAxisData.push(item.hour);
    colors.push(getColor(item.price));
  });

  // Get the minimum price and assoiated hour

  const minPriceIndex = useMemo(() => {
    return yAxisData.indexOf(Math.min(...yAxisData));
  }, [yAxisData]);

  const currentHour = useMemo(() => new Date().getHours(), []);

  // Order the energy data arrray copy by price and store it in rows
  const rows = useMemo(() => {
    return energyCost
      ?.slice()
      .sort((a, b) => a.price - b.price)
      .map((item) => {
        return {
          name: item.price,
          hour: item.hour,
        };
      });
  }, [energyCost]);

  return (
    <>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box
          sx={{
            width: "100%",
            overflow: "hidden",
            "&&": { touchAction: "auto" },
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Coste por hora</Typography>
              <ResponsiveChartContainer
                sx={{
                  [`& .${axisClasses.left} .${axisClasses.label}`]: {
                    transform: "translateX(-10px)",
                  },
                  "&&": { touchAction: "auto" },
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
                    tickLabelStyle: tickLabelStyle,
                    zoom: true,
                    valueFormatter: (value) => `${value}`,
                  },
                ]}
              >
                <BarPlot />
                <ChartsYAxis label="€/MWh" />
                <ChartsXAxis />
                <ChartsTooltip />
              </ResponsiveChartContainer>

              <div style={{ marginTop: 20 }}>
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
              <TableContainer sx={{ marginTop: 4 }}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Coste por Hora (€/MWh)</TableCell>
                      <TableCell align="center">Hora</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.name}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell align="center">{row.hour}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}

export default App;
