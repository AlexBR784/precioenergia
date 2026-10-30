import { Box, Container, Link, Stack, Typography } from "@mui/material";
import { REGIONS } from "../data/spain";
import { useEnergyPrefs } from "../hooks/useEnergyPrefs";
import { t } from "../i18n";
import { openTour } from "../guide/guideStore";
import { formatNumber } from "../i18n/format";

const percent = (rate) => `${formatNumber(rate * 100, { maximumFractionDigits: 2 })} %`;

/** Pie con la atribución a la fuente de datos. Antes no existía. */
export function AppFooter() {
  const { prefs, region } = useEnergyPrefs();
  const { tax } = REGIONS[region];

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
            {t("layout.footer.data")}{" "}
            <Link
              href="https://www.ree.es/es/apidatos"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              {t("layout.footer.ree")}
            </Link>
            {" · "}
            <Link
              href="https://geoportalgasolineras.es/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              {t("layout.footer.fuel")}
            </Link>
          </Typography>
          <Link
            component="button"
            variant="caption"
            underline="hover"
            onClick={openTour}
            sx={{ fontWeight: 600, minHeight: 24 }}
          >
            {t("guide.tour.open")}
          </Link>
          <Typography variant="caption" color="text.secondary">
            {prefs.withTaxes
              ? t("layout.footer.withTaxes", { tax: tax.name, rate: percent(tax.rate) })
              : t("layout.footer.withoutTaxes")}
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

export default AppFooter;
