import { useEffect, useMemo, useState } from "react";
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
  Select,
  InputLabel,
  MenuItem,
  FormControl,
  Tooltip,
  Snackbar,
  Grow,
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
  const { energyCost, loading, cheapPrice, timeoutFlag } = useEnergyCost();
  const [units, setUnits] = useState("€/MWh");
  const [order, setOrder] = useState("price");
  const [rowsTable, setRowsTable] = useState([]);
  const [open, setOpen] = useState(false);

  function GrowTransition(props) {
    return <Grow {...props} />;
  }

  const handleUnitChange = (event) => {
    setUnits(event.target.value);
    handleOpenSnackbar();
  };

  const handleOrderChange = (event) => {
    setOrder(event.target.value);
    handleOpenSnackbar();
  };

  const handleOpenSnackbar = () => {
    setOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  function sortData(data, sortBy) {
    return data.sort((a, b) => {
      if (sortBy === "name") {
        return a.name - b.name; // Sort numerically by name (price)
      } else if (sortBy === "hour") {
        return a.hour.localeCompare(b.hour); // Sort lexicographically by hour
      }
    });
  }

  function priceConversion(price) {
    if (units === "€/MWh") {
      return price;
    } else {
      return price / 1000;
    }
  }

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
        label: "Coste " + units,
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
  let xAxisDataFull = [];
  let yAxisData = [];
  let yAxisDataFull = [];
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
    yAxisData.push(priceConversion(item.price));
    xAxisData.push(item.hour);
    colors.push(getColor(item.price));
  });

  energyCost?.map((item) => {
    yAxisDataFull.push(priceConversion(item.price));
    xAxisDataFull.push(item.hour);
  });

  // Get the minimum price and assoiated hour

  const minPriceIndex = useMemo(() => {
    return yAxisDataFull.indexOf(Math.min(...yAxisDataFull));
  }, [yAxisDataFull]);

  const currentHour = useMemo(() => new Date().getHours(), []);

  // Order the energy data arrray copy by price and store it in rows
  let rows = useMemo(() => {
    return energyCost
      ?.slice()
      .sort((a, b) => a.price - b.price)
      .map((item) => {
        let value =
          units != "€/MWh"
            ? priceConversion(item.price).toFixed(5)
            : priceConversion(item.price);
        return {
          key: item.hour,
          name: value,
          hour: item.hour,
        };
      });
  }, [energyCost, units]);

  useEffect(() => {
    rows ? setRowsTable(sortData([...rows], order)) : setRowsTable([]);
  }, [rows, order]);

  return (
    <>
      {loading ? (
        !timeoutFlag ? (
          <CircularProgress />
        ) : (
          <Alert severity="error">
            Error al obtener los datos, recargue la página o pruebe más tarde.
          </Alert>
        )
      ) : (
        <Box
          sx={{
            width: "100%",
            overflow: "hidden",
            "&&": { touchAction: "auto" },
          }}
        >
          <div
            style={{ padding: 10, display: "flex", justifyContent: "flex-end" }}
          >
            <Tooltip
              title="Selecciona las unidades con la que ver los datos"
              arrow
              placement="left"
            >
              <FormControl>
                <InputLabel id="unitslabel">Unidades</InputLabel>
                <Select
                  labelId="unitslabel"
                  id="units-select"
                  value={units}
                  label="Unidades"
                  onChange={handleUnitChange}
                >
                  <MenuItem value={"€/MWh"}>€/MWh</MenuItem>
                  <MenuItem value={"€/KWh"}>€/KWh</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </div>
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
                    label: units,
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
                <ChartsYAxis label={units} />
                <ChartsXAxis />
                <ChartsTooltip />
              </ResponsiveChartContainer>

              <div style={{ marginTop: 20 }}>
                <Alert severity="info">{`El precio más bajo es de ${priceConversion(
                  cheapPrice
                )} ${units} de las ${xAxisDataFull[minPriceIndex]}h.`}</Alert>
                {
                  // Obtener la hora actual y comprobar si estamos en el rango horario donde el precio es mas bajo. El rango horario es en formato X - X
                  currentHour == xAxisDataFull[minPriceIndex].split("-")[0] ? (
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
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Tooltip
                  title="Selecciona como deseas ordenar la tabla"
                  arrow
                  placement="right"
                >
                  <FormControl>
                    <InputLabel id="orderLabel">Ordenar</InputLabel>
                    <Select
                      labelId="orderLabel"
                      id="order-select"
                      value={order}
                      label="Orden"
                      onChange={handleOrderChange}
                    >
                      <MenuItem value={"price"}>Precio</MenuItem>
                      <MenuItem value={"hour"}>Horas</MenuItem>
                    </Select>
                  </FormControl>
                </Tooltip>
              </div>
              <TableContainer sx={{ marginTop: 4, maxHeight: 600 }}>
                <Table aria-label="table" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" colSpan="1">
                        Hora
                      </TableCell>
                      <TableCell align="center" colSpan="1">
                        Coste por Hora ({units})
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rowsTable.map((row, index) => (
                      <TableRow
                        key={row.key}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          backgroundColor:
                            row.hour.split("-")[0] <= currentHour &&
                            row.hour.split("-")[1] > currentHour
                              ? "#e5f6fd"
                              : index % 2 === 0
                              ? "#F4F4F4"
                              : "white",
                        }}
                      >
                        <TableCell align="center">{row.hour}</TableCell>
                        <TableCell align="center">{row.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      <Snackbar
        open={open}
        onClose={handleCloseSnackbar}
        TransitionComponent={GrowTransition}
        autoHideDuration={1500}
      >
        <Alert severity="success" variant="filled" elevation={6}>
          Opciones actualizadas
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
