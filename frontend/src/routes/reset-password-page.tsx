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
import { Form, Link, redirect, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { Route } from "./+types/signin-page";
import resetPassword from "~/functions/reset_password";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const userData = {
    token: String(formData.get("token") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  try {
    if (userData.password === userData.confirmPassword) {
      const resetPasswordRequest = {
        token: userData.token,
        email: userData.email,
        password: userData.password,
      };
      await resetPassword(resetPasswordRequest);
      return redirect("/signin");
    }
  } catch {
    // return redirect("/signin");
  }
}

export default function ResetPasswordPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>{t("auth.forgotPasswordTitle")}</CardTitle>
          <CardDescription>
            {t("auth.forgotPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <div className="grid w-full items-center gap-4">
              <input type="hidden" name="email" value={email || ""} />
              <input type="hidden" name="token" value={token || ""} />
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="signin-password">{t("auth.newPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="signin-password">{t("auth.confirmNewPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                placeholder={t("auth.confirmPasswordPlaceholder")}
              />
            </div>
            <Button className="mt-4 w-full" type="submit">
              {t("auth.changePassword")}
            </Button>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Button variant="link" className="p-0">
              <Link to="/signup">{t("auth.signUp")}</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
