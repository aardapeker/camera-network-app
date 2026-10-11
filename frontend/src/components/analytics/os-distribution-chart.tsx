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
import { useTranslation } from "react-i18next";

type OsDistributionChartProps = {
  loginAttempts: LoginAttempt[];
};

// Generate a consistent color palette
import { CHART_COLORS } from "~/constants/colors";

export function OsDistributionChart({
  loginAttempts,
}: OsDistributionChartProps) {
  const { t } = useTranslation();
  // Handle empty state early
  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.osDistribution")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground">{t("analytics.noLoginAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  // Count Operating Systems
  const osCounts = loginAttempts.reduce(
    (acc, attempt) => {
      const osName = attempt.os || "Unknown";
      acc[osName] = (acc[osName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and sort by count
  const osEntries = Object.entries(osCounts).sort(([, a], [, b]) => b - a);

  // Create dynamic chart config
  const chartConfig: ChartConfig = {};

  // Create os data with fill colors
  const osData = osEntries.map(([osName, attempts], index) => {
    const color = CHART_COLORS[index % CHART_COLORS.length];

    chartConfig[osName.toLowerCase()] = {
      label: osName,
      color: color,
    };

    return {
      os: osName.toLowerCase(),
      attempts,
      fill: `var(--color-${osName.toLowerCase()})`,
    };
  });

  const totalAttempts = osData.reduce((acc, curr) => acc + curr.attempts, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{t("analytics.osDistribution")}</CardTitle>
        <CardDescription>{t("analytics.loginAttemptsByOs")}</CardDescription>
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
              data={osData}
              dataKey="attempts"
              nameKey="os"
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
          {t("analytics.osUsageStats")} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {t("analytics.osDistributionFooter")}
        </div>
      </CardFooter>
    </Card>
  );
}
