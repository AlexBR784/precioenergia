/* eslint-disable react/prop-types */
import { Box, Button, Stack, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InboxIcon from "@mui/icons-material/InboxOutlined";

/**
 * Estados vacío y de error compartidos. Sustituyen a los <Alert> sueltos y al
 * <div> sin estilo que devolvía DistributionChart cuando no había datos.
 */
function StateView({ icon, title, description, action, tone = "muted" }) {
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
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          bgcolor: tone === "error" ? "priceSoft.high" : "surfaceMuted",
          color: tone === "error" ? "error.main" : "text.secondary",
        }}
      >
        {icon}
      </Box>
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

export function EmptyState({ title, description, action }) {
  return (
    <StateView
      icon={<InboxIcon />}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function ErrorState({ title, description, onRetry, retryLabel = "Reintentar" }) {
  return (
    <StateView
      tone="error"
      icon={<ErrorOutlineIcon />}
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
