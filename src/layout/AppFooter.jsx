import { Box, Container, Link, Stack, Typography } from "@mui/material";

/** Pie con la atribución a la fuente de datos. Antes no existía. */
export function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{ mt: 6, py: 3, borderTop: 1, borderColor: "divider" }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="caption" color="text.secondary">
            Datos:{" "}
            <Link
              href="https://www.ree.es/es/apidatos"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              Red Eléctrica de España — apidatos.ree.es
            </Link>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Precios del mercado mayorista. No incluyen peajes ni impuestos.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default AppFooter;
