// Custom hook that uses the energy cost API to get the energy cost for today

import { useState, useEffect } from 'react';
import axios from 'axios';

export const useEnergyCost = () => {
    const [energyCost, setEnergyCost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cheapPrice, setCheapPrice] = useState(true);

    useEffect(() => {
        async function fetchEnergyCost() {

            const targetUrl = 'https://api.preciodelaluz.org/v1/prices/all?zone=PCB';

            const resp = await axios.get(targetUrl);

            const parsedData = [];
            const isCheap = [];

            // Loop through each item in the response and return the price
            Object.keys(resp.data).forEach((key) => {
                const item = resp.data[key];
                if (item['is-cheap']) {
                    isCheap.push(item)
                }
                // From the cheapest items, get the cheaper
                parsedData.push(item)

            });

            setEnergyCost(parsedData);
            setLoading(false);

            if (isCheap.length > 0) {
                const cheaper = isCheap.reduce((prev, current) => {
                    return (prev.price < current.price) ? prev : current
                });
                setCheapPrice(cheaper.price);
            }

        }
        setLoading(true);
        fetchEnergyCost();

    }, []);

    return { energyCost, loading, cheapPrice };
}