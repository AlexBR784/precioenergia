/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import BoltMascot from "./BoltMascot";

/**
 * El rayo de la marca en la cabecera: el mismo `BoltMascot` del veredicto del
 * día, con cara tranquila y quieto, para que toda la app hable con un solo
 * personaje. El favicon y los iconos de la app salen del mismo dibujo
 * (`design/mascota/iconos.py`).
 *
 * Al cargar la página da un saltito y se queda quieto. Solo una vez: si
 * saltara en cada cambio de sección, con la barra de navegación y el
 * contenido moviéndose a la vez, sería ruido de reojo. Decorativo y quieto con
 * `prefers-reduced-motion`.
 */

const hop = keyframes`
  0%   { transform: translateY(18%) scale(1.08, 0.9); opacity: 0; }
  25%  { transform: translateY(-14%) rotate(-6deg) scale(0.97, 1.05); opacity: 1; }
  50%  { transform: translateY(0) rotate(0deg) scale(1.08, 0.92); }
  70%  { transform: translateY(-4%) scale(0.99, 1.02); }
  100% { transform: translateY(0) scale(1, 1); }
`;

// Una sola vez por carga de la página, aunque la cabecera se vuelva a montar.
let played = false;

/** `size` es el alto en px (o un objeto responsive de `sx`). */
export function Mascot({ size = 40 }) {
  const [animate] = useState(!played);
  // En un efecto y no al pintar: en modo estricto React pinta dos veces.
  useEffect(() => {
    played = true;
  }, []);

  return (
    <Box
      sx={{
        flexShrink: 0,
        transformOrigin: "50% 100%",
        animation: animate ? `${hop} 900ms cubic-bezier(0.3, 0.7, 0.4, 1) 150ms both` : "none",
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <BoltMascot mood="neutral" size={size} animate={false} />
    </Box>
  );
}

export default Mascot;
