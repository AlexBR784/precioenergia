/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useState } from "react";
import { getLanguage, loadLanguage, saveLanguage } from "./index";

const LanguageContext = createContext({ language: "es", setLanguage: () => {} });

/**
 * Idioma activo y cómo cambiarlo. `children` es una función que recibe el
 * idioma: quien la usa monta la app con `key={language}`, así que al cambiar
 * de idioma todo se vuelve a pintar con los textos y formatos nuevos.
 */
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getLanguage);

  const setLanguage = useCallback(async (next) => {
    const code = await loadLanguage(next);
    saveLanguage(code);
    setLanguageState(code);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children(language)}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext);

export default LanguageProvider;
