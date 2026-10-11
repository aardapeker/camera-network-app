import { createContext, useEffect, useState } from "react"
import getSettings from "~/functions/get_settings"
import updateSettings from "~/functions/update_settings"
import i18n, { LANGUAGE_STORAGE_KEY, type Language } from "~/lib/i18n"

type LanguageProviderProps = {
  children: React.ReactNode
  defaultLanguage?: Language
  storageKey?: string
}

type LanguageProviderState = {
  language: Language
  setLanguage: (language: Language) => void
}

const initialState: LanguageProviderState = {
  language: "en",
  setLanguage: () => null,
}

const LanguageProviderContext = createContext<LanguageProviderState>(initialState)

export function LanguageProvider({
  children,
  defaultLanguage = "en",
  storageKey = LANGUAGE_STORAGE_KEY,
  ...props
}: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    // Return default during SSR, hydrate on client
    if (typeof window === "undefined") return defaultLanguage
    return (localStorage.getItem(storageKey) as Language) || defaultLanguage
  })

  // Keep i18next and the <html lang> attribute in sync with the active language
  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language)
    if (typeof document !== "undefined") {
      document.documentElement.lang = language
    }
  }, [language])

  // Sync language from DB on mount; localStorage is the fast initial value to avoid flash
  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s.language && s.language !== language) {
          localStorage.setItem(storageKey, s.language)
          setLanguage(s.language)
        }
      })
      .catch(() => {}) // silently ignore — localStorage value stays active
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    language,
    setLanguage: (newLanguage: Language) => {
      localStorage.setItem(storageKey, newLanguage)
      setLanguage(newLanguage)
      // Persist to DB in background; ignore errors (localStorage already updated)
      updateSettings({ language: newLanguage }).catch(() => {})
    },
  }

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  )
}

export { LanguageProviderContext }
