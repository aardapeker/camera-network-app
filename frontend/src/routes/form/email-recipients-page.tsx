import React from "react"
import { useTranslation, Trans } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { Mail, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from "lucide-react"
import type { Route } from "./+types/email-recipients-page"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Badge } from "~/components/ui/badge"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

import {
  getEmailRecipients,
  addEmailRecipient,
  toggleEmailRecipient,
  deleteEmailRecipient,
  type EmailRecipient,
} from "~/functions/form/get_email_recipients"

export async function clientLoader(): Promise<{ recipients: EmailRecipient[] }> {
  try {
    const recipients = await getEmailRecipients()
    return { recipients }
  } catch (error) {
    toast.error(i18n.t("serviceForm.addRecipientsFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return { recipients: [] }
  }
}

export default function EmailRecipientsPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation()
  const [recipients, setRecipients] = React.useState<EmailRecipient[]>(loaderData.recipients)
  const [email, setEmail] = React.useState("")
  const [label, setLabel] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsAdding(true)
    try {
      const added = await addEmailRecipient(email.trim(), label.trim())
      setRecipients((prev) => [added, ...prev])
      setEmail("")
      setLabel("")
      toast.success(t("serviceForm.recipientAdded"), { description: added.email })
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), { description: err instanceof Error ? err.message : t("serviceForm.unknownError") })
    } finally {
      setIsAdding(false)
    }
  }

  async function handleToggle(id: string) {
    setTogglingId(id)
    try {
      const updated = await toggleEmailRecipient(id)
      setRecipients((prev) => prev.map((r) => r.id === id ? updated : r))
    } catch (err) {
      toast.error(t("serviceForm.updateFailed"), { description: err instanceof Error ? err.message : t("serviceForm.unknownError") })
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteEmailRecipient(id)
      setRecipients((prev) => prev.filter((r) => r.id !== id))
      toast.success(t("serviceForm.recipientDeleted"))
    } catch (err) {
      toast.error(t("serviceForm.deleteFailed"), { description: err instanceof Error ? err.message : t("serviceForm.unknownError") })
    } finally {
      setDeletingId(null)
    }
  }

  const activeCount = recipients.filter((r) => r.active).length

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("serviceForm.recipientsTitle")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("serviceForm.recipientsSubtitle")}
          </p>
        </div>

        {/* Add form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              {t("serviceForm.addRecipientTitle")}
            </CardTitle>
            <CardDescription>
              {t("serviceForm.addRecipientDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
              <div className="flex flex-col space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="email">{t("serviceForm.email")} <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("serviceForm.emailPlaceholder")}
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="flex flex-col space-y-1.5 flex-1 min-w-36">
                <Label htmlFor="label">{t("serviceForm.labelField")}</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t("serviceForm.labelPlaceholder")}
                  disabled={isAdding}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isAdding || !email.trim()}>
                  {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 mr-1" />}
                  {t("serviceForm.addButton")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Recipients list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="size-4" />
                {t("serviceForm.recipientListTitle")}
              </CardTitle>
              <Badge variant="outline">
                {t("serviceForm.activeOfTotal", { active: activeCount, total: recipients.length })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recipients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Mail className="size-10 mb-3 opacity-30" />
                <p className="text-sm">{t("serviceForm.noRecipients")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("serviceForm.email")}</TableHead>
                    <TableHead>{t("serviceForm.labelField")}</TableHead>
                    <TableHead className="text-center">{t("serviceForm.statusColumn")}</TableHead>
                    <TableHead className="text-right">{t("serviceForm.actionsColumn")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => (
                    <TableRow key={r.id} className={!r.active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{r.email}</TableCell>
                      <TableCell className="text-muted-foreground">{r.label || "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={r.active ? "default" : "secondary"}>
                          {r.active ? t("serviceForm.active") : t("serviceForm.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title={r.active ? t("serviceForm.makeInactive") : t("serviceForm.makeActive")}
                            onClick={() => handleToggle(r.id)}
                            disabled={togglingId === r.id}
                          >
                            {togglingId === r.id
                              ? <Loader2 className="size-4 animate-spin" />
                              : r.active
                                ? <ToggleRight className="size-4 text-primary" />
                                : <ToggleLeft className="size-4 text-muted-foreground" />
                            }
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === r.id}
                              >
                                {deletingId === r.id
                                  ? <Loader2 className="size-4 animate-spin" />
                                  : <Trash2 className="size-4" />
                                }
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("serviceForm.deleteRecipientTitle")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <Trans
                                    i18nKey="serviceForm.deleteRecipientDesc"
                                    values={{ email: r.email }}
                                    components={[<strong />]}
                                  />
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("serviceForm.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDelete(r.id)}
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
