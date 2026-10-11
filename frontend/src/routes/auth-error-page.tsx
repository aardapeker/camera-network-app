import { useNavigate, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  const error = searchParams.get("error") || "unknown_error";
  const errorDescription =
    searchParams.get("error_description") ||
    searchParams.get("message") ||
    t("authError.defaultDescription");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/signin", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getErrorMessage = () => {
    switch (error) {
      case "access_denied":
        return t("authError.accessDenied");
      case "server_error":
        return t("authError.serverError");
      case "temporarily_unavailable":
        return t("authError.temporarilyUnavailable");
      case "invalid_request":
        return t("authError.invalidRequest");
      case "unauthorized_client":
        return t("authError.unauthorizedClient");
      case "unsupported_response_type":
        return t("authError.unsupportedResponseType");
      case "invalid_scope":
        return t("authError.invalidScope");
      default:
        return errorDescription;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <CardTitle>{t("authError.title")}</CardTitle>
          </div>
          <CardDescription>
            {t("authError.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4">
            <p className="text-sm text-foreground">{getErrorMessage()}</p>
          </div>

          {error !== "unknown_error" && (
            <div className="text-xs text-muted-foreground">
              <p>{t("authError.errorCode", { code: error })}</p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {t("authError.redirecting", { count: countdown })}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.goBack")}
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate("/signin", { replace: true })}
          >
            <Home className="h-4 w-4 mr-2" />
            {t("auth.signIn")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
