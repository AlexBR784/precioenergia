/* eslint-disable react/prop-types */
import { useId } from "react";
import { Box } from "@mui/material";
import { keyframes, useTheme } from "@mui/material/styles";

import { palette } from "../theme/tokens";

/**
 * El rayo de la marca en estilo plano, dibujado en SVG (prototipo en
 * `design/mascota/proto/sheet.png`). Es la única mascota de la app: cabecera,
 * veredicto del día, avisos de vacío y error y el recorrido. El favicon y los
 * iconos salen de este mismo dibujo (`design/mascota/iconos.py`).
 *
 * Mismo lenguaje que la interfaz: el dorado de la paleta (`secondary`), la
 * tinta azul marino de los textos para el contorno y la cara, línea uniforme
 * y sin brillos. El dorado se lee solo sobre fondo claro y oscuro, así que el
 * cuerpo no necesita contorno de pegatina; los brazos y piernas, que son de
 * tinta, sí llevan un halo claro en el tema oscuro.
 *
 * Una sola silueta para todo. Lo que cambia es la cara (`mood`: ojos, cejas y
 * boca, por piezas para poder animarlas) y, si se pide, una pose (`pose`):
 * piernas, brazos y algún objeto (lupa, enchufe…).
 *
 * Se anima una sola vez al aparecer (y al cambiar de ánimo, con `key`): entra
 * con un rebote, la boca se dibuja, parpadea y hace un gesto propio de su
 * humor. Luego se queda quieto: un gesto en bucle al lado de los datos
 * distraería. Decorativo (`aria-hidden`); el texto de al lado ya lo dice. Con
 * movimiento reducido aparece directamente en su estado final.
 */

const INK = palette.light.primary;
const SWEAT = palette.light.price.low;
const SPARK = palette.light.price.high;
const GLASS = palette.light.priceSoft.low;
const BLUSH = "#F2A7A0";

/** Silueta: rayo achatado, inclinado a la derecha, esquinas redondeadas. */
const BODY =
  "M18.9 12 L50.1 5.8 Q54 5 52.7 8.8 L46.5 27.6 Q46 29 47.5 29.3 L54.5 30.5 Q57.5 31 55.7 33.4 " +
  "L41 53.5 Q38 57.5 33.1 58.5 L21.9 60.7 Q18 61.5 18.1 57.5 L18.4 48.5 Q18.5 47 17 46.8 " +
  "L8 45.4 Q5 45 5.8 42.1 L12.6 17.8 Q14 13 18.9 12 Z";
/** Cantos de la derecha: una banda más oscura (recortada por la silueta) da volumen sin degradados. */
const SHADE = "M54 5 L46 29 L57.5 31 L38 57.5";

const pop = keyframes`
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;
const draw = keyframes`
  from { stroke-dashoffset: 30; }
  to   { stroke-dashoffset: 0; }
`;
const blink = keyframes`
  0%, 30%, 36%, 70%, 76%, 100% { transform: scaleY(1); }
  33%, 73% { transform: scaleY(0.1); }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const drip = keyframes`
  0%   { transform: translateY(-3px); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: translateY(1px); opacity: 1; }
`;
const floatUp = keyframes`
  0%   { transform: translateY(3px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;
const flicker = keyframes`
  0%, 40%, 80% { opacity: 1; }
  20%, 60% { opacity: 0.15; }
  100% { opacity: 1; }
`;
const waveArm = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20%, 60% { transform: rotate(14deg); }
  40%, 80% { transform: rotate(-8deg); }
`;

// Gestos de cada humor
const hop = keyframes`
  0%, 100% { transform: translateY(0); }
  20% { transform: translateY(-4px); }
  40% { transform: translateY(0); }
  60% { transform: translateY(-3px); }
  80% { transform: translateY(0); }
`;
const shake = keyframes`
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(-7deg); }
  35% { transform: rotate(6deg); }
  55% { transform: rotate(-4deg); }
  75% { transform: rotate(2deg); }
`;
const glance = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1.5px); }
  50% { transform: translateX(1.5px); }
  75% { transform: translateX(0); }
`;
const tilt = keyframes`
  0%, 100% { transform: rotate(0deg); }
  40%, 70% { transform: rotate(-9deg); }
