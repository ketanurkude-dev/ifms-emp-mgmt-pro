import { createContext, useContext, useState } from "react";
import { put } from "../api/apiService";
import { I18N } from "./translations";

const LanguageContext = createContext(null);

// localStorage gives instant same-browser persistence. syncWithAccount()
// (called once the employee record is known, post-login) reconciles the
// account's saved preference with whatever is active locally:
//  - if the user never explicitly chose a language on this browser, adopt
//    the account's saved preference (it follows the employee across
//    devices).
//  - if the user DID explicitly choose one already (including at the
//    pre-login language toggle, which can't call the API yet), that
//    choice wins and gets pushed to the account instead of being
//    overwritten -- otherwise picking Hindi at the login screen would
//    flip back to English the moment the account's stored default loads.
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem("language") || "en");

  function setLanguage(next, persist = true) {
    setLanguageState(next);
    localStorage.setItem("language", next);
    localStorage.setItem("language_explicit", "1");
    if (persist) {
      put("/dashboard/language", { language: next }).catch(() => {});
    }
  }

  function toggleLanguage() {
    setLanguage(language === "en" ? "hi" : "en");
  }

  function syncWithAccount(accountLanguage) {
    if (!accountLanguage) return;
    const explicit = localStorage.getItem("language_explicit") === "1";
    if (explicit) {
      if (accountLanguage !== language) {
        put("/dashboard/language", { language }).catch(() => {});
      }
      return;
    }
    if (accountLanguage !== language) {
      setLanguageState(accountLanguage);
      localStorage.setItem("language", accountLanguage);
    }
  }

  function t(key) {
    return I18N[language][key] || I18N.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, syncWithAccount, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
