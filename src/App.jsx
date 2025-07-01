import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { useEnergyCost } from "./hooks/useEnergyCost";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import { ExcelIcon } from "./assets/Excel";
import Modal from "@mui/material/Modal";
import { Stepper, Step, StepLabel } from "@mui/material";

import PropTypes from "prop-types";
import DistributionChart from "./components/DistributionChart";

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
  Button,
  Input,
} from "@mui/material";

import {
  ResponsiveChartContainer,
  BarPlot,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  axisClasses,
} from "@mui/x-charts";
import * as XLSX from "xlsx";

function App() {
  const {
    energyCost,
    loading,
    cheapPrice,
    timeoutFlag,
    fetchEnergyCost,
    noData,
  } = useEnergyCost();
  const [units, setUnits] = useState("€/MWh");
  const [order, setOrder] = useState("price");
  const [rowsTable, setRowsTable] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openModal, setOpenModal] = useState(false);
  const [rangeValue, setRangeValue] = useState(0);
  const [bestRangeResult, setBestRangeResult] = useState([]);

  const handleOpenModal = () => {
    setOpenModal(true);
    setRangeValue(0);
    setBestRangeResult([]);
  };
  const handleCloseModal = () => setOpenModal(false);

  const bestRange = (rangeS) => {
    const range = parseInt(rangeS, 10);
    if (!energyCost || energyCost.length === 0) {
      console.error("No se han proporcionado datos de energía.");
      return;
    }

    if (range <= 0 || range > energyCost.length) {
      console.error("Invalid range value");
      return;
    }

    let minCost = Infinity;
    let bestRangeResult = [];

    // Calcular el rango más barato
    for (let i = 0; i <= energyCost.length - range; i++) {
      const currentRange = energyCost.slice(i, i + range);
      const currentCost = currentRange.reduce(
        (sum, item) => sum + item.value,
        0
      );

      if (currentCost < minCost) {
        minCost = currentCost;
        bestRangeResult = currentRange.map((item) => item.datetime);
      }
    }

    setBestRangeResult(bestRangeResult);
  };

  const exportToExcel = () => {
    let copyRowsTable = [...rowsTable];
    const sortedRowsTable = sortData(copyRowsTable, "hour");
    const exportData = sortedRowsTable.map((row) => ({
      Horas: row.hour,
      Precio: row.name,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Precios Energia");
    XLSX.writeFile(
      workbook,
      `Precios Energia ${dayjs(currentDate).format("DD/MM/YYYY")}.xlsx`
    );
  };

  const setBestRangeNumber = (event) => {
    setRangeValue(event.target.value);
  };

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

  const dateChange = (newValue) => {
    const formattedDate = dayjs(newValue.$d).format("YYYY-MM-DD");
    setCurrentDate(formattedDate);
    fetchEnergyCost(formattedDate);
  };

  function sortData(data, sortBy) {
    return data.sort((a, b) => {
      if (sortBy === "price") {
        return a.name - b.name; // Ordenar numéricamente por nombre (precio)
      } else if (sortBy === "hour") {
        const [aHour, aMinute] = a.hour.split(":").map(Number);
        const [bHour, bMinute] = b.hour.split(":").map(Number);
        return aHour - bHour || aMinute - bMinute; // Ordenar numéricamente por hora y minuto
      }
      return 0; // Caso por defecto si sortBy no coincide
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
      return item.datetime.split(":")[0] >= currentHour;
    });
  } else {
    finalEnergyCost = energyCost;
  }

  finalEnergyCost?.map((item) => {
    yAxisData.push(priceConversion(item.value));
    xAxisData.push(item.datetime);
    colors.push(getColor(item.value));
  });

  energyCost?.map((item) => {
    yAxisDataFull.push(priceConversion(item.value));
    xAxisDataFull.push(item.datetime);
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
            ? priceConversion(item.value).toFixed(5)
            : priceConversion(item.value);
        return {
          key: `${item.datetime}-${item.value}`, // Combina datetime y value para una clave única
          name: value,
          hour: item.datetime,
        };
      });
  }, [energyCost, units]);

  useEffect(() => {
    rows ? setRowsTable(sortData([...rows], order)) : setRowsTable([]);
  }, [rows, order]);

  return (
    <>
      {noData ? (
        <Alert severity="error">
          No hay datos para esa fecha, por favor recargue la página.
        </Alert>
      ) : loading ? (
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
            style={{
              padding: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={es}>
              <DatePicker
                label="Selecciona fecha"
                format="DD/MM/YYYY"
                defaultValue={dayjs(new Date().setHours(23, 59, 59, 999))}
                onChange={(newValue) => dateChange(newValue)}
              />
            </LocalizationProvider>

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
              <Typography variant="h6">💸 Coste por hora</Typography>
              {/*<ResponsiveChartContainer
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
              </ResponsiveChartContainer>*/}

              <DistributionChart
                style={{ padding: 10 }}
                data={energyCost}
                priceConversion={priceConversion}
                units={units}
              />

              <div style={{ marginTop: 20 }}>
                <Alert severity="info">{`El precio más bajo es de ${priceConversion(
                  cheapPrice
                ).toFixed(5)} ${units} de las ${
                  xAxisDataFull[minPriceIndex]
                }h.`}</Alert>
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
              <div style={{ marginTop: 20 }}>
                <Button onClick={handleOpenModal} variant="outlined">
                  🕒 Calculadora Rangos Baratos
                </Button>
                <Modal
                  open={openModal}
                  onClose={handleCloseModal}
                  aria-labelledby="modal-modal-title"
                  aria-describedby="modal-modal-description"
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: screen.width * 0.6,
                      height: screen.height * 0.5,
                      bgcolor: "background.paper",
                      p: 4,
                    }}
                  >
                    <Typography
                      id="modal-modal-title"
                      variant="h6"
                      component="h2"
                      sx={{ marginTop: 2, textAlign: "center" }}
                    >
                      Introduzca las horas deseadas para calcular el rango más
                      barato
                    </Typography>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 25,
                        marginTop: 25,
                      }}
                    >
                      <Input type="number" onChange={setBestRangeNumber} />

                      <Button
                        variant="contained"
                        onClick={() => bestRange(rangeValue)}
                      >
                        Calcular
                      </Button>
                    </div>
                    <Stepper
                      alternativeLabel
                      sx={{
                        marginTop: 6,
                        overflowX: "auto",
                        width: "90%",
                        display: "flex",
                        marginLeft: "auto",
                        marginRight: "auto",
                      }}
                    >
                      {bestRangeResult.map((hour, index) => (
                        <Step key={index}>
                          <StepLabel
                            StepIconComponent={(props) => (
                              <CustomStepIcon {...props} hour={hour} />
                            )}
                          >
                            {/* Puedes dejar el texto vacío o usarlo para algo adicional */}
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                </Modal>
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
              <Button onClick={exportToExcel} startIcon={<ExcelIcon />}>
                Descargar
              </Button>
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

const CustomStepIcon = ({ hour }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#1565c0",
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
        boxSizing: "border-box",
      }}
    >
      {hour}
    </div>
  );
};

CustomStepIcon.propTypes = {
  active: PropTypes.bool.isRequired,
  completed: PropTypes.bool.isRequired,
  hour: PropTypes.string.isRequired,
};

export default App;
