import { redirect } from "react-router";
import { useTranslation } from "react-i18next";
import logUserOut from "~/functions/log_user_out";

export async function clientAction() {
  try {
    await logUserOut();

    return redirect("/signin");
  } catch {
    return null;
  }
}

export default function LogoutPage() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-lg text-gray-600">{t("status.loggingOut")}</p>
      </div>
    </div>
  );
}
