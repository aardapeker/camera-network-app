import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { LoginAttempt } from "~/types";
import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { toTzDate, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";

type HighRiskUsersProps = {
  loginAttempts: LoginAttempt[];
  timezone?: string;
};

export function HighRiskUsers({ loginAttempts, timezone = DEFAULT_TIMEZONE }: HighRiskUsersProps) {
  const { t } = useTranslation();
  const highRiskUsers = useMemo(() => {
    if (!loginAttempts || loginAttempts.length === 0) {
      return [];
    }

    // Group by email
    const userAttempts = loginAttempts.reduce(
      (acc, attempt) => {
        const email = attempt.email;
        if (!acc[email]) {
          acc[email] = {
            email,
            totalAttempts: 0,
            failedAttempts: 0,
            lastAttempt: attempt.attemptedAt,
          };
        }
        acc[email].totalAttempts++;
        if (!attempt.successful) {
          acc[email].failedAttempts++;
        }
        // Keep the latest attempt
        if (toTzDate(attempt.attemptedAt, timezone) > toTzDate(acc[email].lastAttempt, timezone)) {
          acc[email].lastAttempt = attempt.attemptedAt;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          email: string;
          totalAttempts: number;
          failedAttempts: number;
          lastAttempt: string;
        }
      >,
    );

    // Filter users with failed attempts and sort
    return Object.values(userAttempts)
      .filter((user) => user.failedAttempts > 0)
      .sort((a, b) => b.failedAttempts - a.failedAttempts)
      .slice(0, 5); // Top 5
  }, [loginAttempts, timezone]);

  if (
    !loginAttempts ||
    loginAttempts.length === 0 ||
    highRiskUsers.length === 0
  ) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.highRiskUsers")}</CardTitle>
          <CardDescription>
            {t("analytics.highRiskEmptyDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          {t("analytics.noHighRisk")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t("analytics.highRiskUsers")}</CardTitle>
        <CardDescription>
          {t("analytics.highRiskDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {highRiskUsers.map((user) => (
            <Card key={user.email}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="font-medium text-sm truncate">{user.email}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {t("analytics.labelFailed")}{" "}
                        <span className="text-destructive font-medium">
                          {user.failedAttempts}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("analytics.labelTotal")} {user.totalAttempts}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("analytics.labelLast")} {toTzDate(user.lastAttempt, timezone).toLocaleString("en-GB")}
                      </p>
                    </div>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <Badge variant="destructive" className="mt-3">
                  {t("analytics.highRiskBadge")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
