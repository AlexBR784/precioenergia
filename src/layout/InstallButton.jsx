import { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import InstallIcon from "@mui/icons-material/InstallMobileOutlined";
import { t } from "../i18n";

/**
 * "Instalar la app": aparece solo cuando el navegador ofrece instalarla
 * (Chrome, Edge y Android; Safari no avisa y se instala desde "Compartir >
 * Añadir a pantalla de inicio"). Con la app ya instalada no se ve.
 */
export function InstallButton() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const onPrompt = (event) => {
      // Sin esto el navegador enseñaría su propio aviso en cuanto pudiera.
      event.preventDefault();
      setPrompt(event);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;

  return (
    <Tooltip title={t("layout.install.tooltip")}>
      <IconButton
        size="small"
        aria-label={t("layout.install.button")}
        sx={{ color: "text.secondary" }}
        onClick={async () => {
          prompt.prompt();
          await prompt.userChoice.catch(() => null);
          setPrompt(null);
        }}
      >
        <InstallIcon />
      </IconButton>
    </Tooltip>
  );
}

export default InstallButton;
