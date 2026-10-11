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
import addUser from "~/functions/add_user";
import type { Route } from "./+types/signup-page";
import type { UserVerificationData } from "~/types";
import { toast } from "sonner";
import i18n from "~/lib/i18n";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();

  const userData = Object.fromEntries(formData) as UserVerificationData;

  const encodedEmail = encodeURIComponent(userData.email);

  try {
    await addUser(userData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : i18n.t("auth.unexpectedError");

    toast.error(i18n.t("auth.signUpFailedTitle"), {
      description: errorMessage,
    });

    return null;
  }

  return redirect(`/verify-user/${encodedEmail}`);
}

export default function SignupPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>{t("auth.signUpTitle")}</CardTitle>
          <CardDescription>{t("auth.signUpDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="POST">
            <div className="grid w-full items-center gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col space-y-1.5 flex-1">
                  <Label htmlFor="first-name">{t("auth.firstName")}</Label>
                  <Input
                    id="first-name"
                    placeholder={t("auth.firstNamePlaceholder")}
                    type="text"
                    name="firstName"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5 flex-1">
                  <Label htmlFor="last-name">{t("auth.lastName")}</Label>
                  <Input
                    id="last-name"
                    placeholder={t("auth.lastNamePlaceholder")}
                    type="text"
                    name="lastName"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  placeholder={t("auth.usernamePlaceholder")}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder={t("auth.createPasswordPlaceholder")}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  name="confirm-password"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  required
                />
              </div>
            </div>
            <Button className="mt-4 w-full" type="submit">
              {t("auth.signUp")}
            </Button>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Button variant="link" className="p-0">
              <Link to="/signin">{t("auth.signIn")}</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
