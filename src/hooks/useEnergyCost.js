import { useState, useEffect } from "react";
import axios from "axios";

export const useEnergyCost = () => {
  const [energyCost, setEnergyCost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cheapPrice, setCheapPrice] = useState(null);
  const [timeoutFlag, setTimeoutFlag] = useState(false);

  useEffect(() => {
    async function fetchEnergyCost() {
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
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
        console.log(e);
        setTimeoutFlag(true);
        return;
      }

      const parsedData = response.data.included[0].attributes.values;

      parsedData.forEach((item) => {
        const date = new Date(item.datetime);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        item.datetime = `${hours}:${minutes}`;
      });
      const isCheap = parsedData.filter((item) => item.percentage < 0.55);

      setEnergyCost(parsedData);
      setLoading(false);

      if (isCheap.length > 0) {
        const cheaper = isCheap.reduce((prev, current) => {
          return prev.value < current.value ? prev : current;
        });
        setCheapPrice(cheaper.value);
      }
    }
    setLoading(true);
    fetchEnergyCost();
  }, []);

  return { energyCost, loading, cheapPrice, timeoutFlag };
};
