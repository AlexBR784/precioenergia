/* eslint-disable react/prop-types */
import { Button, Stack, Typography } from "@mui/material";
import BoltMascot from "./BoltMascot";
import { t } from "../i18n";

/**
 * Estados vacío y de error compartidos. Sustituyen a los <Alert> sueltos y al
 * <div> sin estilo que devolvía el gráfico de precios cuando no había datos.
 *
 * Los ilustra el rayo con la pose que toca (`pose`): buscando si no hay nada,
 * dormido si aún no hay precios, señalando si falta elegir algo y con el
 * enchufe desconectado si algo ha fallado. Es donde una mascota más ayuda:
 * quita hierro al momento sin tapar ningún dato.
 */
function StateView({ pose, title, description, action, tone = "muted" }) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 6,
        px: 3,
        textAlign: "center",
        borderRadius: 3,
        border: 1,
        borderStyle: "dashed",
        borderColor: tone === "error" ? "error.main" : "divider",
        color: "text.secondary",
      }}
    >
      <BoltMascot pose={pose} size={{ xs: 88, sm: 100 }} />
      <Typography variant="h3" component="p" color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}

export function EmptyState({ title, description, action, pose = "search" }) {
  return (
    <StateView
      pose={pose}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = t("common.actions.retry") }) {
  return (
    <StateView
      tone="error"
      pose="error"
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="contained" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null
      }
    />
  );
}
