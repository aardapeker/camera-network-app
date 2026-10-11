import { useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { format } from "date-fns"
import { ClipboardList, Eye, Plus } from "lucide-react"
import type { Route } from "./+types/service-forms-list-page"

import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "~/components/ui/table"
import { getServiceForms, type ServiceFormListItem } from "~/functions/form/get_service_forms"
import { SERVICE_PORTAL_FORMS } from "~/lib/service-portal"

export async function clientLoader(
  { request }: Route.ClientLoaderArgs,
): Promise<{ forms: ServiceFormListItem[] }> {
  try {
    // Outside the admin panel this page is the technician's own list.
    const mine = !new URL(request.url).pathname.startsWith("/admin")
    const forms = await getServiceForms({ mine })
    return { forms }
  } catch (error) {
    toast.error(i18n.t("serviceForm.loadFormsFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return { forms: [] }
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

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  CONTRACTED: "default",
  PAID: "default",
  FREE: "secondary",
  TECHNICAL_SUPPORT: "outline",
  NEW_INSTALLATION: "secondary",
}

export default function ServiceFormsListPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { forms } = loaderData

  // The same page backs the admin list (/admin/service-forms) and the
  // technician's own list (/form/my-forms); detail links stay in whichever one
  // the user is looking at.
  const isAdminView = pathname.startsWith("/admin")
  const detailPath = (id: string) =>
    isAdminView ? `/admin/service-forms/${id}` : `${SERVICE_PORTAL_FORMS}/${id}`

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdminView ? t("serviceForm.listTitle") : t("serviceForm.myForms")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("serviceForm.totalForms", { count: forms.length })}
            </p>
          </div>
          <Button onClick={() => navigate("/form/service")}>
            <Plus className="size-4 mr-2" />
            {t("serviceForm.newForm")}
          </Button>
        </div>

        {forms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="size-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">{t("serviceForm.noFormsYet")}</p>
              <p className="text-sm mt-1">{t("serviceForm.noFormsHint")}</p>
              <Button className="mt-6" onClick={() => navigate("/form/service")}>
                <Plus className="size-4 mr-2" />
                {t("serviceForm.createNewForm")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                {isAdminView ? t("serviceForm.allForms") : t("serviceForm.myForms")}
              </CardTitle>
              <CardDescription>{t("serviceForm.newestFirst")}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("serviceForm.colDate")}</TableHead>
                    <TableHead>{t("serviceForm.colCustomer")}</TableHead>
                    <TableHead>{t("serviceForm.colContact")}</TableHead>
                    <TableHead>{t("serviceForm.colPhone")}</TableHead>
                    <TableHead>{t("serviceForm.colLocation")}</TableHead>
                    <TableHead>{t("serviceForm.colStatus")}</TableHead>
                    <TableHead>{t("serviceForm.colTechnician")}</TableHead>
                    <TableHead className="text-right">{t("serviceForm.colAction")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form) => (
                    <TableRow
                      key={form.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(detailPath(form.id))}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {form.serviceDate
                          ? format(new Date(form.serviceDate), "dd.MM.yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {form.customerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {form.contactPerson || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {form.phone || "—"}
                      </TableCell>
                      <TableCell>
                        {form.serviceLocation
                          ? <Badge variant="outline">{LOCATION_LABEL_KEYS[form.serviceLocation] ? t(LOCATION_LABEL_KEYS[form.serviceLocation]) : form.serviceLocation}</Badge>
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {form.serviceStatus
                          ? <Badge variant={STATUS_VARIANTS[form.serviceStatus] ?? "secondary"}>
                              {STATUS_LABEL_KEYS[form.serviceStatus] ? t(STATUS_LABEL_KEYS[form.serviceStatus]) : form.serviceStatus}
                            </Badge>
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {form.technicianUsername || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(detailPath(form.id))
                          }}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
