import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

/**
 * Esqueleto de carga con la forma del contenido final.
 * Antes era un <CircularProgress /> suelto, sin contenedor, que provocaba un
 * salto de layout al llegar los datos.
 */
export function PricesSkeleton() {
  return (
    <Stack spacing={3} aria-busy="true" aria-label="Cargando precios">
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width={170} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Stack>
        <Skeleton variant="rounded" width={130} height={36} />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={110} />
        ))}
      </Box>

      <Card>
        <CardContent>
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={28} />
          <Stack spacing={1} sx={{ mt: 2 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={40} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default PricesSkeleton;
