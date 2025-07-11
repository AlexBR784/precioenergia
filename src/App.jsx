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
  Checkbox,
  FormControlLabel,
  Slider,
  Stack,
  IconButton,
} from "@mui/material";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";

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
  const [bestRangeResult, setBestRangeResult] = useState([]);
  const [sliderValue, setSliderValue] = useState(3);
  const [onlyFuture, setOnlyFuture] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleOpenModal = () => {
    setOpenModal(true);
    setBestRangeResult([]);
  };
  const handleCloseModal = () => setOpenModal(false);

  const currentHourInt = new Date().getHours();
  const totalHours = energyCost?.length || 24;
  const futureHours = energyCost
    ? energyCost.filter(
        (item) => parseInt(item.datetime.split(":")[0], 10) >= currentHourInt
      ).length
    : totalHours;

  const sliderMax = onlyFuture ? futureHours : totalHours;

  useEffect(() => {
    if (sliderValue > sliderMax) setSliderValue(sliderMax);
  }, [sliderMax]);

  const bestRanges = (rangeS, topN = 3) => {
    const range = parseInt(rangeS, 10);
    if (!energyCost || energyCost.length === 0) return;
    if (range <= 0 || range > energyCost.length) return;

    let ranges = [];
    const nowHour = new Date().getHours();

    for (let i = 0; i <= energyCost.length - range; i++) {
      const currentRange = energyCost.slice(i, i + range);
      const startHour = parseInt(currentRange[0].datetime.split(":")[0], 10);

      if (onlyFuture && startHour < nowHour) continue;

      const currentCost = currentRange.reduce(
        (sum, item) => sum + item.value,
        0
      );
      ranges.push({
        hours: currentRange.map((item) => item.datetime),
        cost: currentCost,
      });
    }
    ranges.sort((a, b) => a.cost - b.cost);
    setBestRangeResult(ranges.slice(0, topN));
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

  // Get the current hour and check if it is in the cheapest range

  const currentHour = useMemo(() => new Date().getHours(), []);

  let startHour = null;
  let endHour = null;

  let mensajeRango = "";
  let mensajeTipo = "info"; // info, warning, error

  const valorHora = xAxisDataFull[minPriceIndex];

  if (minPriceIndex !== -1 && valorHora) {
    if (valorHora.includes("-")) {
      // Rango de horas
      const [start, end] = valorHora.split("-");
      startHour = parseInt(start, 10);
      endHour = parseInt(end, 10);

      if (currentHour < startHour) {
        const faltan = startHour - currentHour;
        mensajeRango = `Faltan ${faltan} hora${
          faltan > 1 ? "s" : ""
        } para el rango más barato (${startHour}:00 - ${endHour}:00).`;
        mensajeTipo = "warning";
      } else if (currentHour >= startHour && currentHour < endHour) {
        const quedan = endHour - currentHour;
        mensajeRango = `Estamos en el rango más barato. Quedan ${quedan} hora${
          quedan > 1 ? "s" : ""
        } (${startHour}:00 - ${endHour}:00).`;
        mensajeTipo = "info";
      } else {
        mensajeRango = `El rango más barato (${startHour}:00 - ${endHour}:00) ya ha pasado.`;
        mensajeTipo = "error";
      }
    } else {
      // Solo una hora, no rango
      const hora = parseInt(valorHora.split(":")[0], 10);
      if (currentHour < hora) {
        const faltan = hora - currentHour;
        mensajeRango = `Faltan ${faltan} hora${
          faltan > 1 ? "s" : ""
        } para la hora más barata.`;
        mensajeTipo = "warning";
      } else if (currentHour === hora) {
        mensajeRango = `¡Estamos en la hora más barata!`;
        mensajeTipo = "success";
      } else {
        mensajeRango = `La hora más barata ya ha pasado.`;
        mensajeTipo = "error";
      }
    }
  }

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
          key: `${item.datetime}-${item.value}`, // Unique key for each row
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
                {mensajeRango && (
                  <Alert sx={{ marginTop: 1 }} severity={mensajeTipo}>
                    {mensajeRango}
                  </Alert>
                )}
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
                      width: isMobile ? "90vw" : "50vw",
                      bgcolor: "background.paper",
                      p: 4,
                      borderRadius: 3,
                      boxShadow: 24,
                    }}
                  >
                    {isMobile && (
                      <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: 8,
                          color: (theme) => theme.palette.grey[500],
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                    <Typography variant="h6" textAlign="center" mb={2}>
                      Calculadora de Rangos Baratos
                    </Typography>
                    <Typography variant="body2" textAlign="center" mb={2}>
                      Selecciona cuántas horas consecutivas necesitas y te
                      mostraremos los rangos más baratos del día.
                    </Typography>
                    <Stack spacing={2} alignItems="center" mt={8} mb={2}>
                      <Slider
                        value={sliderValue}
                        min={1}
                        max={sliderMax}
                        step={1}
                        marks
                        valueLabelDisplay="on"
                        onChange={(_, val) => setSliderValue(val)}
                        sx={{
                          width: "80%",
                          // Cambia el color de fondo del value label
                          "& .MuiSlider-valueLabel": {
                            backgroundColor: "#1976d2", // Cambia este color al que quieras
                            color: "#fff",
                          },
                        }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={onlyFuture}
                            onChange={(_, checked) => setOnlyFuture(checked)}
                            color="primary"
                          />
                        }
                        label={
                          isMobile
                            ? "Solo desde ahora"
                            : "Solo mostrar rangos a partir de la hora actual"
                        }
                        sx={{ mb: 4, display: "block" }}
                      />
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => bestRanges(sliderValue)}
                      >
                        Calcular
                      </Button>
                    </Stack>
                    {bestRangeResult.length > 0 && (
                      <TableContainer sx={{ mt: 2, mb: 2, maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">#</TableCell>
                              <TableCell align="center">Estado</TableCell>
                              <TableCell align="center">Horas</TableCell>
                              <TableCell align="center">
                                Coste total ({units})
                              </TableCell>
                              <TableCell align="center">
                                Coste medio ({units})
                              </TableCell>
                              <TableCell align="center">Acción</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {bestRangeResult.map((range, idx) => {
                              const textoCopiar = `Rango ${idx + 1}: ${
                                range.hours[0]
                              } - ${range.hours[range.hours.length - 1]} (${
                                range.hours.length
                              }h)\nTotal: ${priceConversion(range.cost).toFixed(
                                4
                              )} ${units}\nMedio: ${(
                                priceConversion(range.cost) / range.hours.length
                              ).toFixed(4)} ${units}`;
                              const start = parseInt(
                                range.hours[0].split(":")[0],
                                10
                              );
                              const end =
                                parseInt(
                                  range.hours[range.hours.length - 1].split(
                                    ":"
                                  )[0],
                                  10
                                ) + 1;
                              const isNow =
                                currentHour >= start && currentHour < end;

                              return (
                                <TableRow key={idx}>
                                  <TableCell align="center">
                                    {idx + 1}
                                  </TableCell>
                                  <TableCell align="center">
                                    {isNow ? (
                                      <Tooltip title="¡Ahora mismo estás en este rango barato!">
                                        <WarningAmberIcon
                                          color="warning"
                                          className="blink-warning"
                                        />
                                      </Tooltip>
                                    ) : currentHour < start ? (
                                      <Tooltip title="Este rango barato aún no ha empezado">
                                        <AccessTimeIcon color="success" />
                                      </Tooltip>
                                    ) : (
                                      <Tooltip title="Este rango ya ha pasado">
                                        <CheckCircleIcon color="primary" />
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                  <TableCell align="center">
                                    {range.hours[0]}
                                    {range.hours.length > 1 &&
                                      " - " +
                                        range.hours[range.hours.length - 1]}
                                  </TableCell>
                                  <TableCell align="center">
                                    {priceConversion(range.cost).toFixed(4)}
                                  </TableCell>
                                  <TableCell align="center">
                                    {(
                                      priceConversion(range.cost) /
                                      range.hours.length
                                    ).toFixed(4)}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Tooltip
                                      title="Copia este rango para compartirlo por WhatsApp o redes sociales"
                                      arrow
                                      placement="right"
                                      enterDelay={400}
                                    >
                                      <Button
                                        size="small"
                                        sx={{ minWidth: 100 }}
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            textoCopiar
                                          );
                                          setCopiedIdx(idx);
                                          setTimeout(
                                            () => setCopiedIdx(null),
                                            1200
                                          );
                                        }}
                                        startIcon={
                                          <Box
                                            sx={{
                                              width: 24,
                                              display: "flex",
                                              justifyContent: "center",
                                            }}
                                          >
                                            {copiedIdx === idx ? (
                                              <CheckIcon color="success" />
                                            ) : (
                                              <ContentCopyIcon />
                                            )}
                                          </Box>
                                        }
                                      >
                                        Copiar
                                      </Button>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
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
