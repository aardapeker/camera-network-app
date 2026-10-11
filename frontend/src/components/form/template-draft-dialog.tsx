import React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Building2, Loader2, Sparkles, Trash2, Wand2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import { Textarea } from "~/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "~/components/ui/dialog"
import { MicTextarea } from "~/components/form/mic-textarea"
import { cn } from "~/lib/utils"

import {
  getServiceFormTemplates,
  draftFromTemplate,
  templateName,
  type ServiceFormTemplateDto,
  type TemplateDraftDto,
} from "~/functions/form/get_service_form_templates"

interface TemplateDraftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string
  serviceDate?: string
  onApply: (draft: TemplateDraftDto) => void
}

export function TemplateDraftDialog({
  open, onOpenChange, customerName, serviceDate, onApply,
}: TemplateDraftDialogProps) {
  const { t, i18n } = useTranslation()

  const [templates, setTemplates] = React.useState<ServiceFormTemplateDto[]>([])
  const [loadingTemplates, setLoadingTemplates] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState("")
  const [drafting, setDrafting] = React.useState(false)
  const [draft, setDraft] = React.useState<TemplateDraftDto | null>(null)

  // Load the template list the first time the dialog opens.
  React.useEffect(() => {
    if (!open || templates.length > 0 || loadingTemplates) return
    setLoadingTemplates(true)
    getServiceFormTemplates()
      .then(setTemplates)
      .catch((err) => {
        toast.error(t("serviceForm.loadTemplatesFailed"), {
          description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
        })
      })
      .finally(() => setLoadingTemplates(false))
  }, [open, templates.length, loadingTemplates, t])

  React.useEffect(() => {
    if (!open) {
      setNotes("")
      setDraft(null)
      setSelectedId(null)
    }
  }, [open])

  async function handleGenerate() {
    if (!selectedId || !notes.trim()) return
    setDrafting(true)
    try {
      const result = await draftFromTemplate({
        templateId: selectedId,
        notes: notes.trim(),
        language: i18n.language,
        customerName,
        serviceDate,
      })
      setDraft(result)
    } catch (err) {
      toast.error(t("serviceForm.draftFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setDrafting(false)
    }
  }

  function updateDraft(field: keyof TemplateDraftDto, value: string) {
    setDraft((d) => (d ? { ...d, [field]: value } : d))
  }

  function removeProduct(index: number) {
    setDraft((d) => (d ? { ...d, products: d.products.filter((_, i) => i !== index) } : d))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto custom-scrollbar sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            {t("serviceForm.draftTitle")}
          </DialogTitle>
          <DialogDescription>{t("serviceForm.draftDesc")}</DialogDescription>
        </DialogHeader>

        {draft ? (
          /* ── Review stage ── */
          <div className="space-y-4">
            {draft.customer && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-0.5">
                  <Building2 className="size-3.5" />
                  {t("serviceForm.draftMatchedCustomer")}
                </div>
                <div className="font-medium">{draft.customer.name}</div>
                {draft.customer.address && (
                  <div className="text-muted-foreground">{draft.customer.address}</div>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-1.5">
              <Label>{t("serviceForm.faultDescription")}</Label>
              <Textarea
                value={draft.faultDescription}
                onChange={(e) => updateDraft("faultDescription", e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label>{t("serviceForm.serviceDescription")}</Label>
              <Textarea
                value={draft.serviceDescription}
                onChange={(e) => updateDraft("serviceDescription", e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label>{t("serviceForm.deliveryNotes")}</Label>
              <Textarea
                value={draft.deliveryNotes}
                onChange={(e) => updateDraft("deliveryNotes", e.target.value)}
                rows={2}
              />
            </div>

            {draft.products.length > 0 && (
              <div className="flex flex-col space-y-1.5">
                <Label>{t("serviceForm.draftProducts")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {draft.products.map((product, i) => (
                    <Badge key={`${product.productName}-${i}`} variant="secondary" className="gap-1.5 py-1">
                      {product.productName}
                      {product.fields.filter((f) => f.value).map((f) => (
                        <span key={f.label} className="text-muted-foreground">
                          {f.label}: {f.value}
                        </span>
                      ))}
                      <span className="text-muted-foreground">× {product.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeProduct(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t("serviceForm.draftReviewHint")}</p>
          </div>
        ) : (
          /* ── Input stage ── */
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <Label>{t("serviceForm.draftPickTemplate")}</Label>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">{t("serviceForm.noTemplates")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedId(template.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                        selectedId === template.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary/50 hover:bg-muted/50",
                      )}
                    >
                      {templateName(template, i18n.language)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="draftNotes">{t("serviceForm.draftNotes")}</Label>
              <MicTextarea
                id="draftNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("serviceForm.draftNotesPlaceholder")}
                rows={5}
                disabled={drafting}
              />
              <p className="text-xs text-muted-foreground">{t("serviceForm.draftNotesHint")}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          {draft ? (
            <>
              <Button type="button" variant="outline" onClick={() => setDraft(null)}>
                {t("serviceForm.draftBack")}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onApply(draft)
                  onOpenChange(false)
                }}
              >
                {t("serviceForm.draftApply")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedId || !notes.trim() || drafting}
            >
              {drafting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("serviceForm.draftGenerating")}
                </>
              ) : (
                <>
                  <Wand2 className="size-4 mr-2" />
                  {t("serviceForm.draftGenerate")}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
