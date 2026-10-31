/* eslint-disable react/prop-types */
import { useEffect, useId, useState } from "react";
import { Box, Button, ClickAwayListener, Fade, Paper, Popper, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { claimHint, hintAllowed, hintWait } from "./guideStore";
import BoltMascot from "../components/BoltMascot";
import { t } from "../i18n";

/** Lo que tapan arriba la cabecera y abajo la barra de secciones en móvil. */
const VISIBLE_AREA = "-72px 0px -96px 0px";
/** ¿Hay ya algún rayo con cara a la vista (el veredicto, un aviso)? Entonces la pista va sin él. */
const mascotInView = () =>
  [...document.querySelectorAll("[data-bolt-mascot]")].some((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
  });

/** Punto final para el título, salvo si ya acaba en signo ("¿Tienes descuento…?"). */
const withStop = (text) => (/[.?!…]$/.test(text) ? text : `${text}.`);
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
  const [withFace, setWithFace] = useState(false);
  const [arrow, setArrow] = useState(null);
  const titleId = useId();
  const bodyId = useId();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const theme = useTheme();

  useEffect(() => {
    if (!enabled || !anchor || !hintAllowed(id)) return undefined;
    liveRegion();
    let observer;
    const timer = window.setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting) && claimHint(id)) {
            observer.disconnect();
            // La regla de "un rayo por pantalla": si ya hay uno, la pista va sin cara.
            setWithFace(!mascotInView());
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
    // El control del que se habla, rodeado en dorado mientras la pista está
    // abierta: une la burbuja con su sitio sin velo ni animación.
    const { outline, outlineOffset } = anchor.style;
    anchor.style.outline = `2px solid ${theme.palette.secondary.main}`;
    anchor.style.outlineOffset = "3px";
    liveRegion().textContent = `${t(`guide.hints.${id}.title`)}. ${t(`guide.hints.${id}.body`)}`;
    return () => {
      document.removeEventListener("keydown", onKey);
      anchor.removeAttribute("aria-describedby");
      anchor.style.outline = outline;
      anchor.style.outlineOffset = outlineOffset;
      liveRegion().textContent = "";
    };
  }, [open, anchor, id, bodyId, theme]);

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
        '&[data-popper-placement^="bottom"] .hint-arrow': { top: -5 },
        '&[data-popper-placement^="top"] .hint-arrow': { bottom: -5 },
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
                elevation={8}
                sx={{
                  position: "relative",
                  py: 1.5,
                  pl: 2,
                  pr: 1,
                  borderRadius: 2,
                  // Superficie invertida (tinta en claro, clara en oscuro), como
                  // un aviso del sistema: se distingue del contenido sin borde.
                  bgcolor: "text.primary",
                  color: "background.paper",
                  backgroundImage: "none",
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
                      bgcolor: "text.primary",
                      transform: "rotate(45deg)",
                      borderRadius: "2px",
                    },
                  }}
                />
                {/* Una sola frase: el título en negrita como entrada del texto. */}
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                  {/* La cara del rayo, pequeña y quieta: firma la pista sin
                      convertirla en un personaje que habla. */}
                  {withFace && (
                    <Box sx={{ flexShrink: 0, mt: "1px" }}>
                      <BoltMascot mood="neutral" size={28} animate={false} />
                    </Box>
                  )}
                  <Typography id={bodyId} variant="body2" sx={{ flex: 1, lineHeight: 1.55 }}>
                    <Box component="strong" id={titleId} sx={{ fontWeight: 700 }}>
                      {withStop(t(`guide.hints.${id}.title`))}
                    </Box>{" "}
                    {t(`guide.hints.${id}.body`)}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setOpen(false)}
                    sx={{ color: "inherit", fontWeight: 700, flexShrink: 0, minWidth: 0, mt: -0.5, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
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
