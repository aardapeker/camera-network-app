import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Rectangle,
} from "recharts";
import type { LoginAttempt } from "~/types";
import { CHART_COLORS } from "~/constants/colors";
import { useTranslation } from "react-i18next";

type FailureReasonDistributionProps = {
  loginAttempts: LoginAttempt[];
};

export function FailureReasonDistribution({
  loginAttempts,
}: FailureReasonDistributionProps) {
  const { t } = useTranslation();
  // Handle empty state early
  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.failureReasonTitle")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">{t("analytics.noLoginAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  // Filter only failed attempts with failure reasons
  const failedAttempts = loginAttempts.filter(
    (attempt) => !attempt.successful && attempt.failureReason,
  );

  // Handle case when there are no failed attempts
  if (failedAttempts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.failureReasonTitle")}</CardTitle>
          <CardDescription>{t("analytics.noFailureData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">{t("analytics.noFailedAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  // Count failure reasons
  const reasonCounts = failedAttempts.reduce(
    (acc, attempt) => {
      const reason = attempt.failureReason || "Unknown";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and sort by count
  const reasonEntries = Object.entries(reasonCounts).sort(
    ([, a], [, b]) => b - a,
  );

  // Create dynamic chart config
  const chartConfig: ChartConfig = {};

  const formatReasonLabel = (reason: string): string => {
    const keyMap: Record<string, string> = {
      INVALID_PASSWORD: "analytics.reasonInvalidPassword",
      INVALID_CREDENTIALS: "analytics.reasonInvalidCredentials",
      USER_NOT_FOUND: "analytics.reasonUserNotFound",
      AUTHENTICATION_FAILED: "analytics.reasonAuthFailed",
      SYSTEM_ERROR: "analytics.reasonSystemError",
      ACCOUNT_EXPIRED: "analytics.reasonAccountExpired",
      ACCOUNT_DISABLED: "analytics.reasonAccountDisabled",
      ACCOUNT_LOCKED: "analytics.reasonAccountLocked",
      EXPIRED_PASSWORD: "analytics.reasonExpiredPassword",
      TOO_MANY_ATTEMPTS: "analytics.reasonTooManyAttempts",
    };
    return keyMap[reason] ? t(keyMap[reason]) : reason;
  };

  // Create chart data with fill colors
  const chartData = reasonEntries.map(([reason, count], index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];
    const formattedLabel = formatReasonLabel(reason);
    const configKey = reason.toLowerCase();

    chartConfig[reason.toLowerCase()] = {
      label: formattedLabel,
      color: color,
    };

    return {
      reason: configKey,
      count: count,
      fill: color, // Store the actual color value
      label: formattedLabel,
    };
  });

  const totalFailures = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t("analytics.failureReasonTitle")}</CardTitle>
        <CardDescription>
          {t("analytics.failureReasonDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="reason"
              tickLine={false}
              axisLine={false}
              height={0}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              strokeWidth={2}
              radius={8}
              activeIndex={2}
              activeBar={({ ...props }) => {
                return (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke={props.payload.fill}
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                );
              }}
            />
          </BarChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {chartData.map((item) => (
            <div key={item.reason} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground text-xs">
                {item.label}: <span className="font-medium text-foreground">{item.count}</span>
              </span>
            </div>
          ))}
          <div className="w-full text-xs text-muted-foreground pt-1 border-t">
            {t("analytics.totalFailures")} <span className="font-medium text-foreground">{totalFailures}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
