import { useId, useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { Switch } from "./ui/switch"
import { useTheme } from "~/hooks/use-theme"

export function ModeToggleSwitch() {
  const id = useId()
  const { theme, setTheme } = useTheme()
  const [checked, setChecked] = useState<boolean>(() => theme === "dark")

  useEffect(() => {
    setChecked(theme === "dark")
  }, [theme])

  const onCheckedChange = (val: boolean) => {
    const next = Boolean(val)
    setChecked(next)
    setTheme(next ? "dark" : "light")
  }

  return (
    <div
      className="group inline-flex items-center gap-2"
      data-state={checked ? "checked" : "unchecked"}
    >
      <span
        id={`${id}-light`}
        className="group-data-[state=checked]:text-muted-foreground/70 cursor-pointer text-left text-sm font-medium"
        aria-controls={id}
        onClick={() => onCheckedChange(false)}
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </span>

      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={`${id}-dark ${id}-light`}
        aria-label="Toggle between dark and light mode"
      />

      <span
        id={`${id}-dark`}
        className="group-data-[state=unchecked]:text-muted-foreground/70 cursor-pointer text-right text-sm font-medium"
        aria-controls={id}
        onClick={() => onCheckedChange(true)}
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </span>
    </div>
  )
}

export default ModeToggleSwitch