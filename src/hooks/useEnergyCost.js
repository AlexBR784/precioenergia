import { useState, useEffect } from "react";
import axios from "axios";

export const useEnergyCost = () => {
  const [energyCost, setEnergyCost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cheapPrice, setCheapPrice] = useState(null);
  const [timeoutFlag, setTimeoutFlag] = useState(false);
  const [noData, setNoData] = useState(false);

  const fetchEnergyCost = async (date = new Date()) => {
    const dateObj = new Date(date); // Ensure date is a Date object
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObj.getDate().toString().padStart(2, "0");
    const startDate = `${year}-${month}-${day}T00:00`;
    const endDate = `${year}-${month}-${day}T23:59`;
    const targetUrl = `https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real?start_date=${startDate}&end_date=${endDate}&time_trunc=hour`;

    let response = null;
    try {
      response = await axios.get(targetUrl, {
        withCredentials: false,
        timeout: 8000,
      });
    } catch (e) {
      setTimeoutFlag(true);
      if (e.response.status === 502) {
        setNoData(true);
      }
      return;
    }

    const parsedData = response.data.included[0].attributes.values;

    parsedData.forEach((item) => {
      const date = new Date(item.datetime);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      item.datetime = `${hours}:${minutes}`;
    });

    const cheapestItem = parsedData.reduce((prev, current) => {
      return prev.value < current.value ? prev : current;
    });

    setEnergyCost(parsedData);
    setLoading(false);
    setCheapPrice(cheapestItem.value);
  };

  useEffect(() => {
    setLoading(true);
    fetchEnergyCost();
  }, []);

  return {
    energyCost,
    loading,
    cheapPrice,
    timeoutFlag,
    fetchEnergyCost,
    noData,
  };
};
