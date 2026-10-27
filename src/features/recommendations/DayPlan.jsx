/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import TipsIcon from "@mui/icons-material/EmojiObjectsOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import EuroSymbolIcon from "@mui/icons-material/EuroSymbol";
import WbSunnyIcon from "@mui/icons-material/WbSunnyOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import EventIcon from "@mui/icons-material/EventOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { EmptyState } from "../../components/StateViews";
import MoodFace from "./MoodFace";

/**
 * El mapa de iconos vive aquí y no en `dayInsights.js`: la lógica solo emite
 * una clave, y así se mantiene libre de JSX.
 */
const ICONS = {
  best: CheckCircleOutlineIcon,
  avoid: BlockIcon,
  money: EuroSymbolIcon,
  solar: WbSunnyIcon,
  clock: ScheduleIcon,
  flat: HorizontalRuleIcon,
  calendar: EventIcon,
  info: InfoOutlinedIcon,
};

/** Cada tono lleva color de icono y fondo tenue; el texto dice siempre qué significa. */
const TONES = {
  success: { color: "price.cheapest", bg: "priceSoft.cheapest" },
  warning: { color: "price.medium", bg: "priceSoft.medium" },
  danger: { color: "price.high", bg: "priceSoft.high" },
  info: { color: "primary.main", bg: "primarySoft" },
};

const toneOf = (insight) => TONES[insight.tone] ?? TONES.info;
const iconOf = (insight) => ICONS[insight.icon] ?? ICONS.info;

function GroupLabel({ children }) {
  return (
    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.25 }}>
      {children}
    </Typography>
  );
}

/** Lo que conviene hacer ahora mismo: el titular, con su tono de fondo. */
function NowLead({ insight }) {
  const tone = toneOf(insight);
  const Icon = iconOf(insight);

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
      sx={{ p: { xs: 1.75, sm: 2 }, borderRadius: 2, bgcolor: tone.bg }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: "background.paper",
          color: tone.color,
        }}
      >
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ color: tone.color }}>
          {insight.kicker}
        </Typography>
        <Typography variant="h3" component="p" sx={{ fontSize: "1.0625rem", mt: 0.25 }}>
          {insight.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {insight.body}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * Una franja horaria. La hora va grande porque es lo que se busca con la
 * vista; la etiqueta dice qué hacer con ella y el detalle, por qué.
 */
function MomentTile({ insight }) {
  const tone = toneOf(insight);
  const Icon = iconOf(insight);
  const past = insight.status === "Ya ha pasado";
  // Varios tramos sueltos ("01:00–04:00 y 13:00–16:00") no caben en grande.
  const longWhen = insight.when.length > 16;

  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        p: 2,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, color: tone.color }}>
          <Icon sx={{ fontSize: 18 }} aria-hidden="true" />
          <Typography variant="subtitle2" component="h3" noWrap sx={{ color: "inherit" }}>
            {insight.label}
          </Typography>
        </Stack>
        {insight.status && (
          <Chip
            size="small"
            variant="outlined"
            label={insight.status}
            sx={{ height: 22, fontSize: "0.75rem", borderColor: "divider", color: "text.secondary" }}
          />
        )}
      </Stack>

      <Typography
        className="tabular"
        sx={{
          mt: 1,
          fontSize: longWhen ? "1.125rem" : { xs: "1.5rem", sm: "1.625rem" },
          fontWeight: 700,
          lineHeight: 1.2,
          // Una franja que ya pasó se queda como referencia, no como consejo.
          color: past ? "text.secondary" : "text.primary",
        }}
      >
        {insight.when}
      </Typography>
      <Typography variant="body2" color="text.secondary" className="tabular" sx={{ mt: 0.5 }}>
        {insight.detail}
      </Typography>

    </Box>
  );
}

