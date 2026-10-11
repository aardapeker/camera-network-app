import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Mic, Square, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import { useSpeechToText } from "~/hooks/use-speech-to-text"

interface MicButtonProps {
  onResult: (text: string) => void
  disabled?: boolean
  className?: string
}

export function MicButton({ onResult, disabled, className }: MicButtonProps) {
  const { t, i18n } = useTranslation()

  const { status, toggle } = useSpeechToText({
    onResult,
    language: i18n.language,
    onError: (err) => {
      if (err.message === "NOT_SUPPORTED") {
        toast.error(t("serviceForm.micNotSupported"))
      } else if (err.message === "PERMISSION_DENIED") {
        toast.error(t("serviceForm.micPermissionDenied"))
      } else {
        toast.error(t("serviceForm.micTranscribeFailed"), { description: err.message })
      }
    },
  })

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      tabIndex={-1}
      onClick={toggle}
      disabled={disabled || status === "transcribing"}
      title={status === "recording" ? t("serviceForm.micStop") : t("serviceForm.micStart")}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        status === "recording" && "text-destructive hover:text-destructive animate-pulse",
        className,
      )}
    >
      {status === "transcribing" ? (
        <Loader2 className="size-4 animate-spin" />
      ) : status === "recording" ? (
        <Square className="size-3.5 fill-current" />
      ) : (
        <Mic className="size-4" />
      )}
    </Button>
  )
}
