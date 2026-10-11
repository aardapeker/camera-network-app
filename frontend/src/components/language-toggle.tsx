import { Languages } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { useLanguage } from "~/hooks/use-language"
import type { Language } from "~/lib/i18n"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()

  const choose = (e: React.MouseEvent, lang: Language) => {
    e.stopPropagation()
    setLanguage(lang)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("common.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => choose(e, "en")}
          className={language === "en" ? "font-semibold" : undefined}
        >
          {t("common.english")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => choose(e, "tr")}
          className={language === "tr" ? "font-semibold" : undefined}
        >
          {t("common.turkish")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LanguageToggle
