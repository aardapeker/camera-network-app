import * as React from "react"

import { Input } from "~/components/ui/input"
import { MicButton } from "~/components/form/mic-button"
import { cn } from "~/lib/utils"

type MicInputProps = React.ComponentProps<"input">

export function MicInput({ className, value, onChange, disabled, ...props }: MicInputProps) {
  const appendText = (text: string) => {
    const current = typeof value === "string" ? value : ""
    const next = current ? `${current} ${text}`.trim() : text
    onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLInputElement>)
  }

  return (
    <div className="relative">
      <Input
        className={cn("pr-9", className)}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <MicButton
        onResult={appendText}
        disabled={disabled}
        className="absolute right-0.5 top-1/2 -translate-y-1/2"
      />
    </div>
  )
}
