import React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Plus, Trash2, Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "~/components/ui/popover"

import {
  addComponentField,
  updateComponentField,
  deleteComponentField,
  type ComponentFieldType,
} from "~/functions/form/get_components_admin"

export type { ComponentFieldType }

export interface ComponentFieldLike {
  id: string
  label: string
  fieldType: ComponentFieldType
}

export function FieldTypeSelect({
  value, onChange, disabled,
}: { value: ComponentFieldType; onChange: (v: ComponentFieldType) => void; disabled?: boolean }) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ComponentFieldType)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="TEXT">{t("serviceForm.fieldTypeText")}</SelectItem>
        <SelectItem value="NUMBER">{t("serviceForm.fieldTypeNumber")}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export function AddFieldPopover({
  componentId, onAdded,
}: { componentId: string; onAdded: (field: ComponentFieldLike & { orderIndex: number }) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [label, setLabel] = React.useState("")
  const [fieldType, setFieldType] = React.useState<ComponentFieldType>("TEXT")
  const [saving, setSaving] = React.useState(false)

  const handleAdd = async () => {
    if (!label.trim()) return
    setSaving(true)
    try {
      const field = await addComponentField(componentId, label.trim(), fieldType)
      onAdded(field)
      setLabel("")
      setFieldType("TEXT")
      setOpen(false)
    } catch (err) {
      toast.error(t("serviceForm.addFieldFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 px-2">
          <Plus className="size-3" />
          {t("serviceForm.addField")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("serviceForm.fieldLabel")}</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("serviceForm.fieldLabelPlaceholder")}
            disabled={saving}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("serviceForm.fieldType")}</Label>
          <FieldTypeSelect value={fieldType} onChange={setFieldType} disabled={saving} />
        </div>
        <Button size="sm" className="w-full" onClick={handleAdd} disabled={saving || !label.trim()}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5 mr-1" />}
          {t("serviceForm.addButton")}
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export function FieldChip({
  componentId, field, onUpdated, onDeleted,
}: {
  componentId: string
  field: ComponentFieldLike
  onUpdated: (field: ComponentFieldLike) => void
  onDeleted: (fieldId: string) => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [label, setLabel] = React.useState(field.label)
  const [fieldType, setFieldType] = React.useState<ComponentFieldType>(field.fieldType)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const typeLabel = field.fieldType === "NUMBER" ? t("serviceForm.fieldTypeNumber") : t("serviceForm.fieldTypeText")

  const handleSave = async () => {
    if (!label.trim()) return
    setSaving(true)
    try {
      const updated = await updateComponentField(componentId, field.id, label.trim(), fieldType)
      onUpdated(updated)
      setOpen(false)
    } catch (err) {
      toast.error(t("serviceForm.updateFieldFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteComponentField(componentId, field.id)
      onDeleted(field.id)
      setOpen(false)
    } catch (err) {
      toast.error(t("serviceForm.deleteFieldFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) { setLabel(field.label); setFieldType(field.fieldType) } }}>
      <PopoverTrigger asChild>
        <Badge variant="secondary" className="cursor-pointer gap-1 font-normal">
          {field.label}
          <span className="text-muted-foreground">({typeLabel})</span>
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3" align="start">
        <div className="space-y-1.5">
          <Label className="text-xs">{t("serviceForm.fieldLabel")}</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} disabled={saving || deleting} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{t("serviceForm.fieldType")}</Label>
          <FieldTypeSelect value={fieldType} onChange={setFieldType} disabled={saving || deleting} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleSave} disabled={saving || deleting || !label.trim()}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : t("serviceForm.save")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
