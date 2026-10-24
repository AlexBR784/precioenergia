import { Box, Skeleton, Stack } from "@mui/material";

/** Cuerpo de la pestaña mientras se descargan las gasolineras (los filtros siguen visibles). */
export function FuelSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando gasolineras">
      <Skeleton variant="rounded" height={104} sx={{ borderRadius: 3 }} />

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={112} />
        ))}
      </Box>

      <Stack spacing={1.5}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={96} />
        ))}
      </Stack>
    </Stack>
  );
}

export default FuelSkeleton;
