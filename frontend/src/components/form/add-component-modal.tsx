import React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "~/components/ui/dialog"
import { AddFieldPopover, FieldChip } from "~/components/form/component-field-editor"
import { createComponent } from "~/functions/component/create_component"
import type { ComponentDto } from "~/functions/component/search_components"

interface AddComponentModalProps {
  open: boolean
  name: string
  onOpenChange: (open: boolean) => void
  onDone: (component: ComponentDto) => void
}

export function AddComponentModal({ open, name, onOpenChange, onDone }: AddComponentModalProps) {
  const { t } = useTranslation()
  const [component, setComponent] = React.useState<ComponentDto | null>(null)
  const [creating, setCreating] = React.useState(false)
  const createdForName = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!open || createdForName.current === name) return
    createdForName.current = name
    setCreating(true)
    createComponent(name)
      .then(setComponent)
      .catch((err) => {
        toast.error(t("serviceForm.addFailed"), {
          description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
        })
        onOpenChange(false)
      })
      .finally(() => setCreating(false))
  }, [open, name, t, onOpenChange])

  React.useEffect(() => {
    if (!open) {
      createdForName.current = null
      setComponent(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("serviceForm.addComponentModalTitle", { name })}</DialogTitle>
          <DialogDescription>{t("serviceForm.addComponentModalDesc")}</DialogDescription>
        </DialogHeader>

        {creating || !component ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 items-center py-1">
            {component.fields.map((f) => (
              <FieldChip
                key={f.id}
                componentId={component.id}
                field={f}
                onUpdated={(field) => setComponent((c) => c && {
                  ...c,
                  fields: c.fields.map((existing) => (existing.id === field.id ? { ...existing, ...field } : existing)),
                })}
                onDeleted={(fieldId) => setComponent((c) => c && {
                  ...c,
                  fields: c.fields.filter((existing) => existing.id !== fieldId),
                })}
              />
            ))}
            <AddFieldPopover
              componentId={component.id}
              onAdded={(field) => setComponent((c) => c && { ...c, fields: [...c.fields, field] })}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!component}
            onClick={() => {
              if (component) onDone(component)
            }}
          >
            {t("serviceForm.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
