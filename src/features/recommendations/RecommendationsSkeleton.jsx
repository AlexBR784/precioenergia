import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

/** Mismo esqueleto que el contenido real, para que el layout no salte. */
export function RecommendationsSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando consejos">
      <Skeleton variant="rounded" width={170} height={40} />

      <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={116} />
        ))}
      </Box>

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
