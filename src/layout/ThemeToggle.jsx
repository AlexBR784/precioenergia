import { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsBrightnessIcon from "@mui/icons-material/SettingsBrightness";
import { useColorMode } from "../theme/colorMode";
import { t } from "../i18n";

const OPTIONS = [
  { value: "light", Icon: LightModeIcon },
  { value: "dark", Icon: DarkModeIcon },
  { value: "system", Icon: SettingsBrightnessIcon },
];

/** Selector de tema claro / oscuro / sistema. */
export function ThemeToggle() {
  const { preference, mode, setPreference } = useColorMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];
  const currentLabel = t(`layout.theme.${current.value}`);
  // El icono refleja el modo aplicado, no la preferencia: con "sistema"
  // muestra el sol o la luna según lo que se esté viendo realmente.
  const CurrentIcon = mode === "dark" ? DarkModeIcon : LightModeIcon;

  return (
    <>
      <Tooltip title={t("layout.theme.tooltip", { name: currentLabel })}>
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={t("layout.theme.button", { name: currentLabel })}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorEl)}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          <CurrentIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {OPTIONS.map(({ value, Icon }) => (
          <MenuItem
            key={value}
            selected={value === preference}
            onClick={() => {
              setPreference(value);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t(`layout.theme.${value}`)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default ThemeToggle;
