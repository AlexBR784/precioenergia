import { useMemo } from "react";
import { Badge, IconButton, Tooltip } from "@mui/material";
import BuildIcon from "@mui/icons-material/BuildOutlined";

import { MAINTENANCE_HASH, useAdmin } from "../hooks/useAdmin";
import { useNow } from "../hooks/useNow";
import { maintenanceTasks, pendingCount } from "../features/admin/maintenance";

/**
 * Aviso de mantenimiento en la cabecera: solo en los dispositivos que han
 * abierto `#mantenimiento` alguna vez. Con algo pendiente lleva un contador; si
 * todo está al día, queda el icono discreto para entrar.
 */
export function AdminButton() {
  const now = useNow();
  const { isAdmin, acknowledged } = useAdmin();
  const pending = useMemo(() => pendingCount(maintenanceTasks(now, acknowledged)), [now, acknowledged]);

  if (!isAdmin) return null;

  const label = pending
    ? `Mantenimiento: ${pending} ${pending === 1 ? "cosa pendiente" : "cosas pendientes"}`
    : "Mantenimiento: todo al día";

  return (
    <Tooltip title={label}>
      <IconButton component="a" href={MAINTENANCE_HASH} size="small" aria-label={label} sx={{ color: "text.secondary" }}>
        <Badge badgeContent={pending} color="error" overlap="circular">
          <BuildIcon fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

export default AdminButton;
