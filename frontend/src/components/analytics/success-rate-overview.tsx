import { TrendingUp } from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

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
import { useTranslation } from "react-i18next";

export const description = "A radial chart showing login success rate";

type SuccessRateOverviewProps = {
  loginAttempts: LoginAttempt[];
};

export function SuccessRateOverview({
  loginAttempts,
}: SuccessRateOverviewProps) {
  const { t } = useTranslation();
  const chartConfig = {
    successful: {
      label: t("analytics.successfulLabel"),
      color: "var(--chart-2)",
    },
    failed: {
      label: t("analytics.failedLabel"),
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  // Handle empty state early
  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.loginSuccessRate")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">{t("analytics.noLoginAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate counts
  const successfulCount = loginAttempts.filter(
    (attempt) => attempt.successful,
  ).length;
  const failedCount = loginAttempts.length - successfulCount;

  // Create chart data
  const chartData = [
    {
      successfulCount: successfulCount,
      failedCount: failedCount,
    },
  ];

  // Calculate totals and rates
  const totalAttempts = loginAttempts.length;
  const successRate = ((successfulCount / totalAttempts) * 100).toFixed(1);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("analytics.loginSuccessRate")}</CardTitle>
        <CardDescription>{t("analytics.authPerformanceOverview")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[250px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={80}
            outerRadius={130}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {totalAttempts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          {t("analytics.attempts")}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          {t("analytics.successRateLine", { value: successRate })}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
            <RadialBar
              dataKey="successfulCount"
              name={t("analytics.successfulLabel")}
              stackId="a"
              cornerRadius={5}
              fill="var(--color-successful)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="failedCount"
              name={t("analytics.failedLabel")}
              fill="var(--color-failed)"
              stackId="a"
              cornerRadius={5}
              className="stroke-transparent stroke-2"
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {t("analytics.successRateLine", { value: successRate })} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {t("analytics.successfulOutOfTotal", { successful: successfulCount, total: totalAttempts })}
        </div>
      </CardFooter>
    </Card>
  );
}
