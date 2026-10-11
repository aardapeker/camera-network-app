import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "~/locales/en.json"
import tr from "~/locales/tr.json"

export const LANGUAGE_STORAGE_KEY = "app-language"
export type Language = "en" | "tr"

// Fast initial value from localStorage to avoid a flash of the wrong language.
const initialLanguage: Language =
  typeof window !== "undefined" &&
  localStorage.getItem(LANGUAGE_STORAGE_KEY) === "tr"
    ? "tr"
    : "en"

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes
})

export default i18n
