/* eslint-disable react/prop-types */
import { useState } from "react";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import ShareIcon from "@mui/icons-material/ShareOutlined";
import CheckIcon from "@mui/icons-material/Check";

import { EmptyState } from "../../components/StateViews";
import BoltMascot from "../../components/BoltMascot";
import { shareText } from "../../utils/share";
import { t } from "../../i18n";

/** Color de cada tono; el texto dice siempre qué significa, el color solo lo refuerza. */
const TONES = {
  success: "price.cheapest",
  warning: "price.medium",
  danger: "price.high",
  info: "text.secondary",
};
const toneOf = (insight) => TONES[insight.tone] ?? TONES.info;

/** Ánimo del rayo según el veredicto del día. */
const MOOD_BY_LEVEL = { cheap: "happy", expensive: "sad", normal: "neutral", unknown: "unknown" };

const Dot = ({ color }) => (
  <Box
    component="span"
    aria-hidden="true"
    sx={{ display: "inline-block", flexShrink: 0, width: 8, height: 8, borderRadius: "50%", bgcolor: color, mr: 0.75 }}
  />
);

function GroupTitle({ children }) {
  return (
    <Typography variant="body1" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
      {children}
    </Typography>
  );
}

/** Lo que conviene hacer ahora mismo, como una frase destacada (sin caja). */
function NowLead({ insight }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        <Dot color={toneOf(insight)} />
        {insight.kicker}
      </Typography>
      <Typography sx={{ mt: 0.25, fontSize: { xs: "1.125rem", sm: "1.25rem" }, fontWeight: 700, color: toneOf(insight) }}>
        {insight.title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.25 }}>
        {insight.body}
      </Typography>
    </Box>
  );
}

/**
 * Una franja horaria como fila de un panel: qué hacer (con su punto de color),
 * la hora grande, el detalle y, a la derecha, si ya empezó o falta poco.
 */
function MomentRow({ insight }) {
  const past = Boolean(insight.past);
  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "120px minmax(0, 1fr) auto" },
        columnGap: 2,
        rowGap: 0.25,
        alignItems: "baseline",
        py: 1.5,
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" component="h4" sx={{ fontWeight: 700, color: toneOf(insight), gridColumn: { xs: "1", sm: "auto" } }}>
        <Dot color={toneOf(insight)} />
        {insight.label}
      </Typography>
      <Box sx={{ minWidth: 0, gridColumn: { xs: "1 / -1", sm: "auto" }, gridRow: { xs: 2, sm: "auto" } }}>
        <Typography
          className="tabular"
          sx={{
            fontSize: insight.when.length > 16 ? "1.0625rem" : { xs: "1.375rem", sm: "1.5rem" },
            fontWeight: 700,
            lineHeight: 1.25,
            // Una franja que ya pasó se queda como referencia, no como consejo.
            color: past ? "text.secondary" : "text.primary",
          }}
        >
          {insight.when}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="tabular">
          {insight.detail}
        </Typography>
      </Box>
      {insight.status ? (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", gridColumn: { xs: "2", sm: "auto" }, gridRow: { xs: 1, sm: "auto" } }}>
          {insight.status}
        </Typography>
      ) : (
        <Box />
      )}
    </Box>
  );
}

/** Contexto sin acción inmediata: una fila por dato, sin icono. */
function FactRow({ insight }) {
  return (
    <Box component="li" sx={{ py: 1.25, borderTop: 1, borderColor: "divider" }}>
      <Typography variant="body2" component="h4" sx={{ fontWeight: 600 }}>
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
  );
}

/**
 * Compartir el resumen del día ("Hoy es un día caro. Evita 18:00 – 21:00…"):
 * pensado para avisar a la familia por WhatsApp. En escritorio se copia.
 */
function ShareDayButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="small"
      startIcon={copied ? <CheckIcon /> : <ShareIcon />}
      onClick={async () => {
        const result = await shareText({ title: t("tips.plan.shareTitle"), text });
        if (result === "copied") {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }}
      sx={{ flexShrink: 0, alignSelf: "flex-start" }}
    >
      {copied ? t("common.actions.copied") : t("common.actions.share")}
    </Button>
  );
}

/** Cómo es el día frente a la semana anterior, con el rayo poniéndole cara. */
function VerdictHeader({ verdict, whenLabel, loadingBaseline, share }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      {/* key: al cambiar de veredicto (otro día) el rayo vuelve a animarse */}
      <BoltMascot key={verdict.level} mood={MOOD_BY_LEVEL[verdict.level] ?? "unknown"} size={64} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {t(`tips.plan.title.${whenLabel}`)}
        </Typography>
        <Typography
          variant="h2"
          component="h2"
          id="tips-heading"
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, letterSpacing: "-0.01em", lineHeight: 1.2 }}
        >
          {verdict.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.25 }}>
          {loadingBaseline ? <Skeleton width={260} /> : verdict.body}
        </Typography>
      </Box>
      {share && (
        <Box sx={{ ml: "auto !important", display: { xs: "none", sm: "block" } }}>
          <ShareDayButton text={share} />
        </Box>
      )}
    </Stack>
  );
}

/**
 * "Qué hacer hoy" como un texto que se lee de arriba abajo, sin cajas: cómo es
 * el día, lo que conviene ahora, las franjas del día como un panel de horas y
 * el contexto en filas. `aside` es una fila extra al final del contexto (el
 * apunte de mañana); llega ya montada.
 */
export function DayPlan({ insights, whenLabel, verdict, loadingBaseline, aside = null, share = null }) {
  const now = insights.find((insight) => insight.kind === "now");
  const moments = insights.filter((insight) => insight.kind === "moment");
  const facts = insights.filter((insight) => insight.kind === "fact");

  return (
    <Box component="section" aria-labelledby="tips-heading">
      {verdict ? (
        <VerdictHeader verdict={verdict} whenLabel={whenLabel} loadingBaseline={loadingBaseline} share={share} />
      ) : (
        <Typography variant="h2" component="h2" id="tips-heading">
          {t(`tips.plan.title.${whenLabel}`)}
        </Typography>
      )}

      {!insights.length ? (
        <Box sx={{ mt: 3 }}>
          <EmptyState pose="normal" title={t("tips.plan.emptyTitle")} description={t("tips.plan.emptyBody")} />
        </Box>
      ) : (
        <Stack spacing={3.5} sx={{ mt: 3 }}>
          {now && <NowLead insight={now} />}

          {moments.length > 0 && (
            <Box>
              <GroupTitle>{t("tips.plan.moments")}</GroupTitle>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
                {moments.map((insight) => (
                  <MomentRow key={insight.id} insight={insight} />
                ))}
              </Box>
            </Box>
          )}

          {share && (
            <Box sx={{ display: { xs: "block", sm: "none" }, mt: "8px !important" }}>
              <ShareDayButton text={share} />
            </Box>
          )}

          {(facts.length > 0 || aside) && (
            <Box>
              <GroupTitle>{t("tips.plan.facts")}</GroupTitle>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
                {facts.map((insight) => (
                  <FactRow key={insight.id} insight={insight} />
                ))}
              </Box>
              {aside && <Box sx={{ borderTop: 1, borderColor: "divider" }}>{aside}</Box>}
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default DayPlan;
