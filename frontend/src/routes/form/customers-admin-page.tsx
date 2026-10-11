import React from "react"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import { toast } from "sonner"
import { Building2, Plus, Trash2, Loader2, MapPin } from "lucide-react"
import type { Route } from "./+types/customers-admin-page"

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

import {
  getCustomersAdmin,
  createCustomerAdmin,
  updateCustomerAdmin,
  deleteCustomerAdmin,
  addCustomerSite,
  updateCustomerSite,
  deleteCustomerSite,
  type CustomerAdmin,
} from "~/functions/customer/get_customers_admin"
import type { CustomerSiteDto } from "~/functions/customer/search_customers"

export async function clientLoader(): Promise<{ customers: CustomerAdmin[] }> {
  try {
    return { customers: await getCustomersAdmin() }
  } catch (error) {
    toast.error(i18n.t("serviceForm.loadCustomersFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return { customers: [] }
  }
}

export default function CustomersAdminPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation()
  const [customers, setCustomers] = React.useState<CustomerAdmin[]>(loaderData.customers)
  const [newName, setNewName] = React.useState("")
  const [newShortName, setNewShortName] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const savedRef = React.useRef<Record<string, string>>(
    Object.fromEntries(loaderData.customers.map((c) => [c.id, `${c.name}|${c.shortName ?? ""}`])),
  )

  function patch(id: string, changes: Partial<CustomerAdmin>) {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...changes } : c)))
  }

  async function saveCustomer(customer: CustomerAdmin) {
    const signature = `${customer.name}|${customer.shortName ?? ""}`
    if (savedRef.current[customer.id] === signature) return
    if (!customer.name.trim()) return

    try {
      const updated = await updateCustomerAdmin(customer.id, customer.name.trim(), customer.shortName)
      savedRef.current[updated.id] = `${updated.name}|${updated.shortName ?? ""}`
      patch(customer.id, { name: updated.name, shortName: updated.shortName })
    } catch (err) {
      toast.error(t("serviceForm.updateFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setIsAdding(true)
    try {
      const created = await createCustomerAdmin(newName.trim(), newShortName.trim() || undefined)
      savedRef.current[created.id] = `${created.name}|${created.shortName ?? ""}`
      setCustomers((prev) => [...prev, created])
      setNewName("")
      setNewShortName("")
      toast.success(t("serviceForm.customerAdded"), { description: created.name })
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
      await deleteCustomerAdmin(id)
      delete savedRef.current[id]
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast.success(t("serviceForm.customerDeleted"))
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
          <h1 className="text-3xl font-bold">{t("serviceForm.customersTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("serviceForm.customersSubtitle")}</p>
        </div>

        {/* Add customer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              {t("serviceForm.addCustomerTitle")}
            </CardTitle>
            <CardDescription>{t("serviceForm.addCustomerAdminDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
              <div className="flex flex-col space-y-1.5 flex-1 min-w-48">
                <Label htmlFor="newCustomer">
                  {t("serviceForm.customerName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newCustomer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Barsan Global Lojistik"
                  required
                  disabled={isAdding}
                />
              </div>
              <div className="flex flex-col space-y-1.5 flex-1 min-w-40">
                <Label htmlFor="newShortName">{t("serviceForm.customerShortName")}</Label>
                <Input
                  id="newShortName"
                  value={newShortName}
                  onChange={(e) => setNewShortName(e.target.value)}
                  placeholder="Barsan"
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

        {/* Customer list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                {t("serviceForm.customerListTitle")}
              </CardTitle>
              <Badge variant="outline">{customers.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="size-10 mb-3 opacity-30" />
                <p className="text-sm">{t("serviceForm.noCustomers")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {customers.map((customer) => (
                  <div key={customer.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={customer.name}
                        onChange={(e) => patch(customer.id, { name: e.target.value })}
                        onBlur={() => saveCustomer(customer)}
                        className="flex-1 min-w-0 font-medium"
                      />
                      <Input
                        value={customer.shortName ?? ""}
                        onChange={(e) => patch(customer.id, { shortName: e.target.value })}
                        onBlur={() => saveCustomer(customer)}
                        placeholder={t("serviceForm.customerShortName")}
                        className="w-40 text-muted-foreground"
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive hover:text-destructive"
                            disabled={deletingId === customer.id}
                          >
                            {deletingId === customer.id
                              ? <Loader2 className="size-4 animate-spin" />
                              : <Trash2 className="size-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("serviceForm.deleteCustomerTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("serviceForm.deleteCustomerDesc", { name: customer.name })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("serviceForm.cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(customer.id)}
                            >
                              {t("common.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <CustomerSites
                      customer={customer}
                      onChange={(sites) => patch(customer.id, { sites })}
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

function CustomerSites({
  customer, onChange,
}: {
  customer: CustomerAdmin
  onChange: (sites: CustomerSiteDto[]) => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const savedRef = React.useRef<Record<string, string>>({})

  function signature(site: CustomerSiteDto) {
    return [site.siteLabel, site.address, site.contactPerson, site.phone].join("|")
  }

  function patchSite(siteId: string, changes: Partial<CustomerSiteDto>) {
    onChange(customer.sites.map((s) => (s.id === siteId ? { ...s, ...changes } : s)))
  }

  async function saveSite(site: CustomerSiteDto) {
    if (savedRef.current[site.id] === signature(site)) return
    if (!site.siteLabel?.trim()) return
    try {
      const updated = await updateCustomerSite(customer.id, site.id, {
        label: site.siteLabel.trim(),
        address: site.address,
        contactPerson: site.contactPerson,
        phone: site.phone,
        email: site.email,
      })
      savedRef.current[site.id] = signature(updated)
      onChange(customer.sites.map((s) => (s.id === updated.id ? updated : s)))
    } catch (err) {
      toast.error(t("serviceForm.updateFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  async function handleAdd() {
    if (!label.trim()) return
    setBusy(true)
    try {
      const site = await addCustomerSite(customer.id, {
        label: label.trim(),
        address: address.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      savedRef.current[site.id] = signature(site)
      onChange([...customer.sites, site])
      setLabel("")
      setAddress("")
      setContactPerson("")
      setPhone("")
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(siteId: string) {
    try {
      await deleteCustomerSite(customer.id, siteId)
      onChange(customer.sites.filter((s) => s.id !== siteId))
    } catch (err) {
      toast.error(t("serviceForm.deleteFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    }
  }

  return (
    <div className="space-y-2 pl-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3.5" />
        {t("serviceForm.customerSites")}
      </Label>

      {customer.sites.map((site) => (
        <div key={site.id} className="flex gap-2 flex-wrap items-center">
          <Input
            value={site.siteLabel ?? ""}
            onChange={(e) => patchSite(site.id, { siteLabel: e.target.value })}
            onBlur={() => saveSite(site)}
            placeholder={t("serviceForm.siteLabelPlaceholder")}
            className="h-8 w-40"
          />
          <Input
            value={site.address ?? ""}
            onChange={(e) => patchSite(site.id, { address: e.target.value })}
            onBlur={() => saveSite(site)}
            placeholder={t("serviceForm.address")}
            className="h-8 flex-1 min-w-48"
          />
          <Input
            value={site.contactPerson ?? ""}
            onChange={(e) => patchSite(site.id, { contactPerson: e.target.value })}
            onBlur={() => saveSite(site)}
            placeholder={t("serviceForm.contactPerson")}
            className="h-8 w-36"
          />
          <Input
            value={site.phone ?? ""}
            onChange={(e) => patchSite(site.id, { phone: e.target.value })}
            onBlur={() => saveSite(site)}
            placeholder={t("serviceForm.phone")}
            className="h-8 w-36"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => handleRemove(site.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2 flex-wrap items-center">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleAdd() } }}
          placeholder={t("serviceForm.siteLabelPlaceholder")}
          disabled={busy}
          className="h-8 w-40"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("serviceForm.address")}
          disabled={busy}
          className="h-8 flex-1 min-w-48"
        />
        <Input
          value={contactPerson}
          onChange={(e) => setContactPerson(e.target.value)}
          placeholder={t("serviceForm.contactPerson")}
          disabled={busy}
          className="h-8 w-36"
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("serviceForm.phone")}
          disabled={busy}
          className="h-8 w-36"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} disabled={busy || !label.trim()}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        </Button>
      </div>
    </div>
  )
}
