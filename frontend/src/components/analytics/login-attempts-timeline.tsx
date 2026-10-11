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
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import type { LoginAttempt } from "~/types";
import { toTzDate, nowInTz, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";

type LoginAttemptsTimelineProps = {
  loginAttempts: LoginAttempt[];
  /** "hourly" = last 48 h, "daily" = last 30 days */
  groupBy?: "hourly" | "daily";
  timezone?: string;
};

export function LoginAttemptsTimeline({
  loginAttempts,
  groupBy = "daily",
  timezone = DEFAULT_TIMEZONE,
}: LoginAttemptsTimelineProps) {
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

  if (!loginAttempts || loginAttempts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.timelineTitle")}</CardTitle>
          <CardDescription>{t("analytics.noData")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">{t("analytics.noLoginAttempts")}</p>
        </CardContent>
      </Card>
    );
  }

  const now = nowInTz(timezone);

  // Build slot array in target timezone
  const slots =
    groupBy === "hourly"
      ? Array.from({ length: 48 }, (_, i) => {
          const d = new Date(now);
          d.setHours(now.getHours() - (47 - i));
          d.setMinutes(0, 0, 0);
          const m = d.getMonth() + 1;
          const day = d.getDate();
          const h = d.getHours();
          const key = `${m}/${day} ${h.toString().padStart(2, "0")}:00`;
          return { key, displayLabel: `${h.toString().padStart(2, "0")}:00`, successful: 0, failed: 0 };
        })
      : Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (29 - i));
          d.setHours(0, 0, 0, 0);
          const year = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, "0");
          const day = d.getDate().toString().padStart(2, "0");
          const key = `${year}-${m}-${day}`;
          const displayLabel = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
          return { key, displayLabel, successful: 0, failed: 0 };
        });

  // Cutoff and filter
  const windowMs = groupBy === "hourly" ? 48 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - windowMs).getTime();
  const recent = loginAttempts.filter(
    (a) => new Date(a.attemptedAt.endsWith("Z") ? a.attemptedAt : a.attemptedAt + "Z").getTime() >= cutoff,
  );

  // Bucket attempts into slots using target timezone
  recent.forEach((attempt) => {
    const d = toTzDate(attempt.attemptedAt, timezone);
    let key: string;
    if (groupBy === "hourly") {
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const h = d.getHours();
      key = `${m}/${day} ${h.toString().padStart(2, "0")}:00`;
    } else {
      const year = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      key = `${year}-${m}-${day}`;
    }
    const slot = slots.find((s) => s.key === key);
    if (slot) {
      attempt.successful ? slot.successful++ : slot.failed++;
    }
  });

  const chartData = slots.map(({ displayLabel, successful, failed }) => ({
    date: displayLabel,
    successful,
    failed,
  }));

  const maxValue = Math.max(...chartData.map((d) => d.successful + d.failed));
  const title = groupBy === "hourly" ? t("analytics.timelineLast48h") : t("analytics.timelineLast30d");
  const desc = t("analytics.timelineDesc", {
    total: recent.length,
    successful: recent.filter((a) => a.successful).length,
    failed: recent.filter((a) => !a.successful).length,
  });

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              height={groupBy === "hourly" ? 50 : 40}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => (groupBy === "hourly" ? v.slice(0, 5) : v)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={30}
              domain={[0, () => Math.max(5, Math.ceil(maxValue * 1.5))]}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              labelFormatter={(label) => t("analytics.timelineTimeLabel", { label })}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="successful"
              stackId="1"
              stroke="var(--color-successful)"
              fill="var(--color-successful)"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="failed"
              stackId="1"
              stroke="var(--color-failed)"
              fill="var(--color-failed)"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
