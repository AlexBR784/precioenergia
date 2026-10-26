/* eslint-disable react/prop-types */
import { Box } from "@mui/material";
import { keyframes, useTheme } from "@mui/material/styles";

/**
 * Carita que pone cara al veredicto del día: sonríe si es barato, se queja si
 * es caro, se encoge de hombros si es normal y duda si no hay referencia.
 *
 * Se anima una sola vez al aparecer (y al cambiar de veredicto): entra con un
 * pequeño rebote, la boca se dibuja, parpadea y hace un gesto propio de su
 * humor. Luego se queda quieta: un gesto en bucle al lado de los precios
 * distraería. Es decorativa (`aria-hidden`); el titular ya lo dice en texto.
 * Con movimiento reducido aparece directamente en su estado final.
 */

const pop = keyframes`
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const draw = keyframes`
  from { stroke-dashoffset: 40; }
  to   { stroke-dashoffset: 0; }
`;

const blink = keyframes`
  0%, 30%, 36%, 70%, 76%, 100% { transform: scaleY(1); }
  33%, 73% { transform: scaleY(0.1); }
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
  15% { transform: rotate(-8deg); }
  35% { transform: rotate(7deg); }
  55% { transform: rotate(-5deg); }
  75% { transform: rotate(3deg); }
`;

const glance = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(0); }
`;

const tilt = keyframes`
  0%, 100% { transform: rotate(0deg); }
  40%, 70% { transform: rotate(-10deg); }
`;

const MOODS = {
  happy: {
    color: (t) => t.palette.price.cheapest,
    mouth: "M15 28 Q24 37 33 28",
    gesture: hop,
  },
  sad: {
    color: (t) => t.palette.price.high,
    mouth: "M15 34 Q24 27 33 34",
    // Cejas de queja: el extremo interior más alto.
    brows: ["M13 16 L20 13", "M35 16 L28 13"],
    gesture: shake,
  },
  neutral: {
    color: (t) => t.palette.primary.main,
    mouth: "M16 31 L32 31",
    gesture: glance,
    gestureOnEyes: true,
  },
  unknown: {
    color: (t) => t.palette.text.secondary,
    mouth: "M16 31 Q20 28 24 31 T32 31",
    brows: ["M13 14 L20 15", "M28 12 L35 14"],
    gesture: tilt,
  },
};

export function MoodFace({ mood = "neutral", size = 48 }) {
  const theme = useTheme();
  const config = MOODS[mood] ?? MOODS.neutral;
  const color = config.color(theme);
  const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";

  return (
    <Box
      aria-hidden="true"
      sx={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: "background.paper",
        display: "grid",
        placeItems: "center",
        animation: `${pop} 0.45s ${ease} both`,
        // Con movimiento reducido, todo en su estado final y sin gestos.
        "@media (prefers-reduced-motion: reduce)": {
          animation: "none",
          "& *": { animation: "none !important" },
        },
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 48 48"
        sx={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          transformOrigin: "50% 50%",
          animation: config.gestureOnEyes
            ? "none"
            : `${config.gesture} 0.9s ease-in-out 0.7s 1 both`,
        }}
      >
        <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="2.5" />

        {config.brows?.map((d) => (
          <path key={d} d={d} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ))}

        <Box
          component="g"
          sx={{
            transformBox: "fill-box",
            transformOrigin: "50% 50%",
            animation: `${blink} 3.2s linear 0.9s 1 both${
              config.gestureOnEyes ? `, ${config.gesture} 1.4s ease-in-out 0.6s 1 both` : ""
            }`,
          }}
        >
          <circle cx="17" cy="21" r="2.6" fill={color} />
          <circle cx="31" cy="21" r="2.6" fill={color} />
        </Box>

        <Box
          component="path"
          d={config.mouth}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          sx={{
            strokeDasharray: 40,
            animation: `${draw} 0.5s ${ease} 0.2s both`,
          }}
        />
      </Box>
    </Box>
  );
}

export default MoodFace;
