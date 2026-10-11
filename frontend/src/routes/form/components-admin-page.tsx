import React from "react"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { Package, Plus, Trash2, Loader2 } from "lucide-react"
import type { Route } from "./+types/components-admin-page"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { AddFieldPopover, FieldChip, type ComponentFieldType } from "~/components/form/component-field-editor"

import {
  getComponentsAdmin,
  createComponentAdmin,
  renameComponentAdmin,
  deleteComponentAdmin,
  type ComponentAdmin,
} from "~/functions/form/get_components_admin"

export async function clientLoader(): Promise<{ components: ComponentAdmin[] }> {
  try {
    const components = await getComponentsAdmin()
    return { components }
  } catch (error) {
    toast.error(i18n.t("serviceForm.loadComponentsFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return { components: [] }
  }
}

export default function ComponentsAdminPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation()
  const [components, setComponents] = React.useState<ComponentAdmin[]>(loaderData.components)
  const [newName, setNewName] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const originalNamesRef = React.useRef<Record<string, string>>(
    Object.fromEntries(loaderData.components.map((c) => [c.id, c.name])),
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      const created = await createComponentAdmin(newName.trim())
      originalNamesRef.current[created.id] = created.name
      setComponents((prev) => [created, ...prev])
      setNewName("")
      toast.success(t("serviceForm.componentAdded"), { description: created.name })
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setIsAdding(false)
    }
  }

  function handleNameChange(id: string, value: string) {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, name: value } : c)))
  }

  async function handleNameBlur(id: string) {
    const component = components.find((c) => c.id === id)
    if (!component) return
    const original = originalNamesRef.current[id]
    const trimmed = component.name.trim()

    if (!trimmed) {
      handleNameChange(id, original)
      return
    }
    if (trimmed === original) return

    try {
      const updated = await renameComponentAdmin(id, trimmed)
      originalNamesRef.current[id] = updated.name
      setComponents((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      handleNameChange(id, original)
      toast.error(t("serviceForm.updateFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteComponentAdmin(id)
      delete originalNamesRef.current[id]
      setComponents((prev) => prev.filter((c) => c.id !== id))
      toast.success(t("serviceForm.componentDeleted"))
    } catch (err) {
      toast.error(t("serviceForm.deleteFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setDeletingId(null)
    }
  }

  function handleFieldAdded(componentId: string, field: { id: string; label: string; fieldType: ComponentFieldType; orderIndex: number }) {
    setComponents((prev) => prev.map((c) =>
      c.id === componentId ? { ...c, fields: [...c.fields, field] } : c,
    ))
  }

  function handleFieldUpdated(componentId: string, field: { id: string; label: string; fieldType: ComponentFieldType }) {
    setComponents((prev) => prev.map((c) =>
      c.id === componentId
        ? { ...c, fields: c.fields.map((f) => (f.id === field.id ? { ...f, ...field } : f)) }
        : c,
    ))
  }

  function handleFieldDeleted(componentId: string, fieldId: string) {
    setComponents((prev) => prev.map((c) =>
      c.id === componentId ? { ...c, fields: c.fields.filter((f) => f.id !== fieldId) } : c,
    ))
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("serviceForm.componentsTitle")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("serviceForm.componentsSubtitle")}
          </p>
        </div>

        {/* Add form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              {t("serviceForm.addComponentTitle")}
            </CardTitle>
            <CardDescription>
              {t("serviceForm.addComponentDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
              <div className="flex flex-col space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="componentName">
                  {t("serviceForm.productName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="componentName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("serviceForm.componentNamePlaceholder")}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isAdding || !newName.trim()}>
                  {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 mr-1" />}
                  {t("serviceForm.addButton")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Components list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4" />
                {t("serviceForm.componentListTitle")}
              </CardTitle>
              <Badge variant="outline">{components.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {components.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="size-10 mb-3 opacity-30" />
                <p className="text-sm">{t("serviceForm.noComponents")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {components.map((c) => (
                  <div key={c.id} className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={c.name}
                        onChange={(e) => handleNameChange(c.id, e.target.value)}
                        onBlur={() => handleNameBlur(c.id)}
                        className="flex-1 min-w-0 font-medium border-transparent hover:border-input focus-visible:border-input shadow-none px-2 -mx-2"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            disabled={deletingId === c.id}
                          >
                            {deletingId === c.id
                              ? <Loader2 className="size-4 animate-spin" />
                              : <Trash2 className="size-4" />
                            }
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("serviceForm.deleteComponentTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("serviceForm.deleteComponentDesc", { name: c.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("serviceForm.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(c.id)}
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {c.fields.map((f) => (
                        <FieldChip
                          key={f.id}
                          componentId={c.id}
                          field={f}
                          onUpdated={(field) => handleFieldUpdated(c.id, field)}
                          onDeleted={(fieldId) => handleFieldDeleted(c.id, fieldId)}
                        />
                      ))}
                      <AddFieldPopover
                        componentId={c.id}
                        onAdded={(field) => handleFieldAdded(c.id, field)}
                      />
                    </div>
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
