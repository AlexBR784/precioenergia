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

      <Skeleton variant="rounded" height={112} sx={{ borderRadius: 3 }} />

      <Card>
        <CardContent>
          <Skeleton variant="text" width={180} height={28} />
          <Skeleton variant="rounded" height={320} sx={{ mt: 2 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Skeleton variant="text" width={200} height={28} />
          <Box
            sx={{
              display: "grid",
              gap: 3,
              mt: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {Array.from({ length: 3 }).map((_, column) => (
              <Stack key={column} spacing={0.75}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} variant="rounded" height={30} />
                ))}
              </Stack>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default PricesSkeleton;
