import { useCallback, useEffect, useState } from "react";

/**
 * Ubicación del usuario para "Cerca de mí".
 *
 * Las coordenadas se quedan en el navegador: no se envían a ningún servidor
 * (solo se usan para elegir provincia y calcular distancias) y no se guardan
 * en `localStorage`. Se recuerdan unos minutos en memoria porque la pestaña se
 * desmonta al cambiar de sección y no se debe volver a preguntar.
 */

const POSITION_TTL_MS = 10 * 60_000;
const GEO_TIMEOUT_MS = 10_000;

let remembered = null; // { position: { lat, lon }, at }

const rememberedPosition = () =>
  remembered && Date.now() - remembered.at < POSITION_TTL_MS
    ? remembered.position
    : null;

const supported = () =>
  typeof navigator !== "undefined" && "geolocation" in navigator;

/** Estados: idle | loading | granted | denied | unavailable | error */
export const useGeolocation = () => {
  const [state, setState] = useState(() => {
    const position = rememberedPosition();
    return {
      status: position ? "granted" : supported() ? "idle" : "unavailable",
      position,
    };
  });

  const request = useCallback(() => {
    if (!supported()) {
      setState({ status: "unavailable", position: null });
      return;
    }

    setState((prev) => ({ ...prev, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lon: coords.longitude };
        remembered = { position, at: Date.now() };
        setState({ status: "granted", position });
      },
      (error) => {
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          position: null,
        });
      },
      // Basta con una posición aproximada: se usa para elegir provincia y
      // ordenar por distancia, y la de red es mucho más rápida que el GPS.
      { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: 5 * 60_000 }
    );
  }, []);

  const clear = useCallback(() => {
    remembered = null;
    setState({ status: supported() ? "idle" : "unavailable", position: null });
  }, []);

  return { ...state, request, clear };
};

/**
 * ¿El usuario ya dio permiso antes? Permite recuperar el modo "Cerca de mí"
 * al volver a la pestaña sin que el navegador lo vuelva a preguntar de golpe.
 */
export const useGeolocationGranted = () => {
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    let active = true;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((result) => {
        if (active) setGranted(result.state === "granted");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return granted;
};

export default useGeolocation;
