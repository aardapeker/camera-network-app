import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form, Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/forgot-password-page";
import sendResetPasswordLink from "~/functions/sent_reset_password_link";
import { toast } from "sonner";
import i18n from "~/lib/i18n";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const userData = Object.fromEntries(formData);

  try {
    await sendResetPasswordLink(userData as { email: string });
    toast.success(i18n.t("auth.resetLinkSentTitle"), {
      description: i18n.t("auth.resetLinkSentDescription"),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : i18n.t("auth.unexpectedError");
    toast.error(i18n.t("auth.resetLinkFailedTitle"), {
      description: errorMessage,
    });
  }
}

export default function ForgotPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>
            {t("auth.forgotPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="forgot-password-email">{t("auth.email")}</Label>
              <Input
                id="forgot-password-email"
                type="email"
                name="email"
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>
            <Button className="mt-4 w-full" type="submit">
              {t("auth.resetPassword")}
            </Button>
          </Form>
        </CardContent>
        <CardFooter>
          <Button variant="link" className="p-0">
            <Link to="/signin">{t("auth.backToSignIn")}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
