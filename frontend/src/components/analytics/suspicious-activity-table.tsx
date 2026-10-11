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
import { useTranslation } from "react-i18next";

const RISK_HIGH_FAILURE_RATE = 80;
const RISK_HIGH_MIN_ATTEMPTS = 5;
const RISK_MEDIUM_FAILURE_RATE = 50;
const TOP_IPS_LIMIT = 10;

type SuspiciousActivityTableProps = {
  loginAttempts: LoginAttempt[];
};

export function SuspiciousActivityTable({
  loginAttempts,
}: SuspiciousActivityTableProps) {
  const { t } = useTranslation();
  const topIpAddresses = useMemo(() => {
    if (!loginAttempts || loginAttempts.length === 0) {
      return [];
    }

    // Group by IP address
    const ipCounts = loginAttempts.reduce(
      (acc, attempt) => {
        const ip = attempt.ipAddress;
        if (!acc[ip]) {
          acc[ip] = {
            ip,
            totalAttempts: 0,
            failedAttempts: 0,
            successfulAttempts: 0,
            locations: new Set<string>(),
          };
        }
        acc[ip].totalAttempts++;
        if (attempt.successful) {
          acc[ip].successfulAttempts++;
        } else {
          acc[ip].failedAttempts++;
        }
        if (attempt.location) {
          acc[ip].locations.add(attempt.location);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          ip: string;
          totalAttempts: number;
          failedAttempts: number;
          successfulAttempts: number;
          locations: Set<string>;
        }
      >,
    );

    // Convert to array, calculate risk score, and sort
    return Object.values(ipCounts)
      .map((item) => ({
        ...item,
        failureRate: (item.failedAttempts / item.totalAttempts) * 100,
        locations: Array.from(item.locations),
      }))
      .sort((a, b) => b.totalAttempts - a.totalAttempts)
      .slice(0, TOP_IPS_LIMIT);
  }, [loginAttempts]);

  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.suspiciousTitle")}</CardTitle>
          <CardDescription>{t("analytics.suspiciousEmptyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          {t("analytics.noData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t("analytics.suspiciousTitle")}</CardTitle>
        <CardDescription>
          {t("analytics.suspiciousDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-xs uppercase bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t("analytics.colIpAddress")}</th>
                <th className="px-4 py-3 text-left">{t("analytics.colLocation")}</th>
                <th className="px-4 py-3 text-center">{t("analytics.colTotalAttempts")}</th>
                <th className="px-4 py-3 text-center">{t("analytics.colFailed")}</th>
                <th className="px-4 py-3 text-center">{t("analytics.colSuccessful")}</th>
                <th className="px-4 py-3 text-center">{t("analytics.colFailureRate")}</th>
                <th className="px-4 py-3 text-center">{t("analytics.colRiskLevel")}</th>
              </tr>
            </thead>
            <tbody>
              {topIpAddresses.map((item) => {
                const riskLevel =
                  item.failureRate > RISK_HIGH_FAILURE_RATE && item.totalAttempts > RISK_HIGH_MIN_ATTEMPTS
                    ? "high"
                    : item.failureRate > RISK_MEDIUM_FAILURE_RATE
                      ? "medium"
                      : "low";
                return (
                  <tr key={item.ip} className="border-b">
                    <td className="px-4 py-3 font-mono text-xs">{item.ip}</td>
                    <td className="px-4 py-3">
                      {item.locations.join(", ") || t("analytics.unknown")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.totalAttempts}
                    </td>
                    <td className="px-4 py-3 text-center text-destructive">
                      {item.failedAttempts}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600">
                      {item.successfulAttempts}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.failureRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={
                          riskLevel === "high"
                            ? "destructive"
                            : riskLevel === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {t(`analytics.risk${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
