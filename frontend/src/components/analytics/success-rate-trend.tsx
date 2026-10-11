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
  ChartLegend,
  ChartLegendContent,
} from "~/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import type { LoginAttempt } from "~/types";
import { useMemo } from "react";
import { toTzDate, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";

type SuccessRateTrendProps = {
  loginAttempts: LoginAttempt[];
  timezone?: string;
};

export function SuccessRateTrend({ loginAttempts, timezone = DEFAULT_TIMEZONE }: SuccessRateTrendProps) {
  const { t } = useTranslation();
  const chartConfig = {
    successRate: {
      label: t("analytics.successRatePctLabel"),
      color: "var(--chart-2)",
    },
    failureRate: {
      label: t("analytics.failureRatePctLabel"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    if (!loginAttempts || loginAttempts.length === 0) {
      return [];
    }

    // Group by date in target timezone
    const grouped = loginAttempts.reduce(
      (acc, attempt) => {
        const date = toTzDate(attempt.attemptedAt, timezone);
        const key = `${date.getMonth() + 1}/${date.getDate()}`;

        if (!acc[key]) {
          acc[key] = { date: key, successful: 0, failed: 0 };
        }

        if (attempt.successful) {
          acc[key].successful++;
        } else {
          acc[key].failed++;
        }

        return acc;
      },
      {} as Record<
        string,
        { date: string; successful: number; failed: number }
      >,
    );

    // Convert to array with percentages and sort
    return Object.values(grouped)
      .map((item) => {
        const total = item.successful + item.failed;
        return {
          date: item.date,
          successRate: ((item.successful / total) * 100).toFixed(1),
          failureRate: ((item.failed / total) * 100).toFixed(1),
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [loginAttempts, timezone]);

  const averageSuccessRate = useMemo(() => {
    if (chartData.length === 0) return 0;
    const sum = chartData.reduce(
      (acc, item) => acc + parseFloat(item.successRate),
      0,
    );
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.successRateTrend")}</CardTitle>
          <CardDescription>
            {t("analytics.successRateTrendEmptyDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
          {t("analytics.noData")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.successRateTrend")}</CardTitle>
        <CardDescription>
          {t("analytics.successRateTrendDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="failureRate"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
        <p className="text-xs text-center text-muted-foreground mt-4">
          {t("analytics.averageSuccessRate", { value: averageSuccessRate })}
        </p>
      </CardContent>
    </Card>
  );
}
