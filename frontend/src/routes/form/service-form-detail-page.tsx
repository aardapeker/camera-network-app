import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { format } from "date-fns"
import { ArrowLeft, ClipboardList } from "lucide-react"
import type { Route } from "./+types/service-form-detail-page"

import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table"
import { Separator } from "~/components/ui/separator"
import { getServiceForm, type ServiceFormDetail } from "~/functions/form/get_service_form"

export async function clientLoader({ params }: Route.ClientLoaderArgs): Promise<{ form: ServiceFormDetail }> {
  try {
    const form = await getServiceForm(params.id as string)
    return { form }
  } catch (error) {
    toast.error(i18n.t("serviceForm.loadFormFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    throw error
  }
}

const LOCATION_LABEL_KEYS: Record<string, string> = {
  ON_SITE: "serviceForm.locationOnSite",
  IN_SERVICE: "serviceForm.locationInService",
  REMOTE: "serviceForm.locationRemote",
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  CONTRACTED: "serviceForm.statusContracted",
  PAID: "serviceForm.statusPaid",
  FREE: "serviceForm.statusFree",
  TECHNICAL_SUPPORT: "serviceForm.statusTechnicalSupport",
  NEW_INSTALLATION: "serviceForm.statusNewInstallation",
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex py-2.5 border-b border-border/50 last:border-0">
      <span className="w-44 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export default function ServiceFormDetailPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { form } = loaderData

  const formatDate = (d?: string) => d ? format(new Date(d), "dd.MM.yyyy") : "—"
  const formatTime = (t?: string) => t ? t.substring(0, 5) : "—"

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{form.customerName}</h1>
              {form.serviceLocation && (
                <Badge variant="outline">{LOCATION_LABEL_KEYS[form.serviceLocation] ? t(LOCATION_LABEL_KEYS[form.serviceLocation]) : form.serviceLocation}</Badge>
              )}
              {form.serviceStatus && (
                <Badge>{STATUS_LABEL_KEYS[form.serviceStatus] ? t(STATUS_LABEL_KEYS[form.serviceStatus]) : form.serviceStatus}</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {formatDate(form.serviceDate)} · {t("serviceForm.technicianLabel")}: {form.technicianUsername ?? "—"}
            </p>
          </div>
        </div>

        <div className="space-y-6">

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="size-4" />
                {t("serviceForm.customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label={t("serviceForm.customerName")} value={form.customerName} />
              <InfoRow label={t("serviceForm.contactPerson")} value={form.contactPerson} />
              <InfoRow label={t("serviceForm.phone")} value={form.phone} />
              <InfoRow label={t("serviceForm.email")} value={form.email} />
              <InfoRow label={t("serviceForm.address")} value={form.address} />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("serviceForm.dateTime")}</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label={t("serviceForm.date")} value={formatDate(form.serviceDate)} />
              <InfoRow label={t("serviceForm.arrivalTime")} value={formatTime(form.arrivalTime)} />
              <InfoRow label={t("serviceForm.deliveryTime")} value={formatTime(form.deliveryTime)} />
              <InfoRow label={t("serviceForm.staffCount")} value={form.staffCount} />
            </CardContent>
          </Card>

          {/* Service Details */}
          {(form.faultDescription || form.serviceDescription || form.notification) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serviceForm.serviceDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.faultDescription && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("serviceForm.faultDescription")}</p>
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-lg px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">{form.faultDescription}</p>
                    </div>
                  </div>
                )}
                {form.serviceDescription && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("serviceForm.serviceDescription")}</p>
                    <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">{form.serviceDescription}</p>
                    </div>
                  </div>
                )}
                {form.notification && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("serviceForm.notification")}</p>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">{form.notification}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Products */}
          {form.products && form.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serviceForm.products")}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("serviceForm.productName")}</TableHead>
                      <TableHead className="text-center">{t("serviceForm.quantity")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.products.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium align-top">
                          {p.productName}
                          {p.fieldValues.filter((fv) => fv.value).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-normal text-muted-foreground">
                              {p.fieldValues.filter((fv) => fv.value).map((fv) => (
                                <span key={fv.label}>{fv.label}: {fv.value}</span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold align-top">{p.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Delivery Notes */}
          {form.deliveryNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serviceForm.deliveryNotes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <p className="text-sm whitespace-pre-wrap">{form.deliveryNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signatures */}
          {(form.customerSignature || form.technicianSignature) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("serviceForm.signatures")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("serviceForm.customerSignature")}</p>
                    {form.customerSignature ? (
                      <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-800 p-2">
                        <img src={form.customerSignature} alt={t("serviceForm.customerSignature")} className="w-full h-32 object-contain dark:invert" />
                      </div>
                    ) : (
                      <div className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">{t("serviceForm.noSignature")}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("serviceForm.technicianSignature")}</p>
                    {form.technicianSignature ? (
                      <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-800 p-2">
                        <img src={form.technicianSignature} alt={t("serviceForm.technicianSignature")} className="w-full h-32 object-contain dark:invert" />
                      </div>
                    ) : (
                      <div className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                        <span className="text-sm text-muted-foreground">{t("serviceForm.noSignature")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Separator />
          <p className="text-xs text-muted-foreground text-center pb-8">
            {t("serviceForm.createdAt")}: {form.createdAt ? format(new Date(form.createdAt), "dd.MM.yyyy HH:mm") : "—"}
            {form.updatedAt && form.updatedAt !== form.createdAt &&
              ` · ${t("serviceForm.updatedAt")}: ${format(new Date(form.updatedAt), "dd.MM.yyyy HH:mm")}`}
          </p>

        </div>
      </div>
    </div>
  )
}
