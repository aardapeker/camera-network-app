import { Form, redirect } from "react-router"
import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "~/components/ui/card"
import getCurrentUser from "~/functions/get_current_user"
import {
  canUseServicePortal,
  isServicePortalHost,
  landingPath,
} from "~/lib/service-portal"

// The main site lives on the same domain without the "servisform." prefix,
// unless VITE_MAIN_SITE_URL says otherwise.
function mainSiteUrl(): string {
  const configured = import.meta.env.VITE_MAIN_SITE_URL
  if (configured) return configured
  if (typeof window === "undefined") return "/"
  return window.location.origin.replace("//servisform.", "//")
}

export async function clientLoader() {
  // Only reachable as the dead end of the portal guard - anyone who does belong
  // here (or is on the main host) gets sent back where they came from.
  if (!isServicePortalHost()) throw redirect(landingPath())

  const currentUser = await getCurrentUser()
  if (canUseServicePortal(currentUser?.role)) throw redirect(landingPath())

  return null
}

clientLoader.hydrate = true as const

export default function PortalAccessDeniedPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-[440px]">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="size-5 text-destructive" />
          </div>
          <CardTitle>{t("servicePortal.deniedTitle")}</CardTitle>
          <CardDescription>{t("servicePortal.deniedDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <a href={mainSiteUrl()}>{t("servicePortal.goToMainSite")}</a>
          </Button>
          <Form method="post" action="/logout">
            <Button type="submit" variant="outline" className="w-full">
              {t("profile.logOut")}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
