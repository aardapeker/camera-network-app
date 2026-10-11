import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

import type { ChartConfig } from "~/components/ui/chart";
import type { LoginAttempt } from "~/types";
import { CHART_COLORS } from "~/constants/colors";
import { useTranslation } from "react-i18next";

type DeviceAnalyticsChartProps = {
  loginAttempts: LoginAttempt[];
};

export function DeviceAnalyticsChart({
  loginAttempts,
}: DeviceAnalyticsChartProps) {
  const { t } = useTranslation();
  // Handle empty state early
  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.deviceAnalytics")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">{t("analytics.noDeviceData")}</p>
        </CardContent>
      </Card>
    );
  }

  // Count device types
  const deviceCounts = loginAttempts.reduce(
    (acc, attempt) => {
      const device = attempt.deviceType || "Unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and sort by count
  const deviceEntries = Object.entries(deviceCounts).sort(
    ([, a], [, b]) => b - a,
  );

  // Create dynamic chart config
  const chartConfig: ChartConfig = {};

  // Create device data with fill colors
  const deviceData = deviceEntries.map(([deviceName, attempts], index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];

    chartConfig[deviceName.toLowerCase()] = {
      label: deviceName,
      color: color,
    };

    return {
      device: deviceName.toLowerCase(),
      attempts,
      fill: `var(--color-${deviceName.toLowerCase()})`,
    };
  });

  const totalAttempts = deviceData.reduce(
    (acc, curr) => acc + curr.attempts,
    0,
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("analytics.deviceAnalytics")}</CardTitle>
        <CardDescription>{t("analytics.loginAttemptsByDevice")}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={deviceData}
              dataKey="attempts"
              nameKey="device"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalAttempts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {t("analytics.attempts")}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {t("analytics.deviceUsageStats")} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {t("analytics.deviceFooter")}
        </div>
      </CardFooter>
    </Card>
  );
}
