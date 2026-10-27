/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { PERIODS, allDayValleyReason, periodsOfDay } from "../utils/tariffPeriods";
import { t } from "../i18n";

/** Cada tramo con el color de su precio relativo; el nombre va siempre escrito. */
const TONES = {
  P1: { bg: "priceSoft.high", color: "price.high" },
  P2: { bg: "priceSoft.medium", color: "price.medium" },
  P3: { bg: "priceSoft.cheapest", color: "price.cheapest" },
};

const pad = (hour) => `${String(hour).padStart(2, "0")}:00`;

/** [{ period, from, to }] con las horas seguidas del mismo tramo juntas. */
const blocksOf = (periods) =>
  periods.reduce((blocks, period, hour) => {
    const last = blocks[blocks.length - 1];
    if (last && last.period === period) last.to = hour + 1;
    else blocks.push({ period, from: hour, to: hour + 1 });
    return blocks;
  }, []);

/**
 * Los tramos de la tarifa 2.0TD (valle, llano, punta) de un día, como una
 * franja de 24 horas. Sirven a todos: con PVPC explican por qué la tarde es
 * cara, y con precio por tramos son lo único que decide cuánto se paga.
 */
export function PeriodStrip({ date, region, nowHour = null }) {
  const day = useMemo(() => new Date(date), [date]);
  const blocks = useMemo(() => blocksOf(periodsOfDay(day, region)), [day, region]);
  const allDay = allDayValleyReason(day);

  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Stack direction="row" spacing={1} alignItems="baseline" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2" color="text.secondary" component="figcaption">
          {t("common.periodStrip.title")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {allDay ? t("common.periodStrip.allDay", { reason: allDay }) : t("common.periodStrip.subtitle")}
        </Typography>
      </Stack>

      <Box
        role="img"
        aria-label={blocks
          .map((block) =>
            t("common.periodStrip.block", { period: PERIODS[block.period].label, from: pad(block.from), to: pad(block.to % 24) })
          )
          .join(", ")}
        sx={{ position: "relative", display: "flex", height: 30, borderRadius: 1.5, overflow: "hidden", gap: "2px" }}
      >
        {blocks.map((block) => (
          <Box
            key={block.from}
            aria-hidden="true"
            sx={{
              flex: block.to - block.from,
              display: "grid",
              placeItems: "center",
              minWidth: 0,
              bgcolor: TONES[block.period].bg,
              color: TONES[block.period].color,
            }}
          >
            {/* Dos horas no dan para la palabra en móvil: se queda la inicial. */}
            <Typography variant="caption" noWrap sx={{ fontWeight: 700, color: "inherit", px: 0.25 }}>
              {block.to - block.from >= 3 ? (
                PERIODS[block.period].label
              ) : (
                <>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                    {PERIODS[block.period].label.charAt(0)}
                  </Box>
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                    {PERIODS[block.period].label}
                  </Box>
                </>
              )}
            </Typography>
          </Box>
        ))}

        {nowHour != null && (
          <Box
            aria-hidden="true"
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `calc(${((nowHour + 0.5) / 24) * 100}% - 1px)`,
              width: 2,
              bgcolor: "text.primary",
            }}
          />
        )}
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
        {[0, 6, 12, 18, 24].map((hour) => (
          <Typography key={hour} variant="caption" color="text.secondary" className="tabular">
            {pad(hour)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}

export default PeriodStrip;
