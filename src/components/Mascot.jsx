/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import jump from "../assets/mascot/mascot-jump.webp";
import land from "../assets/mascot/mascot-land.webp";
import thumbs from "../assets/mascot/mascot-thumbs.webp";

/**
 * El rayo de la marca: salta, aterriza con chispas y levanta el pulgar.
 *
 * Los tres fotogramas salen de `public/sprites/frame {1,2,3}.png` (1122×1402,
 * ~0,9 MB cada uno), reducidos a 320×400 en WebP (~30 KB). Comparten lienzo,
 * así que se apilan sin recolocar nada. La animación son dos capas de CSS:
 *
 *  - el fotograma que se ve en cada tramo (cambio brusco, sin fundido, como en
 *    una animación dibujada a mano), y
 *  - el movimiento del cuerpo (salto, aplastamiento al caer, pequeño rebote),
 *    que es lo que hace que tres dibujos parezcan un movimiento continuo.
 *
 * Es decorativo (`aria-hidden`): no aporta información que no esté ya en el
 * texto. Se reproduce una vez, no en bucle, y se repite cuando cambia
 * `playKey` (la cabecera lo usa para que reaccione al cambiar de pestaña).
 * Sin animación se queda en el pulgar arriba, que es también lo que deja
 * `prefers-reduced-motion` (ver `index.css`).
 */

const DURATION = "1.8s";

// El cuerpo. `transform-origin` en los pies para que el aplastamiento al
// aterrizar se vea apoyado en el suelo y no desde el centro.
const hop = keyframes`
  0%   { transform: translateY(8%) rotate(0deg) scale(1.05, 0.93); }
  12%  { transform: translateY(-14%) rotate(-5deg) scale(0.98, 1.04); }
  28%  { transform: translateY(-20%) rotate(4deg) scale(1, 1); }
  38%  { transform: translateY(-4%) rotate(0deg) scale(1, 1.03); }
  42%  { transform: translateY(0) rotate(0deg) scale(1.1, 0.87); }
  52%  { transform: translateY(0) rotate(0deg) scale(0.97, 1.04); }
  60%  { transform: translateY(0) rotate(0deg) scale(1, 1); }
  74%  { transform: translateY(-6%) rotate(-3deg) scale(1.03, 1.03); }
  88%  { transform: translateY(0) rotate(0deg) scale(1, 1); }
  100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
`;

// Qué dibujo se ve en cada tramo: salto (0-38 %), aterrizaje (38-60 %), pulgar.
const showJump = keyframes`
  0%   { opacity: 1; }
  38%  { opacity: 0; }
  100% { opacity: 0; }
`;
const showLand = keyframes`
  0%   { opacity: 0; }
  38%  { opacity: 1; }
  60%  { opacity: 0; }
  100% { opacity: 0; }
`;
const showThumbs = keyframes`
  0%   { opacity: 0; }
  60%  { opacity: 1; }
  100% { opacity: 1; }
`;

const FRAMES = [
  { src: jump, name: showJump, rest: 0 },
  { src: land, name: showLand, rest: 0 },
  { src: thumbs, name: showThumbs, rest: 1 },
];

/** `size` es el alto en px (o un objeto responsive de `sx`); el ancho sale de la proporción 4:5. */
export function Mascot({ size = 44, playKey, sx }) {
  const ref = useRef(null);
  const firstRender = useRef(true);

  // Reiniciar la animación sin desmontar las imágenes (desmontarlas podría
  // dejar un parpadeo mientras el navegador las vuelve a pintar).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    ref.current
      ?.getAnimations?.({ subtree: true })
      .forEach((animation) => {
        animation.cancel();
        animation.play();
      });
  }, [playKey]);

  return (
    <Box
      ref={ref}
      aria-hidden="true"
      sx={{
        position: "relative",
        flexShrink: 0,
        height: size,
        aspectRatio: "4 / 5",
        transformOrigin: "50% 100%",
        animation: `${hop} ${DURATION} cubic-bezier(0.3, 0.7, 0.4, 1) both`,
        pointerEvents: "none",
        userSelect: "none",
        ...sx,
      }}
    >
      {FRAMES.map(({ src, name, rest }) => (
        <Box
          key={src}
          component="img"
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: rest,
            animation: `${name} ${DURATION} step-end both`,
          }}
        />
      ))}
    </Box>
  );
}

export default Mascot;
