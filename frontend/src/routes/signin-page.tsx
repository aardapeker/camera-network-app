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
import { Form, Link, redirect } from "react-router";
import { useTranslation } from "react-i18next";
import generateTokenWithEmail from "~/functions/generate_token_with_email";
import type { Route } from "./+types/signin-page";
import { toast } from "sonner";
import i18n from "~/lib/i18n";
import { isServicePortalHost, landingPath } from "~/lib/service-portal";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const userData = Object.fromEntries(formData);

  try {
    await generateTokenWithEmail(
      userData as { email: string; password: string },
    );

    toast.success(i18n.t("auth.loginSuccessTitle"), {
      description: i18n.t("auth.loginSuccessDescription"),
    });

    return redirect(landingPath());
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : i18n.t("auth.unexpectedError");

    toast.error(i18n.t("auth.loginFailedTitle"), {
      description: errorMessage,
    });

    return null;
  }
}

export default function SigninPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>{t("auth.signInTitle")}</CardTitle>
          <CardDescription>
            {t("auth.signInDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="signin-email">{t("auth.email")}</Label>
                <Input
                  id="signin-email"
                  type="email"
                  name="email"
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="signin-password">{t("auth.password")}</Label>
                <Input
                  id="signin-password"
                  type="password"
                  name="password"
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>
            </div>
            <div className="mt-2 text-right">
              <Button
                type="button"
                variant="link"
                className="p-0 text-sm dark:text-blue-500 hover:underline"
              >
                <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
              </Button>
            </div>
            <Button className="mt-4 w-full" type="submit">
              {t("auth.signIn")}
            </Button>
          </Form>
        </CardContent>
        {!isServicePortalHost() && (
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Button variant="link" className="p-0">
                <Link to="/signup">{t("auth.signUp")}</Link>
              </Button>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
