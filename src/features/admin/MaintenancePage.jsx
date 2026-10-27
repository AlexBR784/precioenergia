/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/BuildOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useAdmin } from "../../hooks/useAdmin";
import { useNow } from "../../hooks/useNow";
import { BOE_SEARCH_URL, SOON_DAYS, maintenanceTasks, pendingCount } from "./maintenance";

const STATUS = {
  overdue: { label: "Pendiente", color: "price.high", bg: "priceSoft.high" },
  soon: { label: "Pronto", color: "price.medium", bg: "priceSoft.medium" },
  ok: { label: "Al día", color: "text.secondary", bg: "surfaceMuted" },
  done: { label: "Mirado", color: "price.cheapest", bg: "priceSoft.cheapest" },
};

const ORDER = { overdue: 0, soon: 1, ok: 2, done: 3 };

const longDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

const whenText = (task) => {
  if (!task.due) return "Sin fecha prevista";
  if (task.days === 0) return `Toca hoy (${longDate(task.due)})`;
  if (task.days < 0) return `Tocaba el ${longDate(task.due)} (hace ${-task.days} ${task.days === -1 ? "día" : "días"})`;
  return `Toca el ${longDate(task.due)} (en ${task.days} ${task.days === 1 ? "día" : "días"})`;
};

function CopyTerm({ term }) {
  const [copied, setCopied] = useState(false);
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Typography variant="body2" component="code" sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: "surfaceMuted" }}>
        {term}
      </Typography>
      <Tooltip title={copied ? "Copiado" : "Copiar"}>
        <IconButton
          size="small"
          aria-label={`Copiar «${term}»`}
          onClick={() =>
            navigator.clipboard?.writeText(term).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function TaskCard({ task, onAcknowledge, onUndo }) {
  const status = STATUS[task.status];
  return (
    <Card component="article" sx={{ borderLeft: 4, borderLeftColor: status.color }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Typography variant="h3" component="h2">
            {task.title}
          </Typography>
          <Chip
            size="small"
            label={status.label}
            sx={{ fontWeight: 700, color: status.color, bgcolor: status.bg }}
          />
        </Stack>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
          {whenText(task)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Ahora en la web: {task.current}
        </Typography>

        <Typography variant="body2" sx={{ mt: 1.5 }}>
          {task.where}
        </Typography>

        {task.search && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Busca en títulos:
            </Typography>
            <CopyTerm term={task.search} />
            <Link
              href={BOE_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}
            >
              Buscador del BOE <OpenInNewIcon sx={{ fontSize: 15 }} aria-hidden="true" />
            </Link>
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          Si ha cambiado, edita en <code>src/data/spain.js</code>: {task.fields}.
        </Typography>

        {task.due && (task.status === "overdue" || task.status === "soon") && (
          <Button size="small" onClick={() => onAcknowledge(task.id, task.due)} sx={{ mt: 1, ml: -0.5 }}>
            Lo he mirado y no ha cambiado
          </Button>
        )}
        {task.status === "done" && (
          <Button size="small" color="inherit" onClick={() => onUndo(task.id)} sx={{ mt: 1, ml: -0.5 }}>
            Deshacer «mirado»
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Página de mantenimiento (`#mantenimiento`): qué cifras reguladas toca
 * revisar, cuándo, dónde mirarlo y qué cambiar. No hace nada por su cuenta:
 * las fechas salen de `data/spain.js` y se resuelven al actualizarlas.
 */
export function MaintenancePage() {
  const now = useNow();
  const { acknowledged, acknowledge, unacknowledge, close, forget } = useAdmin();

  const tasks = useMemo(
    () =>
      maintenanceTasks(now, acknowledged).sort(
        (a, b) => ORDER[a.status] - ORDER[b.status] || (a.days ?? Infinity) - (b.days ?? Infinity)
      ),
    [now, acknowledged]
  );
  const pending = pendingCount(tasks);

  return (
    <Stack spacing={3}>
      <Card component="section" aria-labelledby="maintenance-heading">
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <BuildIcon fontSize="small" color="primary" aria-hidden="true" />
            <Typography variant="h2" component="h1" id="maintenance-heading">
              Mantenimiento
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Las cifras que fija el BOE y no llegan por ninguna API. Esta página no se enlaza desde la web; en este
            dispositivo verás un aviso en la cabecera cuando algo esté a {SOON_DAYS} días o menos.
          </Typography>

          <Alert severity={pending ? "warning" : "success"} sx={{ mt: 2 }}>
            {pending
              ? `${pending} ${pending === 1 ? "cosa pide" : "cosas piden"} tu atención.`
              : "Todo al día. No hay nada que revisar ahora."}
          </Alert>

          <Box component="ol" sx={{ mt: 2, mb: 0, pl: 2.5, typography: "body2", color: "text.secondary" }}>
            <li>Busca en el BOE (o en la web que se indica) si ha salido la cifra nueva.</li>
            <li>
              Si ha cambiado, actualízala en <code>src/data/spain.js</code>, junto con su fecha, y cambia{" "}
              <code>REVIEWED_AT</code> a hoy.
            </li>
            <li>
              Publica con <code>npm run deploy</code>. El recordatorio desaparece solo.
            </li>
            <li>Si no ha cambiado, pulsa «Lo he mirado y no ha cambiado» para silenciarlo hasta la próxima fecha.</li>
          </Box>
        </CardContent>
      </Card>

      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onAcknowledge={acknowledge} onUndo={unacknowledge} />
      ))}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between">
        <Button variant="contained" onClick={close}>
          Volver a la web
        </Button>
        <Button color="inherit" onClick={forget}>
          Dejar de avisarme en este dispositivo
        </Button>
      </Stack>
    </Stack>
  );
}

export default MaintenancePage;
