import type { LoginAttempt } from "~/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { toTzDate, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";

export function LoginAttemptsTable({
  loginAttempts,
  timezone = DEFAULT_TIMEZONE,
}: {
  loginAttempts: LoginAttempt[];
  timezone?: string;
}) {
  const { t } = useTranslation();
  const formatDate = (dateString: string) => {
    try {
      const d = toTzDate(dateString, timezone);
      const pad = (n: number) => n.toString().padStart(2, "0");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${months[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="rounded-md border overflow-auto custom-scrollbar">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.laStatus")}</TableHead>
            <TableHead>{t("table.laEmail")}</TableHead>
            <TableHead>{t("table.laIpAddress")}</TableHead>
            <TableHead>{t("table.laDevice")}</TableHead>
            <TableHead>{t("table.laBrowser")}</TableHead>
            <TableHead>{t("table.laOs")}</TableHead>
            <TableHead>{t("table.laLocation")}</TableHead>
            <TableHead>{t("table.laDateTime")}</TableHead>
            <TableHead>{t("table.laFailureReason")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loginAttempts?.length ? (
            loginAttempts.map((attempt) => (
              <TableRow key={attempt.id as string}>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      attempt.successful
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {attempt.successful ? t("table.laSuccess") : t("table.laFailed")}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{attempt.email}</TableCell>
                <TableCell className="font-mono text-sm">
                  {attempt.ipAddress}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{attempt.deviceType}</div>
                    {attempt.deviceModel && (
                      <div className="text-xs text-muted-foreground">
                        {attempt.deviceModel}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{attempt.browser}</TableCell>
                <TableCell className="text-sm">{attempt.os}</TableCell>
                <TableCell className="text-sm">
                  {attempt.location || t("table.laUnknown")}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatDate(attempt.attemptedAt as string)}
                </TableCell>
                <TableCell>
                  {attempt.failureReason ? (
                    <span className="text-sm text-muted-foreground">
                      {attempt.failureReason}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                {t("table.laNoAttempts")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