`;
const doze = keyframes`
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(4deg); }
`;

const OVAL_EYES = [
  { cx: 19, cy: 31 },
  { cx: 34, cy: 31 },
];

/**
 * Las caras. `eyes`: "oval" (abiertos, parpadean) o caminos (cerrados);
 * `brows` y `mouth`: caminos de trazo.
 */
const MOODS = {
  happy: {
    eyes: ["M16.4 32 Q19 28.6 21.6 32", "M31.4 32 Q34 28.6 36.6 32"],
    brows: ["M16.5 23.2 Q19 21.4 21.5 22.8", "M31.5 22.8 Q34 21.4 36.5 23.2"],
    mouth: "M21.6 37.4 Q26.8 44 32 37.4",
    blush: true,
    gesture: hop,
  },
  neutral: {
    eyes: "oval",
    brows: ["M16.5 23.6 Q19 22 21.5 23.2", "M31.5 23.2 Q34 22 36.5 23.6"],
    mouth: "M23.4 38.8 Q26.8 41 30.2 38.8",
    gesture: glance,
    gestureOnEyes: true,
  },
  sad: {
    eyes: "oval",
    // Preocupado: el extremo interior de las cejas, más alto.
    brows: ["M16 24.6 L21.5 22.4", "M31.5 22.4 L37 24.6"],
    mouth: "M21.8 40.4 Q23.6 38.4 25.4 40.4 T29 40.4 T32.6 40.4",
    sweat: true,
    gesture: shake,
  },
  unknown: {
    eyes: "oval",
    // Duda: una ceja arriba y la otra recta.
    brows: ["M16.5 21.8 Q19 19.8 21.5 21", "M31.5 24.2 L36.5 24.2"],
    mouth: "M23.2 39.8 Q26 38.2 28.4 39.4 T32 38.6",
    gesture: tilt,
  },
  /** Como `sad` pero sin la gota: para lo que ha fallado, no para lo caro. */
  worried: {
    eyes: "oval",
    brows: ["M16 24.6 L21.5 22.4", "M31.5 22.4 L37 24.6"],
    mouth: "M21.8 40.4 Q23.6 38.4 25.4 40.4 T29 40.4 T32.6 40.4",
    gesture: shake,
  },
  sleepy: {
    eyes: ["M16.4 30.5 Q19 33 21.6 30.5", "M31.4 30.5 Q34 33 36.6 30.5"],
    brows: ["M16.5 24.6 Q19 23.6 21.5 24.4", "M31.5 24.4 Q34 23.6 36.5 24.6"],
    mouth: "M24.6 39.2 Q26.8 40.6 29 39.2",
    gesture: doze,
  },
};

/*
 * Poses: piezas de tinta (brazos, piernas, manos, pies) y objetos, en las
 * coordenadas del cuerpo (0–64 × 0–66). Se dibujan detrás del rayo: los
 * hombros y caderas empiezan dentro de la silueta y así quedan "pegados".
 * Cada grupo puede llevar su animación (el brazo que saluda, las chispas…).
 *
 * Piezas: `line` (trazo), `dot` (mano), `foot`, `lens` (lupa), `plug`.
 */
const LEGS = {
  items: [
    { line: "M24 57 Q23.5 64 22 69" },
    { line: "M32 55.5 Q33 63 34.5 68.5" },
    { foot: [20.5, 70.6] },
    { foot: [36.5, 70.1] },
  ],
};
const LEFT_ARM = { items: [{ line: "M11 34 Q5 39 4 46" }, { dot: [4, 47.6] }] };
const RIGHT_ARM = { items: [{ line: "M50 38 Q56 42 57 48" }, { dot: [57.2, 49.6] }] };

const POSES = {
  // De pie, tranquilo (recorrido: Precios).
  stand: { mood: "neutral", groups: [LEGS, LEFT_ARM, RIGHT_ARM] },
  // Contento, con los dos brazos arriba (recorrido: Carburantes).
  cheer: {
    mood: "happy",
    groups: [
      LEGS,
      { items: [{ line: "M11 32 Q4 28 3.4 19.6" }, { dot: [3.4, 17.6] }] },
      { items: [{ line: "M48 30 Q57 26 59 18" }, { dot: [59.6, 15.8] }] },
    ],
  },
  // Saluda (recorrido): brazo derecho arriba, moviéndose.
  wave: {
    mood: "happy",
    groups: [
      LEGS,
      LEFT_ARM,
      {
        items: [
          { line: "M48 30 Q58 26 61 16" },
          { dot: [61.6, 13.6] },
          { line: "M65.5 9 Q67.8 11.2 67.6 14.6", accent: SWEAT, width: 1.6 },
          { line: "M57.4 9.6 Q57.4 6.6 60 5.2", accent: SWEAT, width: 1.6 },
        ],
        origin: "0% 100%",
        animation: (run) => run(`${waveArm} 1.1s ease-in-out 0.5s 1 both`),
      },
    ],
  },
  // Señala hacia arriba (los filtros que faltan por elegir están encima).
  pointing: {
    mood: "neutral",
    groups: [
      LEGS,
      LEFT_ARM,
      { items: [{ line: "M48 31 Q57 28 61 19" }, { dot: [62, 17.2] }, { line: "M63.6 15 L66.4 10.6", width: 2.2 }] },
    ],
  },
  // Busca con la lupa (sin resultados).
  search: {
    mood: "unknown",
    groups: [
      LEGS,
      LEFT_ARM,
      { items: [{ line: "M50 38 Q57 41 60 38.2" }, { line: "M62.4 35.4 L65.2 29.6", width: 3 }, { lens: [68, 23.4, 6.4] }, { dot: [61.2, 37.2] }] },
    ],
  },
  // Con el enchufe desconectado en la mano (algo ha fallado).
  error: {
    mood: "worried",
    groups: [
      LEGS,
      RIGHT_ARM,
      {
        items: [
          { line: "M-4.5 37.5 Q-8 52 2 60 T14 71", width: 1.8 },
          { line: "M11 35 Q5 37 1.6 34" },
          { plug: [-7.2, 30.4] },
          { dot: [0.6, 33.8] },
        ],
      },
      {
        items: [
          { line: "M-11 26.6 L-12.4 24.2", accent: SPARK, width: 1.6 },
          { line: "M-7.6 25.6 L-7.6 23", accent: SPARK, width: 1.6 },
          { line: "M-13.6 30 L-16 29.2", accent: SPARK, width: 1.6 },
        ],
        animation: (run) => run(`${flicker} 0.9s linear 0.6s 1 both`),
      },
    ],
  },
  // Dormido (todavía no hay precios para ese día).
  sleep: {
    mood: "sleepy",
    groups: [
      LEGS,
      LEFT_ARM,
      RIGHT_ARM,
      {
        items: [
          { line: "M57.6 6.4 L61.6 6.4 L57.6 10.4 L61.6 10.4", width: 1.6, soft: true },
          { line: "M64 -1.2 L67.2 -1.2 L64 2 L67.2 2", width: 1.4, soft: true },
        ],
        animation: (run) => run(`${floatUp} 0.8s ease-out 0.6s both`),
      },
    ],
  },
  // Se encoge de hombros (nada que destacar).
  normal: {
    mood: "neutral",
    groups: [
      LEGS,
      { items: [{ line: "M11 33 Q4 33 1.4 27.4" }, { dot: [0.8, 25.4] }] },
      { items: [{ line: "M50 36 Q58 35 62 29.4" }, { dot: [62.8, 27.4] }] },
    ],
  },
};
/** Caja de las poses: el cuerpo más el sitio de brazos, piernas y objetos. */
const POSE_VIEW = "-17 -5 95 80";

const stroke = { stroke: INK, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
const LIMB = 2.6;

/** Dibuja una pieza; con `halo`, solo su contorno claro (tema oscuro). */
function Piece({ item, halo, haloColor, softInk }) {
  const extra = halo ? 2.4 : 0;
  const color = halo ? haloColor : INK;
  if (item.line) {
    // Los acentos de color y las "z" ya se ven en oscuro: sin halo.
    if (halo && (item.accent || item.soft)) return null;
    const ink = halo ? color : item.soft ? softInk : item.accent ?? INK;
    return <path d={item.line} {...stroke} stroke={ink} strokeWidth={(item.width ?? LIMB) + extra} />;
  }
  if (item.dot) {
    const [cx, cy] = item.dot;
    return <circle cx={cx} cy={cy} r={2.8 + extra / 2} fill={color} />;
  }
  if (item.foot) {
    const [cx, cy] = item.foot;
    return <ellipse cx={cx} cy={cy} rx={4 + extra / 2} ry={2.3 + extra / 2} fill={color} />;
  }
  if (item.lens) {
    const [cx, cy, r] = item.lens;
    return halo ? (
      <circle cx={cx} cy={cy} r={r + 1.2 + extra / 2} fill={color} />
    ) : (
      <circle cx={cx} cy={cy} r={r} fill={GLASS} stroke={INK} strokeWidth={2.4} />
    );
  }
  if (item.plug) {
    const [x, y] = item.plug;
    return halo ? (
      <rect x={x - 3.6} y={y - 1.2} width={9.6} height={8.4} rx={2.4} fill={color} />
    ) : (
      <g>
        <rect x={x} y={y} width={6} height={6} rx={1.6} fill={INK} />
        <path d={`M${x} ${y + 1.6} L${x - 2.6} ${y + 1.6} M${x} ${y + 4.4} L${x - 2.6} ${y + 4.4}`} {...stroke} strokeWidth={1.4} />
      </g>
    );
  }
  return null;
}

/**
 * `size`: alto en px (o un objeto responsive de `sx`). `mood`: cara. `pose`:
 * cuerpo entero con su cara propia (`mood` la cambia). `animate={false}` lo
 * pinta quieto (cabecera, iconos).
 */
export function BoltMascot({ mood, pose, size = 56, animate = true }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const posed = POSES[pose];
  const config = MOODS[mood ?? posed?.mood] ?? MOODS.neutral;
  const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  const run = (value) => (animate ? value : "none");
  const oval = config.eyes === "oval";
  // Un id por dibujo para el recorte (puede haber varios en la página).
  const clipId = `bolt-${useId().replace(/:/g, "")}`;
  const haloColor = theme.palette.text.secondary;
  const softInk = dark ? theme.palette.text.secondary : INK;

  const renderGroup = (group, index) => (
    <Box
      component="g"
      key={index}
      sx={{
        transformBox: "fill-box",
        transformOrigin: group.origin ?? "50% 50%",
        animation: group.animation ? group.animation(run) : "none",
      }}
    >
      {dark &&
        group.items.map((item, i) => (
          <Piece key={`h${i}`} item={item} halo haloColor={haloColor} softInk={softInk} />
        ))}
      {group.items.map((item, i) => (
        <Piece key={i} item={item} softInk={softInk} />
      ))}
    </Box>
  );
  const poseGroups = posed?.groups ?? [];

  return (
    <Box
      aria-hidden="true"
      sx={{
        flexShrink: 0,
        height: size,
        aspectRatio: posed ? "95 / 80" : "64 / 66",
        transformOrigin: "50% 90%",
        animation: run(`${pop} 0.45s ${ease} both`),
        // Con movimiento reducido, todo en su estado final y sin gestos.
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          "& *": { animation: "none !important" },
        },
      }}
    >
      <Box component="svg" viewBox={posed ? POSE_VIEW : "0 0 64 66"} sx={{ display: "block", width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <clipPath id={clipId}>
            <path d={BODY} />
          </clipPath>
        </defs>

        {/* Las piernas no se mueven con el gesto: los pies siguen en el suelo. */}
        {poseGroups.filter((group) => group === LEGS).map(renderGroup)}

        <Box
          component="g"
          sx={{
            transformBox: "fill-box",
            transformOrigin: "45% 90%",
            animation: run(config.gestureOnEyes ? "none" : `${config.gesture} 0.9s ease-in-out 0.7s 1 both`),
          }}
        >
          {poseGroups.filter((group) => group !== LEGS).map(renderGroup)}

          <path d={BODY} fill={theme.palette.secondary.main} />
          <path
            d={SHADE}
            clipPath={`url(#${clipId})`}
            stroke={theme.palette.secondary.dark}
            strokeWidth={9}
            strokeLinejoin="round"
            fill="none"
          />
          <path d={BODY} {...stroke} strokeWidth={3} />

          {config.blush && (
            <Box component="g" sx={{ animation: run(`${fadeIn} 0.4s ease 0.5s both`) }}>
              <ellipse cx="15" cy="37" rx="3" ry="1.8" fill={BLUSH} />
              <ellipse cx="38.5" cy="37" rx="3" ry="1.8" fill={BLUSH} />
            </Box>
          )}

          {config.brows.map((d) => (
            <path key={d} d={d} {...stroke} strokeWidth={2} />
          ))}

          {oval ? (
            <Box
              component="g"
              sx={{
                transformBox: "fill-box",
                transformOrigin: "50% 50%",
                animation: run(
                  `${blink} 3.2s linear 0.9s 1 both${
                    config.gestureOnEyes ? `, ${config.gesture} 1.4s ease-in-out 0.6s 1 both` : ""
                  }`
                ),
              }}
            >
              {OVAL_EYES.map(({ cx, cy }) => (
                <ellipse key={cx} cx={cx} cy={cy} rx="2.1" ry="3" fill={INK} />
              ))}
            </Box>
          ) : (
            config.eyes.map((d) => <path key={d} d={d} {...stroke} />)
          )}

          <Box
            component="path"
            d={config.mouth}
            {...stroke}
            sx={{ strokeDasharray: 30, animation: run(`${draw} 0.5s ${ease} 0.2s both`) }}
          />

          {config.sweat && (
            <Box
              component="path"
              d="M44 12.6 Q47.2 17.4 44 19.6 Q40.8 17.4 44 12.6 Z"
              fill={SWEAT}
              sx={{ animation: run(`${drip} 0.7s ease-out 0.8s both`) }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default BoltMascot;
