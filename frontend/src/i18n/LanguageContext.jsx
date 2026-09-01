import { createContext, useContext, useState } from "react";
import { I18N } from "./translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");

  function toggleLanguage() {
    const next = language === "en" ? "hi" : "en";
    localStorage.setItem("language", next);
    setLanguage(next);
  }

  function t(key) {
    return I18N[language][key] || I18N.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
