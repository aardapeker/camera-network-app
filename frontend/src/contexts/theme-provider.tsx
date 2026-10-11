import { createContext, useEffect, useState } from "react"
import getSettings from "~/functions/get_settings"
import updateSettings from "~/functions/update_settings"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Return default during SSR, hydrate on client
    if (typeof window === "undefined") return defaultTheme
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme

    root.classList.add(resolved)

    // Keep PWA top bar in sync with the active theme
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", resolved === "dark" ? "#09090b" : "#ffffff")
    }
  }, [theme])

  // Sync theme from DB on mount; localStorage is used as the fast initial value to avoid flash
  useEffect(() => {
    getSettings()
      .then((s) => {
        if (s.theme && s.theme !== theme) {
          localStorage.setItem(storageKey, s.theme)
          setTheme(s.theme)
        }
      })
      .catch(() => {}) // silently ignore — localStorage value stays active
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
      // Persist to DB in background; ignore errors (localStorage already updated)
      updateSettings({ theme: newTheme }).catch(() => {})
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export { ThemeProviderContext }
