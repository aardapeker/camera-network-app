import * as React from "react"

import { Textarea } from "~/components/ui/textarea"
import { MicButton } from "~/components/form/mic-button"
import { cn } from "~/lib/utils"

type MicTextareaProps = React.ComponentPropsWithoutRef<"textarea">

export function MicTextarea({ className, value, onChange, disabled, ...props }: MicTextareaProps) {
  const appendText = (text: string) => {
    const current = typeof value === "string" ? value : ""
    const next = current ? `${current} ${text}`.trim() : text
    onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLTextAreaElement>)
  }

  return (
    <div className="relative">
      <Textarea
        className={cn("pr-9", className)}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <MicButton
        onResult={appendText}
        disabled={disabled}
        className="absolute right-0.5 top-0.5"
      />
    </div>
  )
}
