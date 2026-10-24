/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import jump from "../assets/mascot/mascot-jump.webp";
import land from "../assets/mascot/mascot-land.webp";
import thumbs from "../assets/mascot/mascot-thumbs.webp";
import idle from "../assets/mascot/mascot-idle.webp";

/**
 * El rayo de la marca: salta, aterriza con chispas, levanta el pulgar y, ya
 * quieto, de vez en cuando lo mueve.
 *
 * Los fotogramas salen de `public/sprites/` (`frame {1,2,3}.png` y `idle 2.png`;
 * `idle 1.png` es idéntico al `frame 3.png`), 1122×1402 y ~0,9 MB cada uno,
 * reducidos a 320×400 en WebP (~30 KB). Comparten lienzo, así que se apilan sin
 * recolocar nada. La animación son dos capas de CSS:
 *
 *  - el fotograma que se ve en cada tramo (cambio brusco, sin fundido, como en
 *    una animación dibujada a mano), y
 *  - el movimiento del cuerpo (salto, aplastamiento al caer, pequeño rebote),
 *    que es lo que hace que unos pocos dibujos parezcan un movimiento continuo.
 *
 * Dos fases, ambas encadenadas con `animation-delay` sobre los mismos elementos:
 *
 *  1. Entrada (1,8 s): salto → aterrizaje → pulgar.
 *  2. Reposo: a los 3 s de la entrada, el pulgar "late" dos veces (pulgar ↔
 *     `idle 2`, con un botecito) y vuelve a quedarse quieto, `IDLE_BURSTS` veces.
 *
 * El reposo no es un bucle infinito a propósito: una animación que se mueve sin
 * parar al lado del contenido distrae de los precios y, pasados 5 s, las pautas
 * de accesibilidad (WCAG 2.2.2) piden poder pausarla. Con unas pocas ráfagas
 * suma ~25 s de vida y luego se queda en el pulgar; cambiar de pestaña
 * (`playKey`) lo vuelve a arrancar todo.
 *
 * Es decorativo (`aria-hidden`): no aporta información que no esté ya en el
 * texto. Sin animación se queda en el pulgar arriba, que es también lo que
 * deja `prefers-reduced-motion`.
 */

const DURATION = "1.8s";

const IDLE_START = "4.8s"; // 1,8 s de entrada + 3 s quieto
const IDLE_CYCLE = "6s"; // 0,84 s de ráfaga y el resto en reposo
const IDLE_BURSTS = 4;

// El cuerpo. `transform-origin` en los pies para que el aplastamiento al
// aterrizar se vea apoyado en el suelo y no desde el centro.
const hop = keyframes`
  0%   { transform: translateY(8%) rotate(0deg) scale(1.05, 0.93); }
  12%  { transform: translateY(-11%) rotate(-5deg) scale(0.98, 1.04); }
  28%  { transform: translateY(-16%) rotate(4deg) scale(1, 1); }
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

// Reposo: dos latidos seguidos (0-4 % y 10-14 % del ciclo) y el resto quieto.
const idleBody = keyframes`
  0%   { transform: translateY(-4%) rotate(0deg) scale(1.03, 0.98); }
  4%   { transform: translateY(0) rotate(0deg) scale(1, 1); }
  10%  { transform: translateY(-4%) rotate(0deg) scale(1.03, 0.98); }
  14%  { transform: translateY(0) rotate(0deg) scale(1, 1); }
  100% { transform: translateY(0) rotate(0deg) scale(1, 1); }
`;
const idleThumbs = keyframes`
  0%   { opacity: 0; }
  4%   { opacity: 1; }
  10%  { opacity: 0; }
  14%  { opacity: 1; }
  100% { opacity: 1; }
`;
const idleAlt = keyframes`
  0%   { opacity: 1; }
  4%   { opacity: 0; }
  10%  { opacity: 1; }
  14%  { opacity: 0; }
  100% { opacity: 0; }
`;

// `forwards` y no `both` en el reposo: con `both` el primer fotograma del
// reposo se aplicaría ya durante el retraso y taparía la entrada.
const idleRun = `${IDLE_CYCLE} step-end ${IDLE_START} ${IDLE_BURSTS} forwards`;

const FRAMES = [
  { src: jump, animation: `${showJump} ${DURATION} step-end both`, rest: 0 },
  { src: land, animation: `${showLand} ${DURATION} step-end both`, rest: 0 },
  {
    src: thumbs,
    animation: `${showThumbs} ${DURATION} step-end both, ${idleThumbs} ${idleRun}`,
    rest: 1,
  },
  { src: idle, animation: `${idleAlt} ${idleRun}`, rest: 0 },
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
        animation: `${hop} ${DURATION} cubic-bezier(0.3, 0.7, 0.4, 1) both, ${idleBody} ${IDLE_CYCLE} ease-out ${IDLE_START} ${IDLE_BURSTS} forwards`,
        pointerEvents: "none",
        userSelect: "none",
        // Con movimiento reducido no hay animación alguna: pulgar arriba fijo.
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          "& img": { animation: "none" },
        },
        ...sx,
      }}
    >
      {FRAMES.map(({ src, animation, rest }) => (
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
            animation,
          }}
        />
      ))}
    </Box>
  );
}

export default Mascot;
