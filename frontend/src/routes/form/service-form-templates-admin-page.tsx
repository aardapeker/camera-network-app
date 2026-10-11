import React from "react"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { Sparkles, Plus, Trash2, Loader2, X } from "lucide-react"
import type { Route } from "./+types/service-form-templates-admin-page"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import { Switch } from "~/components/ui/switch"
import { Textarea } from "~/components/ui/textarea"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

import type { ServiceFormTemplateDto } from "~/functions/form/get_service_form_templates"
import {
  getTemplatesAdmin,
  createTemplateAdmin,
  updateTemplateAdmin,
  deleteTemplateAdmin,
  addTemplateComponent,
  removeTemplateComponent,
} from "~/functions/form/get_service_form_templates_admin"

export async function clientLoader(): Promise<{ templates: ServiceFormTemplateDto[] }> {
  try {
    return { templates: await getTemplatesAdmin() }
  } catch (error) {
    toast.error(i18n.t("serviceForm.loadTemplatesFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return { templates: [] }
  }
}

export default function ServiceFormTemplatesAdminPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation()
  const [templates, setTemplates] = React.useState<ServiceFormTemplateDto[]>(loaderData.templates)
  const [newNameTr, setNewNameTr] = React.useState("")
  const [newNameEn, setNewNameEn] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  // Snapshot of what the server currently holds, so a blur only saves real edits.
  const savedRef = React.useRef<Record<string, string>>(
    Object.fromEntries(loaderData.templates.map((tpl) => [tpl.id, JSON.stringify(tpl)])),
  )

  function patch(id: string, changes: Partial<ServiceFormTemplateDto>) {
    setTemplates((prev) => prev.map((tpl) => (tpl.id === id ? { ...tpl, ...changes } : tpl)))
  }

  async function save(template: ServiceFormTemplateDto) {
    if (savedRef.current[template.id] === JSON.stringify(template)) return
    if (!template.nameTr.trim() || !template.nameEn.trim()) return

    try {
      const updated = await updateTemplateAdmin(template.id, {
        nameTr: template.nameTr,
        nameEn: template.nameEn,
        promptHint: template.promptHint,
        faultExample: template.faultExample,
        serviceExample: template.serviceExample,
        active: template.active,
        orderIndex: template.orderIndex,
      })
      savedRef.current[updated.id] = JSON.stringify(updated)
      setTemplates((prev) => prev.map((tpl) => (tpl.id === updated.id ? updated : tpl)))
    } catch (err) {
      toast.error(t("serviceForm.updateFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newNameTr.trim() || !newNameEn.trim()) return
    setIsAdding(true)
    try {
      const created = await createTemplateAdmin({
        nameTr: newNameTr.trim(),
        nameEn: newNameEn.trim(),
      })
      savedRef.current[created.id] = JSON.stringify(created)
      setTemplates((prev) => [...prev, created])
      setNewNameTr("")
      setNewNameEn("")
      toast.success(t("serviceForm.templateAdded"), { description: created.nameTr })
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteTemplateAdmin(id)
      delete savedRef.current[id]
      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id))
      toast.success(t("serviceForm.templateDeleted"))
    } catch (err) {
      toast.error(t("serviceForm.deleteFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("serviceForm.templatesTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("serviceForm.templatesSubtitle")}</p>
        </div>

        {/* Add form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              {t("serviceForm.addTemplateTitle")}
            </CardTitle>
            <CardDescription>{t("serviceForm.addTemplateDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
              <div className="flex flex-col space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="newNameTr">{t("serviceForm.templateNameTr")}</Label>
                <Input
                  id="newNameTr"
                  value={newNameTr}
                  onChange={(e) => setNewNameTr(e.target.value)}
                  placeholder={t("serviceForm.templateNameTrPlaceholder")}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="flex flex-col space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="newNameEn">{t("serviceForm.templateNameEn")}</Label>
                <Input
                  id="newNameEn"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder={t("serviceForm.templateNameEnPlaceholder")}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isAdding || !newNameTr.trim() || !newNameEn.trim()}>
                  {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 mr-1" />}
                  {t("serviceForm.addButton")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Template list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" />
                {t("serviceForm.templateListTitle")}
              </CardTitle>
              <Badge variant="outline">{templates.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Sparkles className="size-10 mb-3 opacity-30" />
                <p className="text-sm">{t("serviceForm.noTemplates")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 space-y-3">

                    {/* Names + active + delete */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={template.nameTr}
                        onChange={(e) => patch(template.id, { nameTr: e.target.value })}
                        onBlur={() => save(template)}
                        className="flex-1 min-w-0 font-medium"
                      />
                      <Input
                        value={template.nameEn}
                        onChange={(e) => patch(template.id, { nameEn: e.target.value })}
                        onBlur={() => save(template)}
                        className="flex-1 min-w-0 text-muted-foreground"
                      />
                      <Switch
                        checked={template.active}
                        onCheckedChange={(active) => {
                          patch(template.id, { active })
                          void save({ ...template, active })
                        }}
                        title={t("serviceForm.templateActive")}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            disabled={deletingId === template.id}
                          >
                            {deletingId === template.id
                              ? <Loader2 className="size-4 animate-spin" />
                              : <Trash2 className="size-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("serviceForm.deleteTemplateTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("serviceForm.deleteTemplateDesc", { name: template.nameTr })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("serviceForm.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(template.id)}
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Prompt hint + examples */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1.5 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          {t("serviceForm.templatePromptHint")}
                        </Label>
                        <Textarea
                          value={template.promptHint ?? ""}
                          onChange={(e) => patch(template.id, { promptHint: e.target.value })}
                          onBlur={() => save(template)}
                          placeholder={t("serviceForm.templatePromptHintPlaceholder")}
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          {t("serviceForm.templateFaultExample")}
                        </Label>
                        <Textarea
                          value={template.faultExample ?? ""}
                          onChange={(e) => patch(template.id, { faultExample: e.target.value })}
                          onBlur={() => save(template)}
                          placeholder={t("serviceForm.templateFaultExamplePlaceholder")}
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-col space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          {t("serviceForm.templateServiceExample")}
                        </Label>
                        <Textarea
                          value={template.serviceExample ?? ""}
                          onChange={(e) => patch(template.id, { serviceExample: e.target.value })}
                          onBlur={() => save(template)}
                          placeholder={t("serviceForm.templateServiceExamplePlaceholder")}
                          rows={2}
                        />
                      </div>
                    </div>

                    <SuggestedComponents
                      template={template}
                      onChange={(suggestedComponents) => patch(template.id, { suggestedComponents })}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function SuggestedComponents({
  template, onChange,
}: {
  template: ServiceFormTemplateDto
  onChange: (components: ServiceFormTemplateDto["suggestedComponents"]) => void
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState("")
  const [quantity, setQuantity] = React.useState(1)
  const [busy, setBusy] = React.useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setBusy(true)
    try {
      const added = await addTemplateComponent(template.id, name.trim(), quantity)
      const exists = template.suggestedComponents.some((c) => c.id === added.id)
      onChange(exists ? template.suggestedComponents : [...template.suggestedComponents, added])
      setName("")
      setQuantity(1)
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(templateComponentId: string) {
    try {
      await removeTemplateComponent(template.id, templateComponentId)
      onChange(template.suggestedComponents.filter((c) => c.id !== templateComponentId))
    } catch (err) {
      toast.error(t("serviceForm.deleteFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  return (
    <div className="flex flex-col space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {t("serviceForm.templateSuggestedComponents")}
      </Label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {template.suggestedComponents.map((component) => (
          <Badge key={component.id} variant="secondary" className="gap-1.5 py-1">
            {component.componentName}
            <span className="text-muted-foreground">× {component.defaultQuantity}</span>
            <button
              type="button"
              onClick={() => handleRemove(component.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); void handleAdd() }
          }}
          placeholder={t("serviceForm.componentNamePlaceholder")}
          disabled={busy}
          className="h-8 w-44"
        />
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={busy}
          className="h-8 w-20"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        </Button>
      </div>
    </div>
  )
}
