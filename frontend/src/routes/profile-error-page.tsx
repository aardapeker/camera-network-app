import { useRouteError, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export default function ProfileErrorPage() {
  const { t } = useTranslation()
  const error: unknown = useRouteError()
  const navigate = useNavigate()

  const message =
    (error as Error)?.message ||
    (error as { statusText?: string })?.statusText ||
    t("status.profileSomethingWentWrong")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t("status.oops")}</CardTitle>
          <CardDescription>
            {t("status.profileUnexpectedError")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center bg-muted rounded-md px-4 py-3 font-mono wrap-break-word">
            {message}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.goBack")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
