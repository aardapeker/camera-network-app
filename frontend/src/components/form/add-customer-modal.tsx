import React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "~/components/ui/dialog"
import { quickAddCustomer, type CustomerSiteDto } from "~/functions/customer/search_customers"

interface AddCustomerModalProps {
  open: boolean
  /** What the technician typed into the customer field. */
  name: string
  onOpenChange: (open: boolean) => void
  onDone: (site: CustomerSiteDto) => void
}

export function AddCustomerModal({ open, name, onOpenChange, onDone }: AddCustomerModalProps) {
  const { t } = useTranslation()
  const [customerName, setCustomerName] = React.useState(name)
  const [siteLabel, setSiteLabel] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [contactPerson, setContactPerson] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setCustomerName(name)
      setSiteLabel("")
      setAddress("")
      setContactPerson("")
      setPhone("")
    }
  }, [open, name])

  async function handleSave() {
    if (!customerName.trim()) return
    setSaving(true)
    try {
      const site = await quickAddCustomer({
        customerName: customerName.trim(),
        siteLabel: siteLabel.trim() || undefined,
        address: address.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      onDone(site)
      onOpenChange(false)
    } catch (err) {
      toast.error(t("serviceForm.addFailed"), {
        description: err instanceof Error ? err.message : t("serviceForm.unknownError"),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("serviceForm.addCustomerTitle")}</DialogTitle>
          <DialogDescription>{t("serviceForm.addCustomerDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="newCustomerName">
              {t("serviceForm.customerName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newCustomerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="newSiteLabel">{t("serviceForm.siteLabel")}</Label>
              <Input
                id="newSiteLabel"
                value={siteLabel}
                onChange={(e) => setSiteLabel(e.target.value)}
                placeholder={t("serviceForm.siteLabelPlaceholder")}
                disabled={saving}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="newContactPerson">{t("serviceForm.contactPerson")}</Label>
              <Input
                id="newContactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="newCustomerAddress">{t("serviceForm.address")}</Label>
            <Input
              id="newCustomerAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="newCustomerPhone">{t("serviceForm.phone")}</Label>
            <Input
              id="newCustomerPhone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("serviceForm.cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !customerName.trim()}>
            {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            {t("serviceForm.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
