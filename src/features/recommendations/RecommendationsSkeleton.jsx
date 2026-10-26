import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

/** Mismo esqueleto que el contenido real, para que el layout no salte. */
export function RecommendationsSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando consejos">
      <Skeleton variant="rounded" width={170} height={40} />

      <Card>
        <CardContent>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Skeleton variant="circular" width={52} height={52} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width="45%" height={32} />
              <Skeleton variant="text" width="65%" />
            </Box>
          </Stack>
          <Skeleton variant="rounded" height={76} sx={{ mt: 2.5 }} />
          <Skeleton variant="rounded" height={110} sx={{ mt: 3 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Skeleton variant="text" width={220} height={28} />
          <Skeleton variant="rounded" height={36} sx={{ mt: 2 }} />
          <Skeleton variant="rounded" height={180} sx={{ mt: 3 }} />
        </CardContent>
      </Card>
    </Stack>
  );
}

export default RecommendationsSkeleton;
