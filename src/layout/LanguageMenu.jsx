import { useState } from "react";
import { Box, IconButton, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";

import { LANGUAGES, t } from "../i18n";
import { useLanguage } from "../i18n/LanguageProvider";

/**
 * Selector de idioma de la cabecera. Cada idioma se escribe en sí mismo
 * ("Català", "Euskara"): quien no entiende el idioma actual tiene que poder
 * encontrar el suyo.
 */
export function LanguageMenu() {
  const { language, setLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const currentLabel = LANGUAGES[language].label;

  return (
    <>
      <Tooltip title={t("common.language.button", { name: currentLabel })}>
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={t("common.language.button", { name: currentLabel })}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          size="small"
          sx={{ color: "text.secondary", gap: 0.5, borderRadius: 2 }}
        >
          <TranslateIcon fontSize="small" />
          <Box component="span" sx={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
            {language}
          </Box>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ "aria-label": t("common.language.menu") }}
      >
        {Object.entries(LANGUAGES).map(([code, { label }]) => (
          <MenuItem
            key={code}
            lang={code}
            selected={code === language}
            onClick={() => {
              setAnchorEl(null);
              if (code !== language) setLanguage(code);
            }}
          >
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default LanguageMenu;
