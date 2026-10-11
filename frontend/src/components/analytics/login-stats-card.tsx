import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { LoginAttempt } from "~/types";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldAlert, Users, AlertCircle } from "lucide-react";

type LoginStatsCardsProps = {
  loginAttempts: LoginAttempt[];
};

export function LoginStatsCards({ loginAttempts }: LoginStatsCardsProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    if (!loginAttempts || loginAttempts.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        successRate: 0,
        uniqueUsers: 0,
        uniqueIps: 0,
      };
    }

    const successfulAttempts = loginAttempts.filter(
      (attempt) => attempt.successful,
    ).length;
    const failedAttempts = loginAttempts.length - successfulAttempts;
    const successRate = (successfulAttempts / loginAttempts.length) * 100;

    const uniqueUsers = new Set(loginAttempts.map((a) => a.email)).size;
    const uniqueIps = new Set(loginAttempts.map((a) => a.ipAddress)).size;

    return {
      totalAttempts: loginAttempts.length,
      successfulAttempts,
      failedAttempts,
      successRate,
      uniqueUsers,
      uniqueIps,
    };
  }, [loginAttempts]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("analytics.totalAttempts")}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAttempts}</div>
          <p className="text-xs text-muted-foreground">
            {t("analytics.uniqueUsers", { count: stats.uniqueUsers })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("analytics.successRate")}</CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.successRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {t("analytics.successfulLogins", { count: stats.successfulAttempts })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("analytics.failedAttempts")}</CardTitle>
          <ShieldAlert className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {stats.failedAttempts}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("analytics.failureRatePct", { value: ((stats.failedAttempts / stats.totalAttempts) * 100 || 0).toFixed(1) })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t("analytics.uniqueIps")}</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueIps}</div>
          <p className="text-xs text-muted-foreground">{t("analytics.activeIpAddresses")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
