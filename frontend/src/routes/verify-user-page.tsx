import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Form, Link, redirect, useFetcher } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import i18n from "~/lib/i18n";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import verifyUser from "~/functions/verify_user";
import type { Route } from "./+types/verify-user-page";
import resendVerificationCode from "~/functions/resend_verification_code";
import { setAuthTokenCookie } from "~/functions/set_auth_token_cookie";

export async function clientAction({
  request,
  params,
}: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get email from URL params and decode it
  const email = params.email ? decodeURIComponent(params.email) : null;

  if (!email) {
    return {
      success: false,
      message: i18n.t("verify.emailRequired"),
    };
  }

  // Handle resend code action
  if (intent === "resend") {
    try {
      // Call your resend API here
      const result = await resendVerificationCode({ email });

      return {
        success: true,
        message: result.message || i18n.t("verify.resendSuccess"),
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : i18n.t("verify.resendFailed"),
      };
    }
  }
  // Handle verify code action

  try {
    const verificationCode = formData.get("verificationCode") as string;

    if (!verificationCode || verificationCode.length !== 6) {
      return {
        success: false,
        message: i18n.t("verify.invalidCode"),
      };
    }

    const verifyUserData = {
      email,
      verificationCode,
    };

    const returnedVerifyUserData = await verifyUser(verifyUserData);

    // Set the authentication token in cookies
    setAuthTokenCookie(returnedVerifyUserData.token);

    toast.success(i18n.t("verify.verifiedTitle"), {
      description: i18n.t("verify.verifiedDescription"),
    });

    // Redirect to home page (or dashboard) since user is now authenticated
    return redirect("/");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : i18n.t("verify.verificationFailed"),
    };
  }
}

export default function VerifyUser({ actionData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const fetcher = useFetcher();
  const isResending = fetcher.state !== "idle";

  return (
    <div className=" flex flex-col items-center justify-center min-h-screen">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 backdrop-blur-sm relative z-10">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold ">
              {t("verify.title")}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {t("verify.description")}
              <br />
              {t("verify.descriptionLine2")}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form method="POST" className="space-y-6">
            <input type="hidden" name="intent" value="verify" />
            <div className="flex flex-col space-y-4">
              <Label
                htmlFor="verification-code"
                className="text-sm font-semibold text-center text-foreground"
              >
                {t("verify.codeLabel")}
              </Label>

              <div className="flex justify-center">
                <InputOTP
                  pattern={REGEXP_ONLY_DIGITS}
                  id="verification-code"
                  maxLength={6}
                  name="verificationCode"
                  containerClassName="gap-3"
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot
                      index={0}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                    <InputOTPSlot
                      index={1}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                    <InputOTPSlot
                      index={2}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                    <InputOTPSlot
                      index={3}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                    <InputOTPSlot
                      index={4}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                    <InputOTPSlot
                      index={5}
                      className="w-12 h-14 text-lg font-semibold border-2 rounded-lg"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t("verify.codeHint")}
              </p>
            </div>

            <Button size="lg" className="w-full font-semibold " type="submit">
              {t("verify.verifyButton")}
            </Button>
          </Form>

          {/* Show error message from main form submission */}
          {actionData && !actionData.success && (
            <div className="text-sm text-center p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {actionData.message}
            </div>
          )}

          {/* Show success/error message from resend */}
          {fetcher.data && (
            <div
              className={`text-sm text-center p-3 rounded-lg ${
                fetcher.data.success
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {fetcher.data.message}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col space-y-4 pt-6 border-t">
          <div className="flex flex-col items-center space-y-2 w-full">
            <p className="text-sm text-muted-foreground">
              {t("verify.didntReceive")}
            </p>
            <fetcher.Form method="POST">
              <input type="hidden" name="intent" value="resend" />
              <Button
                type="submit"
                variant="ghost"
                disabled={isResending}
                className="font-medium"
              >
                {isResending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {t("verify.sending")}
                  </>
                ) : (
                  t("verify.resendCode")
                )}
              </Button>
            </fetcher.Form>
          </div>
        </CardFooter>
      </Card>

      {/* Trust indicators */}
      <div className="mt-8 text-center space-y-2 relative z-10">
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          {t("verify.secureNote")}
        </p>
      </div>
    </div>
  );
}
