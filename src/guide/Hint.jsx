/* eslint-disable react/prop-types */
import { useEffect, useId, useState } from "react";
import { Box, Button, ClickAwayListener, Fade, Paper, Popper, Typography, useMediaQuery } from "@mui/material";

import { claimHint, hintAllowed, hintWait } from "./guideStore";
import { t } from "../i18n";

/** Lo que tapan arriba la cabecera y abajo la barra de secciones en móvil. */
const VISIBLE_AREA = "-72px 0px -96px 0px";
/** Respiro tras entrar en la sección, para que no salga a la vez que el contenido. */
const SETTLE_MS = 800;

/**
 * Región `aria-live` compartida: tiene que existir antes de que cambie su
 * texto para que el lector de pantalla lo anuncie.
 */
const liveRegion = () => {
  let region = document.getElementById("guide-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "guide-announcer";
    region.setAttribute("aria-live", "polite");
    region.style.cssText =
      "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    document.body.appendChild(region);
  }
  return region;
};

/**
 * Pista contextual sobre un control: una burbuja que lo señala, sin velo ni
 * trampa de foco, que se cierra con "Entendido", con Esc o tocando fuera
 * (también al usar el propio control). Sale una sola vez en la vida, como
 * mucho una por visita, y solo con el control entero a la vista; las reglas
 * de cuándo están en `guideStore`.
 *
 * `enabled` permite saltársela si lo que explica ya se ha usado o si la
 * sección todavía está cargando. El texto sale de `guide.hints.<id>`.
 */
export function Hint({ id, anchor, enabled = true, placement = "bottom", visibleArea = VISIBLE_AREA }) {
  const [open, setOpen] = useState(false);
  const [arrow, setArrow] = useState(null);
  const titleId = useId();
  const bodyId = useId();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    if (!enabled || !anchor || !hintAllowed(id)) return undefined;
    liveRegion();
    let observer;
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && claimHint(id)) {
            observer.disconnect();
            setOpen(true);
          }
        },
        { threshold: 1, rootMargin: visibleArea }
      );
      observer.observe(anchor);
    }, hintWait() + SETTLE_MS);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [id, anchor, enabled, visibleArea]);

  // Si deja de tener sentido (ya se ha usado lo que explica), se va.
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  useEffect(() => {
    if (!open || !anchor) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    anchor.setAttribute("aria-describedby", bodyId);
    liveRegion().textContent = `${t(`guide.hints.${id}.title`)}. ${t(`guide.hints.${id}.body`)}`;
    return () => {
      document.removeEventListener("keydown", onKey);
      anchor.removeAttribute("aria-describedby");
      liveRegion().textContent = "";
    };
  }, [open, anchor, id, bodyId]);

  if (!anchor) return null;

  return (
    <Popper
      open={open}
      anchorEl={anchor}
      placement={placement}
      transition
      modifiers={[
        { name: "offset", options: { offset: [0, 12] } },
        { name: "preventOverflow", options: { padding: 16 } },
        { name: "flip", options: { padding: { top: 72, bottom: 96 } } },
        { name: "arrow", enabled: Boolean(arrow), options: { element: arrow, padding: 16 } },
      ]}
      sx={{
        // Por encima de la cabecera y la barra de secciones, por debajo de
        // los diálogos (que abre el propio control).
        zIndex: (theme) => theme.zIndex.appBar + 1,
        width: "max-content",
        maxWidth: "min(320px, calc(100vw - 32px))",
        '&[data-popper-placement^="bottom"] .hint-arrow': { top: -6, "&::before": { borderWidth: "1px 0 0 1px" } },
        '&[data-popper-placement^="top"] .hint-arrow': { bottom: -6, "&::before": { borderWidth: "0 1px 1px 0" } },
      }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={reduceMotion ? 0 : 200}>
          <div>
            {/* Solo clics: con `touchend` bastaría con desplazar la página para cerrarla. */}
            <ClickAwayListener onClickAway={() => setOpen(false)} touchEvent={false}>
              <Paper
                role="group"
                aria-labelledby={titleId}
                elevation={6}
                sx={{
                  position: "relative",
                  p: 2,
                  pb: 1,
                  bgcolor: "primarySoft",
                  border: 1,
                  borderColor: "primary.main",
                  borderRadius: 3,
                }}
              >
                <Box
                  ref={setArrow}
                  className="hint-arrow"
                  aria-hidden="true"
                  sx={{
                    position: "absolute",
                    width: 12,
                    height: 12,
                    // Popper coloca la flecha con `transform`; el giro va en
                    // el pseudo-elemento para no torcer ese desplazamiento.
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      bgcolor: "primarySoft",
                      borderStyle: "solid",
                      borderColor: "primary.main",
                      transform: "rotate(45deg)",
                    },
                  }}
                />
                <Typography id={titleId} variant="body2" sx={{ fontWeight: 700 }}>
                  {t(`guide.hints.${id}.title`)}
                </Typography>
                <Typography id={bodyId} variant="body2" sx={{ mt: 0.5 }}>
                  {t(`guide.hints.${id}.body`)}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5, mr: -1 }}>
                  <Button size="small" onClick={() => setOpen(false)}>
                    {t("guide.gotIt")}
                  </Button>
                </Box>
              </Paper>
            </ClickAwayListener>
          </div>
        </Fade>
      )}
    </Popper>
  );
}

export default Hint;
