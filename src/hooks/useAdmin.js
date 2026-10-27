import { useCallback, useEffect, useState } from "react";

/**
 * Modo mantenimiento, solo para quien gestiona la web.
 *
 * La página vive en `#mantenimiento` y no se enlaza desde ningún sitio. Al
 * abrirla una vez, el dispositivo queda marcado como "admin" y la cabecera
 * enseña un aviso con las tareas pendientes cada vez que se entra. No es un
 * secreto (es una web estática, sin cuentas): solo evita que los visitantes lo
 * vean, y lo que muestra son fechas públicas del BOE.
 */

export const MAINTENANCE_HASH = "#mantenimiento";
const ADMIN_KEY = "precioenergia:admin";
const ACK_KEY = "precioenergia:admin-ack";

const readFlag = () => {
  try {
    return window.localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
};

const readAck = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACK_KEY));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const write = (key, value) => {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Sin localStorage el modo admin dura lo que la pestaña.
  }
};

const isMaintenanceHash = () => window.location.hash === MAINTENANCE_HASH;

// La cabecera (aviso) y la página leen lo mismo: el cambio se reparte sin props.
const listeners = new Set();
const snapshot = () => ({ isAdmin: readFlag() || isMaintenanceHash(), open: isMaintenanceHash(), acknowledged: readAck() });
const notify = () => {
  const next = snapshot();
  listeners.forEach((listener) => listener(next));
};

export const useAdmin = () => {
  const [state, setState] = useState(snapshot);

  useEffect(() => {
    listeners.add(setState);
    const onHash = () => {
      // Entrar en la página marca este dispositivo como el del admin.
      if (isMaintenanceHash()) write(ADMIN_KEY, "1");
      notify();
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => {
      listeners.delete(setState);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const acknowledge = useCallback((id, due) => {
    write(ACK_KEY, JSON.stringify({ ...readAck(), [id]: due }));
    notify();
  }, []);

  const unacknowledge = useCallback((id) => {
    const next = readAck();
    delete next[id];
    write(ACK_KEY, JSON.stringify(next));
    notify();
  }, []);

  const close = useCallback(() => {
    if (isMaintenanceHash()) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    notify();
  }, []);

  /** Deja de enseñar el aviso en este dispositivo. */
  const forget = useCallback(() => {
    write(ADMIN_KEY, null);
    write(ACK_KEY, null);
    close();
  }, [close]);

  return { ...state, acknowledge, unacknowledge, close, forget };
};

export default useAdmin;
