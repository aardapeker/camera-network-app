import { TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

import type { ChartConfig } from "~/components/ui/chart";
import type { LoginAttempt } from "~/types";
import { toTzDate, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";

type PeakActivityHoursProps = {
  loginAttempts: LoginAttempt[];
  timezone?: string;
};

export function PeakActivityHours({ loginAttempts, timezone = DEFAULT_TIMEZONE }: PeakActivityHoursProps) {
  const { t } = useTranslation();
  const chartConfig = {
    attempts: {
      label: t("analytics.loginAttemptsLabel"),
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  // Handle empty state early
  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.peakActivityHours")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">{t("analytics.noLoginAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  // Initialize all 24 hours with 0 attempts
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    attempts: 0,
  }));

  // Count attempts by hour in target timezone
  loginAttempts.forEach((attempt) => {
    const hour = toTzDate(attempt.attemptedAt, timezone).getHours();
    chartData[hour].attempts++;
  });

  const peakHour = chartData.reduce((max, item) =>
    item.attempts > max.attempts ? item : max,
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("analytics.peakActivityHours")}</CardTitle>
        <CardDescription>
          {t("analytics.peakActivitySubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="equidistantPreserveStart"
              tickFormatter={(value) => value.slice(0, 2)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[
                0,
                () =>
                  Math.ceil(
                    Math.max(...chartData.map((d) => d.attempts)) * 1.3,
                  ),
              ]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="attempts"
              type="natural"
              stroke="var(--color-attempts)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {t("analytics.peakLine", { hour: peakHour.hour, count: peakHour.attempts })}{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {t("analytics.peakActivitySubtitle")}
        </div>
      </CardFooter>
    </Card>
  );
}