/** Contexto sin acción inmediata: una fila compacta por dato. */
function FactRow({ insight }) {
  const Icon = iconOf(insight);

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1.5 }}>
      <Icon aria-hidden="true" sx={{ fontSize: 20, mt: "1px", color: "text.secondary" }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" component="h3" sx={{ fontWeight: 600 }}>
          {insight.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {insight.body}
        </Typography>
        {insight.note && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {insight.note}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/**
 * "Qué hacer hoy" como un plan en una sola tarjeta, de lo general a lo concreto:
 *
 *  0. Cabecera: cómo es el día frente a la semana anterior, con la carita.
 *  1. Ahora: lo que conviene hacer en este momento (si se mira hoy).
 *  2. Momentos del día: las franjas concretas, con la hora como protagonista.
 *  3. Para tener en cuenta: el contexto, en filas compactas.
 *
 * Antes eran cinco o seis tarjetas iguales en rejilla: todas pesaban lo mismo,
 * las alturas no casaban y el título repetía la hora que había que buscar
 * dentro del texto. Ordenar por "cuándo actúo" deja claro qué leer primero.
 */
/** Humor de la carita según el veredicto del día. */
const MOOD_BY_LEVEL = { cheap: "happy", expensive: "sad", normal: "neutral", unknown: "unknown" };

/**
 * Cabecera del plan: cómo es el día frente a la semana anterior, con la carita.
 *
 * Antes era una tarjeta suelta encima del plan, con la media del día en grande
 * (la misma cifra que la cabecera de Precios). Aquí abre el plan: primero cómo
 * es el día y después qué hacer, en una sola tarjeta.
 */
function VerdictHeader({ verdict, whenLabel, loadingBaseline }) {
  return (
    <Stack direction="row" spacing={1.75} alignItems="center" sx={{ mb: 2.5 }}>
      {/* key: al cambiar de veredicto (otro día) la carita vuelve a animarse */}
      <MoodFace key={verdict.level} mood={MOOD_BY_LEVEL[verdict.level] ?? "unknown"} size={52} />
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
          <TipsIcon sx={{ fontSize: 16 }} aria-hidden="true" />
          <Typography variant="subtitle2" sx={{ color: "inherit" }}>
            Qué hacer {whenLabel}
          </Typography>
        </Stack>
        <Typography
          variant="h2"
          component="h2"
          id="tips-heading"
          sx={{ fontSize: { xs: "1.25rem", sm: "1.375rem" }, mt: 0.25 }}
        >
          {verdict.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {loadingBaseline ? <Skeleton width={260} /> : verdict.body}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * `aside` es una fila extra al final de "Para tener en cuenta" (el apunte de
 * mañana); se pasa ya montada para que el plan no sepa de dónde sale.
 */
export function DayPlan({ insights, whenLabel, verdict, loadingBaseline, aside = null }) {
  const now = insights.find((insight) => insight.kind === "now");
  const moments = insights.filter((insight) => insight.kind === "moment");
  const facts = insights.filter((insight) => insight.kind === "fact");

  return (
    <Card component="section" aria-labelledby="tips-heading">
      <CardContent>
        {verdict ? (
          <VerdictHeader verdict={verdict} whenLabel={whenLabel} loadingBaseline={loadingBaseline} />
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <TipsIcon fontSize="small" color="primary" aria-hidden="true" />
            <Typography variant="h2" component="h2" id="tips-heading">
              Qué hacer {whenLabel}
            </Typography>
          </Stack>
        )}

        {!insights.length ? (
          <EmptyState
            title="Nada que destacar"
            description="Los precios de este día no dan pie a ninguna recomendación concreta."
          />
        ) : (
          <Stack spacing={3}>
            {now && <NowLead insight={now} />}

            {moments.length > 0 && (
              <Box>
                <GroupLabel>Momentos del día</GroupLabel>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: `repeat(${Math.min(moments.length, 3)}, minmax(0, 1fr))`,
                    },
                  }}
                >
                  {moments.map((insight) => (
                    <MomentTile key={insight.id} insight={insight} />
                  ))}
                </Box>
              </Box>
            )}

            {(facts.length > 0 || aside) && (
              <Box>
                <GroupLabel>Para tener en cuenta</GroupLabel>
                <Stack divider={<Divider flexItem />} sx={{ mt: -1.5 }}>
                  {facts.map((insight) => (
                    <FactRow key={insight.id} insight={insight} />
                  ))}
                  {aside}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default DayPlan;
