import React from "react"
import { Loader2, Plus, Check } from "lucide-react"

import { Input } from "~/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover"
import { cn } from "~/lib/utils"

export interface AsyncComboboxItem {
  id: string
  name: string
}

interface AsyncComboboxProps<T extends AsyncComboboxItem> {
  id?: string
  value: string
  onValueChange: (value: string) => void
  onSelectItem: (item: T) => void
  search: (query: string, signal?: AbortSignal) => Promise<T[]>
  /** Called to create+select a new item inline. Ignored if `onAddNew` is set. */
  create?: (name: string) => Promise<T>
  /** Overrides the default inline "add new" behavior — e.g. to open a modal instead. */
  onAddNew?: (query: string) => void
  placeholder?: string
  disabled?: boolean
  addNewLabel: (query: string) => string
  noResultsLabel: string
  loadingLabel: string
  inputClassName?: string
}

type ComboItem<T extends AsyncComboboxItem> = { type: "item"; data: T } | { type: "add-new" }

export function AsyncCombobox<T extends AsyncComboboxItem = AsyncComboboxItem>({
  id,
  value,
  onValueChange,
  onSelectItem,
  search,
  create,
  onAddNew,
  placeholder,
  disabled,
  addNewLabel,
  noResultsLabel,
  loadingLabel,
  inputClassName,
}: AsyncComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [results, setResults] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [highlighted, setHighlighted] = React.useState(0)

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef = React.useRef<AbortController | undefined>(undefined)

  const runSearch = React.useCallback((query: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    search(query, controller.signal)
      .then((data) => {
        setResults(data)
        setHighlighted(0)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(value), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, open])

  React.useEffect(() => () => {
    abortRef.current?.abort()
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const trimmed = value.trim()
  const hasExactMatch = results.some(
    (r) => r.name.toLowerCase() === trimmed.toLowerCase(),
  )
  const showAddNew = trimmed.length > 0 && !hasExactMatch && !loading

  const items: ComboItem<T>[] = [
    ...results.map((r): ComboItem<T> => ({ type: "item", data: r })),
    ...(showAddNew ? [{ type: "add-new" } as ComboItem<T>] : []),
  ]

  const selectItem = (item: T) => {
    onSelectItem(item)
    setOpen(false)
  }

  const handleAddNew = async () => {
    if (!trimmed || creating) return
    if (onAddNew) {
      onAddNew(trimmed)
      setOpen(false)
      return
    }
    if (!create) return
    setCreating(true)
    try {
      const created = await create(trimmed)
      selectItem(created)
    } catch {
      setOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = items[highlighted]
      if (!item) return
      if (item.type === "item") selectItem(item.data)
      else void handleAddNew()
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          id={id}
          className={inputClassName}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={(e) => {
            onValueChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-1"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              {loadingLabel}
            </div>
          ) : items.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">{noResultsLabel}</div>
          ) : (
            items.map((item, i) => {
              const active = i === highlighted
              if (item.type === "add-new") {
                return (
                  <button
                    key="add-new"
                    type="button"
                    disabled={creating}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => void handleAddNew()}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-primary disabled:opacity-50",
                      active && "bg-accent",
                    )}
                  >
                    {creating ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    {addNewLabel(trimmed)}
                  </button>
                )
              }
              return (
                <button
                  key={item.data.id}
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => selectItem(item.data)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                    active && "bg-accent",
                  )}
                >
                  <span className="truncate">{item.data.name}</span>
                  {trimmed.length > 0 && item.data.name.toLowerCase() === trimmed.toLowerCase() && (
                    <Check className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
