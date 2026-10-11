import React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  ClipboardList, Plus, Trash2, CalendarIcon, Loader2, PenLine, X, Sparkles,
} from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "~/components/ui/popover"
import { Calendar } from "~/components/ui/calendar"
import { cn } from "~/lib/utils"

import {
  submitServiceForm,
  type ServiceFormProductDto,
  type ServiceLocation,
  type ServiceFormStatus,
} from "~/functions/form/submit_service_form"
import { SignatureModal } from "~/components/form/signature-modal"
import { AsyncCombobox } from "~/components/form/async-combobox"
import { AddComponentModal } from "~/components/form/add-component-modal"
import { AddCustomerModal } from "~/components/form/add-customer-modal"
import { MicInput } from "~/components/form/mic-input"
import { MicTextarea } from "~/components/form/mic-textarea"
import { MicButton } from "~/components/form/mic-button"
import { TemplateDraftDialog } from "~/components/form/template-draft-dialog"
import { searchComponents, type ComponentDto } from "~/functions/component/search_components"
import { searchCustomers, type CustomerSiteDto } from "~/functions/customer/search_customers"
import type { TemplateDraftDto } from "~/functions/form/get_service_form_templates"
import { SERVICE_PORTAL_FORMS, isServicePortalHost } from "~/lib/service-portal"

interface ProductFieldValue {
  label: string
  fieldType: "TEXT" | "NUMBER"
  value: string
}

interface Product {
  productName: string
  quantity: number
  fieldValues: ProductFieldValue[]
}

const emptyProduct = (): Product => ({ productName: "", quantity: 1, fieldValues: [] })

const today = new Date()
const nowTime = format(today, "HH:mm")

