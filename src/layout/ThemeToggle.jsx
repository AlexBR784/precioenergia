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

const OPTIONS = [
  { value: "light", label: "Claro", Icon: LightModeIcon },
  { value: "dark", label: "Oscuro", Icon: DarkModeIcon },
  { value: "system", label: "Según el sistema", Icon: SettingsBrightnessIcon },
];

/** Selector de tema claro / oscuro / sistema. */
export function ThemeToggle() {
  const { preference, mode, setPreference } = useColorMode();
  const [anchorEl, setAnchorEl] = useState(null);

  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];
  // El icono refleja el modo aplicado, no la preferencia: con "sistema"
  // muestra el sol o la luna según lo que se esté viendo realmente.
  const CurrentIcon = mode === "dark" ? DarkModeIcon : LightModeIcon;

  return (
    <>
      <Tooltip title={`Tema: ${current.label}`}>
        <IconButton
          onClick={(event) => setAnchorEl(event.currentTarget)}
          aria-label={`Cambiar tema. Actual: ${current.label}`}
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
        {OPTIONS.map(({ value, label, Icon }) => (
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
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default ThemeToggle;
