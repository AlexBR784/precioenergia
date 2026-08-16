import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const ENDPOINT =
  "https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real";

const formatDay = (date) => {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const useEnergyCost = () => {
  const [energyCost, setEnergyCost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cheapPrice, setCheapPrice] = useState(null);
  const [timeoutFlag, setTimeoutFlag] = useState(false);
  const [noData, setNoData] = useState(false);

  const fetchEnergyCost = useCallback(async (date = new Date()) => {
    const day = formatDay(date);
    const targetUrl = `${ENDPOINT}?start_date=${day}T00:00&end_date=${day}T23:59&time_trunc=hour`;

    // Reiniciar el estado en cada petición: sin esto, un reintento tras un
    // error se quedaría atrapado mostrando el error anterior para siempre.
    setLoading(true);
    setTimeoutFlag(false);
    setNoData(false);

    let response = null;
    try {
      response = await axios.get(targetUrl, {
        withCredentials: false,
        timeout: 8000,
      });
    } catch (error) {
      // La API responde 502 cuando aún no hay datos publicados para ese día.
      if (error?.response?.status === 502) {
        setNoData(true);
      } else {
        setTimeoutFlag(true);
      }
      setLoading(false);
      return;
    }

    const parsedData = response?.data?.included?.[0]?.attributes?.values;

    if (!parsedData?.length) {
      setNoData(true);
      setLoading(false);
      return;
    }

    const normalized = parsedData.map((item) => {
      const itemDate = new Date(item.datetime);
      const hours = itemDate.getHours().toString().padStart(2, "0");
      const minutes = itemDate.getMinutes().toString().padStart(2, "0");
      return { ...item, datetime: `${hours}:${minutes}` };
    });

    const cheapestItem = normalized.reduce((prev, current) =>
      prev.value < current.value ? prev : current
    );

    setEnergyCost(normalized);
    setCheapPrice(cheapestItem.value);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEnergyCost();
  }, [fetchEnergyCost]);

  return {
    energyCost,
    loading,
    cheapPrice,
    timeoutFlag,
    fetchEnergyCost,
    noData,
  };
};
