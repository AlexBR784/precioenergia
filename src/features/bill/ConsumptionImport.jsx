/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import dayjs from "dayjs";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Link, Stack, Typography } from "@mui/material";
import UploadIcon from "@mui/icons-material/UploadFileOutlined";
import InsightsIcon from "@mui/icons-material/InsightsOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { useEnergyPrefs } from "../../hooks/useEnergyPrefs";
import { fetchPvpcRange } from "../../hooks/usePvpcRange";
import { PERIODS } from "../../utils/tariffPeriods";
import { parseConsumptionCsv, summarizeConsumption } from "./consumptionCsv";
import { t } from "../../i18n";
import { fixed, formatNumber } from "../../i18n/format";
import { rich } from "../../i18n/rich";
import Hint from "../../guide/Hint";

/** Se cruzan como mucho los últimos 90 días del archivo: son 4 peticiones a REE. */
const MAX_DAYS = 90;

const TONES = { P1: "price.high", P2: "price.medium", P3: "price.cheapest" };

const kwhText = (value) => `${formatNumber(Math.round(value))} kWh`;
const priceKwh = (value) =>
  `${fixed(value, 3)} €/kWh`;
const shortDate = (iso) => dayjs(iso).format("D MMM YYYY");

/** Reparto del consumo en punta, llano y valle, como una barra apilada con cifras. */
function SplitBar({ split }) {
  const order = ["P3", "P2", "P1"];
  return (
    <Box>
      <Box sx={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", gap: "2px" }} aria-hidden="true">
        {order.map((id) => (
          <Box key={id} sx={{ flex: split[id] || 0.0001, bgcolor: TONES[id] }} />
        ))}
      </Box>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
        {order.map((id) => (
          <Typography key={id} variant="caption" color="text.secondary" className="tabular">
            <Box component="span" sx={{ color: TONES[id], fontWeight: 700 }}>
              {PERIODS[id].label}
            </Box>{" "}
            {Math.round(split[id] * 100)} %
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

/** Consumo medio de cada hora del día: cuándo se gasta la luz en casa. */
function Profile({ profile }) {
  const max = Math.max(...profile, 0.001);
  const peak = profile.indexOf(Math.max(...profile));
  return (
    <Box>
      <Box
        role="img"
        aria-label={t("bill.import.profileAria", { hour: peak })}
        sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 64 }}
      >
        {profile.map((value, hour) => (
          <Box
            key={hour}
            sx={{
              flex: 1,
              height: `${Math.max(4, (value / max) * 100)}%`,
              borderRadius: "2px 2px 0 0",
              bgcolor: hour === peak ? "primary.main" : "divider",
            }}
          />
        ))}
      </Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        {["00", "06", "12", "18", "23"].map((label) => (
          <Typography key={label} variant="caption" color="text.secondary" className="tabular">
            {label}h
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

/**
 * "Usa tu consumo real": el CSV de consumo horario de la distribuidora o de
 * Datadis, cruzado con el precio PVPC de cada hora. El archivo se lee en el
 * navegador y no se envía a ningún sitio; a REE solo se le piden precios.
 */
export function ConsumptionImport({ usage, onUsage }) {
  const { region } = useEnergyPrefs();
  const inputRef = useRef(null);
  const [uploadButton, setUploadButton] = useState(null);
  const [state, setState] = useState({ loading: false, error: null, fileName: null, average: null, trimmed: false });

  const handleFile = async (file) => {
    if (!file) return;
    setState({ loading: true, error: null, fileName: file.name, average: null, trimmed: false });
    try {
      let rows = parseConsumptionCsv(await file.text());
      const dates = [...new Set(rows.map((row) => row.date))].sort();
      const trimmed = dates.length > MAX_DAYS;
      if (trimmed) {
        const keep = new Set(dates.slice(-MAX_DAYS));
        rows = rows.filter((row) => keep.has(row.date));
      }
      const kept = [...new Set(rows.map((row) => row.date))].sort();

      let prices = null;
      let average = null;
      try {
        const pvpc = await fetchPvpcRange(kept[0], kept[kept.length - 1]);
        prices = new Map(pvpc.map((item) => [`${item.date}|${item.hour}`, item.value]));
        const inFile = pvpc.filter((item) => kept.includes(item.date));
        average = inFile.length ? inFile.reduce((sum, item) => sum + item.value, 0) / inFile.length / 1000 : null;
      } catch {
        // Sin precios se puede seguir: consumo, tramos y perfil no los necesitan.
      }

      onUsage(summarizeConsumption(rows, region, prices));
      setState({ loading: false, error: null, fileName: file.name, average, trimmed });
    } catch (error) {
      onUsage(null);
      setState({ loading: false, error: error.message || t("bill.import.readError"), fileName: file.name, average: null, trimmed: false });
    }
  };

  const clear = () => {
    onUsage(null);
    setState({ loading: false, error: null, fileName: null, average: null, trimmed: false });
    if (inputRef.current) inputRef.current.value = "";
  };

  const diff =
    usage?.weightedPriceKwh != null && state.average
      ? ((usage.weightedPriceKwh - state.average) / state.average) * 100
      : null;

  return (
    <Card component="section" aria-labelledby="import-heading">
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center">
          <InsightsIcon fontSize="small" color="primary" aria-hidden="true" />
          <Typography variant="h2" component="h2" id="import-heading">
            {t("bill.import.title")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {rich(
            t("bill.import.body", {
              strong: (text) => <strong>{text}</strong>,
              datadis: (
                <Link href="https://datadis.es/" target="_blank" rel="noopener noreferrer" underline="hover">
                  Datadis <OpenInNewIcon sx={{ fontSize: 13, verticalAlign: "-2px" }} aria-hidden="true" />
                </Link>
              ),
            })
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.75 }}>
          {t("bill.import.privacy")}
        </Typography>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
          <Button
            ref={setUploadButton}
            variant={usage ? "outlined" : "contained"}
            startIcon={state.loading ? <CircularProgress size={16} color="inherit" /> : <UploadIcon />}
            onClick={() => inputRef.current?.click()}
            disabled={state.loading}
          >
            {usage ? t("bill.import.uploadAnother") : t("bill.import.upload")}
          </Button>
          {usage && (
            <Button onClick={clear} color="inherit">
              {t("common.actions.remove")}
            </Button>
          )}
          {state.fileName && !state.error && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 240 }}>
              {state.fileName}
            </Typography>
          )}
          <Hint id="import" anchor={uploadButton} enabled={!usage && !state.loading} />
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </Stack>

        {state.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {state.error}
          </Alert>
        )}

        {usage && (
          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t("bill.import.range", { from: shortDate(usage.from), to: shortDate(usage.to), days: usage.days })}
              </Typography>
              <Typography className="tabular" sx={{ fontSize: "1.5rem", fontWeight: 700, mt: 0.5 }}>
                {kwhText(usage.kwh)}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 1.5 }}>
                {t("bill.import.perMonth", { kwh: kwhText((usage.kwh / usage.days) * 30) })}
                {state.trimmed ? t("bill.import.trimmed", { days: MAX_DAYS }) : ""}
              </Typography>
              <SplitBar split={usage.split} />
              {usage.weightedPriceKwh != null && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {rich(t("bill.import.weighted", { price: <strong className="tabular">{priceKwh(usage.weightedPriceKwh)}</strong> }))}
                  {diff != null &&
                    (Math.abs(diff) < 2
                      ? t("bill.import.sameAsAverage")
                      : diff < 0
                        ? t("bill.import.belowAverage", { percent: Math.round(-diff) })
                        : t("bill.import.aboveAverage", { percent: Math.round(diff) }))}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t("bill.import.profile")}
              </Typography>
              <Profile profile={usage.profile} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ConsumptionImport;
