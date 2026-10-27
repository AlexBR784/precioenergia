/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { InputAdornment, TextField } from "@mui/material";

const toText = (value) => (value == null ? "" : String(value).replace(".", ","));

const parse = (text) => {
  const value = parseFloat(String(text).trim().replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

/**
 * Campo numérico con coma decimal, como se escribe en España ("0,145").
 *
 * El texto se guarda tal cual mientras se escribe (si no, "0," se convertiría
 * en "0" y no habría forma de teclear decimales) y el número se entrega en
 * cada cambio válido. Vacío entrega null.
 */
export function NumberField({ value, onChange, unit, min = 0, max = Infinity, ...props }) {
  const [text, setText] = useState(toText(value));

  // Si el valor cambia desde fuera (otro componente, un archivo importado), se refleja.
  useEffect(() => {
    if (parse(text) !== value) setText(toText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        const parsed = parse(next);
        if (next.trim() === "") onChange(null);
        else if (parsed != null && parsed >= min && parsed <= max) onChange(parsed);
      }}
      inputProps={{ inputMode: "decimal", ...(props.inputProps ?? {}) }}
      InputProps={unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined}
    />
  );
}

export default NumberField;
