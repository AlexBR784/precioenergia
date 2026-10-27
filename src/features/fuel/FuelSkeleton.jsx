import { Card, CardContent, Skeleton, Stack } from "@mui/material";
import { t } from "../../i18n";

/** Cuerpo de la pestaña mientras se descargan las gasolineras (los filtros siguen visibles). */
export function FuelSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label={t("fuel.loading")}>
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Skeleton variant="text" width={260} />
          <Skeleton variant="text" width="70%" height={40} />
          <Skeleton variant="rounded" height={44} sx={{ mt: 3 }} />
        </CardContent>
      </Card>

      <Card>
        <Stack spacing={0}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={76} sx={{ borderBottom: 1, borderColor: "divider" }} />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}

export default FuelSkeleton;
