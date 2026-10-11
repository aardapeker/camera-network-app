import { useNavigate, useSearchParams } from "react-router";
import { setAuthTokenCookie } from "~/functions/set_auth_token_cookie";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function AuthSuccessPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // Store the token
      setAuthTokenCookie(token);

      navigate("/home", { replace: true });
    } else {
      navigate("/auth/error?error=no_token&message=No authentication token was provided", { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{t("authSuccess.completing")}</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
}