export default function ServiceFormPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // --- Basic fields ---
  const [customerName, setCustomerName] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")

  // --- Date / time ---
  const [serviceDate, setServiceDate] = React.useState<Date>(today)
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const [arrivalTime, setArrivalTime] = React.useState(nowTime)
  const [deliveryTime, setDeliveryTime] = React.useState(nowTime)

  // --- Service details ---
  const [notification, setNotification] = React.useState("")
  const [staffCount, setStaffCount] = React.useState<number>(1)
  const [serviceLocation, setServiceLocation] = React.useState<ServiceLocation>("ON_SITE")
  const [serviceStatus, setServiceStatus] = React.useState<ServiceFormStatus>("CONTRACTED")
  const [faultDescription, setFaultDescription] = React.useState("")
  const [serviceDescription, setServiceDescription] = React.useState("")
  const [deliveryNotes, setDeliveryNotes] = React.useState("")

  // --- Signatures ---
  const [customerSignature, setCustomerSignature] = React.useState("")
  const [technicianSignature, setTechnicianSignature] = React.useState("")
  const [sigModal, setSigModal] = React.useState<"customer" | "technician" | null>(null)

  // --- Products ---
  const [products, setProducts] = React.useState<Product[]>([emptyProduct()])

  const addProduct = () => setProducts((p) => [...p, emptyProduct()])
  const removeProduct = (i: number) => setProducts((p) => p.filter((_, idx) => idx !== i))
  const updateProduct = (i: number, field: keyof Product, value: string | number) =>
    setProducts((p) => p.map((prod, idx) => (idx === i ? { ...prod, [field]: value } : prod)))

  const selectProductComponent = (i: number, component: ComponentDto) =>
    setProducts((p) => p.map((prod, idx) => (idx === i ? {
      ...prod,
      productName: component.name,
      fieldValues: component.fields.map((f) => ({ label: f.label, fieldType: f.fieldType, value: "" })),
    } : prod)))

  const updateProductFieldValue = (i: number, label: string, value: string) =>
    setProducts((p) => p.map((prod, idx) => (idx === i ? {
      ...prod,
      fieldValues: prod.fieldValues.map((fv) => (fv.label === label ? { ...fv, value } : fv)),
    } : prod)))

  const [addComponentModal, setAddComponentModal] = React.useState<{ productIndex: number; name: string } | null>(null)

  // --- Customer directory ---
  const [addCustomerModal, setAddCustomerModal] = React.useState<string | null>(null)

  const selectCustomerSite = (site: CustomerSiteDto) => {
    setCustomerName(site.customerName)
    if (site.address) setAddress(site.address)
    if (site.contactPerson) setContactPerson(site.contactPerson)
    if (site.phone) setPhone(site.phone)
  }

  // --- AI template draft ---
  const [draftOpen, setDraftOpen] = React.useState(false)

  const applyDraft = (draft: TemplateDraftDto) => {
    if (draft.faultDescription) setFaultDescription(draft.faultDescription)
    if (draft.serviceDescription) setServiceDescription(draft.serviceDescription)
    if (draft.deliveryNotes) setDeliveryNotes(draft.deliveryNotes)

    if (draft.customer) selectCustomerSite(draft.customer)

    if (draft.products.length > 0) {
      const drafted: Product[] = draft.products.map((p) => ({
        productName: p.productName,
        quantity: p.quantity,
        fieldValues: p.fields.map((f) => ({
          label: f.label,
          fieldType: f.fieldType,
          value: f.value,
        })),
      }))
      // Replace the untouched starter rows, otherwise append to what's already there.
      setProducts((prev) => {
        const kept = prev.filter((p) => p.productName.trim())
        return [...kept, ...drafted]
      })
    }
  }

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      toast.error(t("serviceForm.customerNameRequired"))
      return
    }

    setIsSubmitting(true)
    try {
      const validProducts: ServiceFormProductDto[] = products
        .filter((p) => p.productName.trim())
        .map((p) => ({
          productName: p.productName,
          quantity: p.quantity,
          fieldValues: p.fieldValues,
        }))

      await submitServiceForm({
        customerName,
        contactPerson,
        phone,
        email,
        address,
        serviceDate: format(serviceDate, "yyyy-MM-dd"),
        arrivalTime,
        deliveryTime,
        notification,
        staffCount,
        serviceLocation,
        serviceStatus,
        faultDescription,
        serviceDescription,
        deliveryNotes,
        customerSignature,
        technicianSignature,
        products: validProducts,
      })

      toast.success(t("serviceForm.formSubmitted"), {
        description: t("serviceForm.formSubmittedDesc", { name: customerName }),
      })

      // On the portal host the form is the landing page, so there is nothing
      // useful to go "back" to - show the technician what they just submitted.
      if (isServicePortalHost()) {
        navigate(SERVICE_PORTAL_FORMS)
      } else {
        navigate(-1)
      }
    } catch (err) {
      toast.error(t("serviceForm.submitFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background custom-scrollbar">
      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t("serviceForm.formPageTitle")}</h1>
            <p className="text-muted-foreground mt-2">
              {t("serviceForm.formPageSubtitle")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => setDraftOpen(true)}
            disabled={isSubmitting}
          >
            <Sparkles className="size-4 mr-2" />
            {t("serviceForm.draftButton")}
          </Button>
        </div>

        <TemplateDraftDialog
          open={draftOpen}
          onOpenChange={setDraftOpen}
          customerName={customerName}
          serviceDate={format(serviceDate, "yyyy-MM-dd")}
          onApply={applyDraft}
        />

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Customer Info ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-5" />
                {t("serviceForm.customerInfo")}
              </CardTitle>
              <CardDescription>{t("serviceForm.customerInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="customerName">
                    {t("serviceForm.customerName")} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <AsyncCombobox
                      id="customerName"
                      value={customerName}
                      onValueChange={setCustomerName}
                      onSelectItem={selectCustomerSite}
                      search={searchCustomers}
                      onAddNew={(query) => setAddCustomerModal(query)}
                      placeholder={t("serviceForm.customerNamePlaceholder")}
                      disabled={isSubmitting}
                      addNewLabel={(query) => t("serviceForm.addNewCustomer", { name: query })}
                      noResultsLabel={t("serviceForm.noCustomersFound")}
                      loadingLabel={t("serviceForm.loadingCustomers")}
                      inputClassName="pr-9"
                    />
                    <MicButton
                      onResult={(text) => setCustomerName(`${customerName} ${text}`.trim())}
                      disabled={isSubmitting}
                      className="absolute right-0.5 top-1/2 -translate-y-1/2"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="contactPerson">{t("serviceForm.contactPerson")}</Label>
                  <MicInput
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={t("serviceForm.contactPersonPlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="phone">{t("serviceForm.phone")}</Label>
                  <MicInput
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 555 000 00 00"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">{t("serviceForm.email")}</Label>
                  <MicInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="musteri@firma.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="address">{t("serviceForm.address")}</Label>
                <MicTextarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("serviceForm.addressPlaceholder")}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

            </CardContent>
          </Card>

          {/* ── Scheduling ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t("serviceForm.dateTime")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Date picker */}
                <div className="flex flex-col space-y-1.5">
                  <Label>
                    {t("serviceForm.date")} <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !serviceDate && "text-muted-foreground",
                        )}
                        disabled={isSubmitting}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {serviceDate ? format(serviceDate, "dd.MM.yyyy") : t("serviceForm.selectDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={serviceDate}
                        onSelect={(d) => {
                          if (d) { setServiceDate(d); setCalendarOpen(false) }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Arrival time */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="arrivalTime">{t("serviceForm.arrivalTime")}</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Delivery time */}
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="deliveryTime">{t("serviceForm.deliveryTime")}</Label>
                  <Input
                    id="deliveryTime"
                    type="time"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* ── Service Details ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t("serviceForm.serviceDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="flex flex-col space-y-1.5">
                  <Label>{t("serviceForm.serviceLocation")}</Label>
                  <Select
                    value={serviceLocation}
                    onValueChange={(v) => setServiceLocation(v as ServiceLocation)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON_SITE">{t("serviceForm.locationOnSite")}</SelectItem>
                      <SelectItem value="IN_SERVICE">{t("serviceForm.locationInService")}</SelectItem>
                      <SelectItem value="REMOTE">{t("serviceForm.locationRemote")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label>{t("serviceForm.serviceStatus")}</Label>
                  <Select
                    value={serviceStatus}
                    onValueChange={(v) => setServiceStatus(v as ServiceFormStatus)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTRACTED">{t("serviceForm.statusContracted")}</SelectItem>
                      <SelectItem value="PAID">{t("serviceForm.statusPaid")}</SelectItem>
                      <SelectItem value="FREE">{t("serviceForm.statusFree")}</SelectItem>
                      <SelectItem value="TECHNICAL_SUPPORT">{t("serviceForm.statusTechnicalSupport")}</SelectItem>
                      <SelectItem value="NEW_INSTALLATION">{t("serviceForm.statusNewInstallation")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="staffCount">{t("serviceForm.staffCount")}</Label>
                  <Input
                    id="staffCount"
                    type="number"
                    min={1}
                    value={staffCount}
                    onChange={(e) => setStaffCount(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>

              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="notification">{t("serviceForm.notification")}</Label>
                <MicInput
                  id="notification"
                  value={notification}
                  onChange={(e) => setNotification(e.target.value)}
                  placeholder={t("serviceForm.notificationPlaceholder")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="faultDescription">{t("serviceForm.faultDescription")}</Label>
                <MicTextarea
                  id="faultDescription"
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  placeholder={t("serviceForm.faultDescriptionPlaceholder")}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="serviceDescription">{t("serviceForm.serviceDescription")}</Label>
                <MicTextarea
                  id="serviceDescription"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder={t("serviceForm.serviceDescriptionPlaceholder")}
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="deliveryNotes">{t("serviceForm.deliveryNotes")}</Label>
                <MicTextarea
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={t("serviceForm.deliveryNotesPlaceholder")}
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

            </CardContent>
          </Card>

          {/* ── Products ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("serviceForm.products")}</CardTitle>
                  <CardDescription className="mt-1">{t("serviceForm.productsDesc")}</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProduct}
                  disabled={isSubmitting}
                >
                  <Plus className="size-4 mr-1" />
                  {t("serviceForm.add")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {products.map((product, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 flex flex-col space-y-1.5">
                      <Label className={i === 0 ? "" : "sr-only"}>{t("serviceForm.productName")}</Label>
                      <div className="relative">
                        <AsyncCombobox
                          value={product.productName}
                          onValueChange={(v) => updateProduct(i, "productName", v)}
                          onSelectItem={(item) => selectProductComponent(i, item)}
                          search={searchComponents}
                          onAddNew={(query) => setAddComponentModal({ productIndex: i, name: query })}
                          placeholder={t("serviceForm.productNamePlaceholder")}
                          disabled={isSubmitting}
                          addNewLabel={(query) => t("serviceForm.addNewComponent", { name: query })}
                          noResultsLabel={t("serviceForm.noComponentsFound")}
                          loadingLabel={t("serviceForm.loadingComponents")}
                          inputClassName="pr-9"
                        />
                        <MicButton
                          onResult={(text) => updateProduct(i, "productName", `${product.productName} ${text}`.trim())}
                          disabled={isSubmitting}
                          className="absolute right-0.5 top-1/2 -translate-y-1/2"
                        />
                      </div>
                    </div>
                    <div className="w-24 flex flex-col space-y-1.5">
                      <Label className={i === 0 ? "" : "sr-only"}>{t("serviceForm.quantity")}</Label>
                      <Input
                        type="number"
                        min={1}
                        value={product.quantity}
                        onChange={(e) => updateProduct(i, "quantity", Number(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive mb-0.5"
                      onClick={() => removeProduct(i)}
                      disabled={products.length === 1 || isSubmitting}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {product.fieldValues.length > 0 && (
                    <div className="flex gap-2 flex-wrap pl-1">
                      {product.fieldValues.map((fv) => (
                        <div key={fv.label} className="flex flex-col space-y-1 w-40">
                          <Label className="text-xs text-muted-foreground">{fv.label}</Label>
                          {fv.fieldType === "NUMBER" ? (
                            <Input
                              type="number"
                              step="any"
                              value={fv.value}
                              onChange={(e) => updateProductFieldValue(i, fv.label, e.target.value)}
                              disabled={isSubmitting}
                            />
                          ) : (
                            <MicInput
                              type="text"
                              value={fv.value}
                              onChange={(e) => updateProductFieldValue(i, fv.label, e.target.value)}
                              disabled={isSubmitting}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── Signatures ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t("serviceForm.signatures")}</CardTitle>
              <CardDescription>{t("serviceForm.signaturesDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Customer signature */}
                <div className="flex flex-col space-y-2">
                  <Label>{t("serviceForm.customerSignature")}</Label>
                  {customerSignature ? (
                    <div className="relative rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-800">
                      <img src={customerSignature} alt={t("serviceForm.customerSignature")} className="w-full h-32 object-contain dark:invert" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 size-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setCustomerSignature("")}
                        disabled={isSubmitting}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSigModal("customer")}
                      disabled={isSubmitting}
                      className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PenLine className="size-6" />
                      <span className="text-sm">{t("serviceForm.capture")}</span>
                    </button>
                  )}
                </div>

                {/* Technician signature */}
                <div className="flex flex-col space-y-2">
                  <Label>{t("serviceForm.technicianSignature")}</Label>
                  {technicianSignature ? (
                    <div className="relative rounded-lg border border-border overflow-hidden bg-white dark:bg-zinc-800">
                      <img src={technicianSignature} alt={t("serviceForm.technicianSignature")} className="w-full h-32 object-contain dark:invert" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 size-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setTechnicianSignature("")}
                        disabled={isSubmitting}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSigModal("technician")}
                      disabled={isSubmitting}
                      className="h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PenLine className="size-6" />
                      <span className="text-sm">{t("serviceForm.capture")}</span>
                    </button>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Signature modals */}
          <SignatureModal
            open={sigModal === "customer"}
            title={t("serviceForm.customerSignature")}
            onSave={(dataUrl) => setCustomerSignature(dataUrl)}
            onClose={() => setSigModal(null)}
          />
          <SignatureModal
            open={sigModal === "technician"}
            title={t("serviceForm.technicianSignature")}
            onSave={(dataUrl) => setTechnicianSignature(dataUrl)}
            onClose={() => setSigModal(null)}
          />

          <AddCustomerModal
            open={addCustomerModal !== null}
            name={addCustomerModal ?? ""}
            onOpenChange={(open) => { if (!open) setAddCustomerModal(null) }}
            onDone={(site) => { selectCustomerSite(site); setAddCustomerModal(null) }}
          />

          {addComponentModal && (
            <AddComponentModal
              open={!!addComponentModal}
              name={addComponentModal.name}
              onOpenChange={(open) => { if (!open) setAddComponentModal(null) }}
              onDone={(component) => {
                selectProductComponent(addComponentModal.productIndex, component)
                setAddComponentModal(null)
              }}
            />
          )}

          {/* ── Actions ── */}
          <div className="flex gap-4 pb-8">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              {t("serviceForm.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("serviceForm.submitting")}
                </>
              ) : (
                <>
                  <ClipboardList className="size-4 mr-2" />
                  {t("serviceForm.submitForm")}
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
