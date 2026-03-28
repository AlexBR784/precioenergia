import { useCallback, useState } from "react";
import axios from "axios";

const INTERCHANGES_ENDPOINT =
  "https://apidatos.ree.es/es/datos/intercambios/todas-fronteras-programados";

const formatDateForQuery = (date, endOfDay = false) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  const time = endOfDay ? "23:59" : "00:00";
  return `${year}-${month}-${day}T${time}`;
};

const getSeriesByType = (content = [], requestedType) => {
  return (
    content.find((entry) => entry?.attributes?.type === requestedType)
      ?.attributes || null
  );
};

const sumValues = (values = []) =>
  values.reduce((acc, item) => acc + Number(item?.value || 0), 0);

const buildMonthlySeries = (importValues = [], exportValues = [], saldoValues = []) => {
  const indexByDate = new Map();

  importValues.forEach((item) => {
    indexByDate.set(item.datetime, {
      datetime: item.datetime,
      import: Number(item.value || 0),
      export: 0,
      exportAbs: 0,
      saldo: 0,
    });
  });

  exportValues.forEach((item) => {
    const current = indexByDate.get(item.datetime) || {
      datetime: item.datetime,
      import: 0,
      export: 0,
      exportAbs: 0,
      saldo: 0,
    };
    const exportValue = Number(item.value || 0);
    current.export = exportValue;
    current.exportAbs = Math.abs(exportValue);
    indexByDate.set(item.datetime, current);
  });

  saldoValues.forEach((item) => {
    const current = indexByDate.get(item.datetime) || {
      datetime: item.datetime,
      import: 0,
      export: 0,
      exportAbs: 0,
      saldo: 0,
    };
    current.saldo = Number(item.value || 0);
    indexByDate.set(item.datetime, current);
  });

  return [...indexByDate.values()].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );
};

const normalizeInterchanges = (included = []) =>
  included.map((border) => {
    const content = border?.attributes?.content || [];

    const exportAttr = getSeriesByType(content, "export");
    const importAttr = getSeriesByType(content, "import");
    const saldoAttr = getSeriesByType(content, "saldo");

    const exportValues = exportAttr?.values || [];
    const importValues = importAttr?.values || [];
    const saldoValues = saldoAttr?.values || [];

    const exportTotalRaw =
      typeof exportAttr?.total === "number"
        ? exportAttr.total
        : sumValues(exportValues);
    const importTotal =
      typeof importAttr?.total === "number"
        ? Math.abs(importAttr.total)
        : Math.abs(sumValues(importValues));
    const saldo =
      typeof saldoAttr?.total === "number"
        ? saldoAttr.total
        : sumValues(saldoValues);

    return {
      frontera: border?.id || border?.attributes?.title || "Desconocida",
      importTotal,
      exportTotalAbs: Math.abs(exportTotalRaw),
      saldo,
      seriesMensual: buildMonthlySeries(importValues, exportValues, saldoValues),
      lastUpdate:
        border?.attributes?.["last-update"] ||
        exportAttr?.["last-update"] ||
        importAttr?.["last-update"] ||
        null,
    };
  });

export const useInterchanges = () => {
  const [interchangesData, setInterchangesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchInterchanges = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    const startDateQuery = formatDateForQuery(startDate, false);
    const endDateQuery = formatDateForQuery(endDate, true);

    const targetUrl = `${INTERCHANGES_ENDPOINT}?start_date=${startDateQuery}&end_date=${endDateQuery}&time_trunc=month`;

    try {
      const response = await axios.get(targetUrl, {
        withCredentials: false,
        timeout: 10000,
      });

      const included = response?.data?.included || [];
      const parsedData = normalizeInterchanges(included);

      setInterchangesData(parsedData);
      setLastUpdate(response?.data?.data?.attributes?.["last-update"] || null);
    } catch (requestError) {
      const errorMessage =
        requestError?.response?.data?.errors?.[0]?.detail ||
        "No se pudieron cargar los intercambios. Inténtalo de nuevo.";
      setError(errorMessage);
      setInterchangesData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    interchangesData,
    loading,
    error,
    lastUpdate,
    fetchInterchanges,
  };
};

