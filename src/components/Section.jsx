/* eslint-disable react/prop-types */
import { Box, Typography } from "@mui/material";

/**
 * Bloque de contenido sin tarjeta: una línea fina arriba y aire. Es la pieza
 * del estilo editorial (Precios, Consejos): las secciones se separan por
 * líneas y espacio, no se meten en cajas. Las tarjetas quedan para lo que de
 * verdad es un objeto suelto (una gasolinera, la factura).
 *
 * `title` pinta el h2 con su id para `aria-labelledby`; `kicker` es una línea
 * pequeña encima (sin mayúsculas). `divider={false}` quita la línea, para el
 * primer bloque de la página.
 */
export function Section({ id, title, kicker, action, divider = true, children, sx }) {
  return (
    <Box
      component="section"
      aria-labelledby={title ? id : undefined}
      sx={{ ...(divider ? { pt: 3, borderTop: 1, borderColor: "divider" } : {}), ...sx }}
    >
      {(title || kicker || action) && (
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            {kicker && (
              <Typography variant="body2" color="text.secondary">
                {kicker}
              </Typography>
            )}
            {title && (
              <Typography variant="h2" component="h2" id={id}>
                {title}
              </Typography>
            )}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
}

export default Section;
