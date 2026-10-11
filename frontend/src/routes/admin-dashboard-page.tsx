import { useLoaderData } from "react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import getAllLoginAttempts from "~/functions/get_all_login_attempts";
import getMostActiveUsers from "~/functions/get_most_active_users";
import getUsers from "~/functions/get_users";
import { LoginStatsCards } from "~/components/analytics/login-stats-card";
import { BrowserDistributionChart } from "~/components/analytics/browser-distribution-chart";
import { OsDistributionChart } from "~/components/analytics/os-distribution-chart";
import { DeviceAnalyticsChart } from "~/components/analytics/device-analytics-chart";
import { PeakActivityHours } from "~/components/analytics/peak-activity-hours";
import { SuccessRateTrend } from "~/components/analytics/success-rate-trend";
import { SuccessRateOverview } from "~/components/analytics/success-rate-overview";
import { GeographicDistributionChart } from "~/components/analytics/geographic-distribution-chart";
import { LoginAttemptsTimeline } from "~/components/analytics/login-attempts-timeline";
import { LoginAttemptsTable } from "~/components/table/login-attempts-table";
import { SuspiciousActivityTable } from "~/components/analytics/suspicious-activity-table";
import { FailureReasonDistribution } from "~/components/analytics/failure-reason-distribution";
import { HighRiskUsers } from "~/components/analytics/high-risk-users";
import { UserActivityLeaderboard } from "~/components/analytics/user-activity-leaderboard";
import { UserDemographicsCharts } from "~/components/analytics/user-demographics-charts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TIMEZONES, DEFAULT_TIMEZONE } from "~/lib/timezone";

export async function clientLoader() {
  const [loginAttemptsResponse, mostActiveUsers, usersResponse] = await Promise.all([
    getAllLoginAttempts(),
    getMostActiveUsers(10),
    getUsers({
      filterInput: null,
      filterBy: null,
      roles: null,
      statuses: null,
      page: "0",
      size: "1000",
      sortBy: null,
      sortDirection: null,
    }).catch(() => null),
  ]);

  return {
    loginAttemptsResponse,
    mostActiveUsers,
    users: usersResponse?.content ?? [],
  };
}

clientLoader.hydrate = true as const;

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { loginAttemptsResponse, mostActiveUsers, users } = useLoaderData<typeof clientLoader>();
  const attempts = loginAttemptsResponse?.content ?? [];
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  return (
    <div className="p-4 sm:p-6 space-y-10">

      {/* ── Login Analytics ─────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{t("adminDashboard.loginAnalytics")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("adminDashboard.loginAnalyticsSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{t("adminDashboard.timezone")}</span>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="custom-scrollbar">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value} className="text-xs">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats summary row */}
        <LoginStatsCards loginAttempts={attempts} />

        {/* Success rate + device type */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <SuccessRateOverview loginAttempts={attempts} />
          <DeviceAnalyticsChart loginAttempts={attempts} />
        </div>

        {/* Browser + OS */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <BrowserDistributionChart loginAttempts={attempts} />
          <OsDistributionChart loginAttempts={attempts} />
        </div>

        {/* Peak hours + success rate trend */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <PeakActivityHours loginAttempts={attempts} timezone={timezone} />
          <SuccessRateTrend loginAttempts={attempts} timezone={timezone} />
        </div>

        {/* 48-hour timeline */}
        <LoginAttemptsTimeline loginAttempts={attempts} groupBy="hourly" timezone={timezone} />

        {/* 30-day timeline */}
        <LoginAttemptsTimeline loginAttempts={attempts} groupBy="daily" timezone={timezone} />

        {/* Geographic distribution */}
        <div style={{ contain: "content" }}>
          <GeographicDistributionChart loginAttempts={attempts} />
        </div>

        {/* Failure reasons */}
        <FailureReasonDistribution loginAttempts={attempts} />

        {/* Security threat tables */}
        <SuspiciousActivityTable loginAttempts={attempts} />
        <HighRiskUsers loginAttempts={attempts} timezone={timezone} />

        {/* Full audit log */}
        <LoginAttemptsTable loginAttempts={attempts} timezone={timezone} />
      </section>

      {/* ── User Analytics ──────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("adminDashboard.userAnalytics")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("adminDashboard.userAnalyticsSubtitle")}
          </p>
        </div>

        <UserActivityLeaderboard users={mostActiveUsers} />
        <UserDemographicsCharts users={users} />
      </section>
    </div>
  );
}
