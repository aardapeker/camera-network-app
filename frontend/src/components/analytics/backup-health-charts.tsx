import { Label, Pie, PieChart } from "recharts";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { useTranslation } from "react-i18next";

type BackupLog = {
  id: string | null;
  type: "AUTO" | "MANUAL" | "RESTORE";
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "SKIPPED";
  timestamp: string;
  dbSize: string | null;
  imagesUploaded: number | null;
  backupKey: string | null;
  details: string | null;
};

type BackupHealthChartsProps = {
  logs: BackupLog[];
};

function parseDbSize(dbSize: string | null): number {
  if (!dbSize) return 0;
  const match = dbSize.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === "B") return val / (1024 * 1024);
  if (unit === "KB") return val / 1024;
  if (unit === "MB") return val;
  if (unit === "GB") return val * 1024;
  return val;
}

export function BackupHealthCharts({ logs }: BackupHealthChartsProps) {
  const { t } = useTranslation();
  const statusConfig: ChartConfig = {
    success: { label: t("analytics.success"), color: "var(--chart-2)" },
    failed: { label: t("analytics.failed"), color: "var(--chart-1)" },
    skipped: { label: t("analytics.skipped"), color: "var(--chart-4)" },
    in_progress: { label: t("analytics.inProgress"), color: "var(--chart-3)" },
  };

  const sizeConfig: ChartConfig = {
    sizeMb: { label: t("analytics.dbSizeLabel"), color: "var(--chart-3)" },
  };

  if (!logs || logs.length === 0) return null;

  // Status distribution (exclude RESTORE type)
  const backupLogs = logs.filter((l) => l.type !== "RESTORE");
  const statusCounts = backupLogs.reduce((acc, l) => {
    const key = l.status.toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    fill: `var(--color-${status})`,
  }));

  const totalBackups = backupLogs.length;
  const successCount = statusCounts["success"] ?? 0;
  const successRate = totalBackups > 0 ? Math.round((successCount / totalBackups) * 100) : 0;

  // DB size trend — last 20 successful backups
  const sizeTrend = backupLogs
    .filter((l) => l.status === "SUCCESS" && l.dbSize)
    .slice(-20)
    .map((l) => {
      const date = new Date(l.timestamp.endsWith("Z") ? l.timestamp : l.timestamp + "Z");
      return {
        date: `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })}`,
        sizeMb: parseFloat(parseDbSize(l.dbSize).toFixed(2)),
      };
    });

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {/* Success rate donut */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.backupSuccessRate")}</CardTitle>
          <CardDescription>{t("analytics.totalBackups", { count: totalBackups })}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[220px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={55} strokeWidth={5}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                            {successRate}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                            {t("analytics.success")}
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
      </Card>

      {/* DB size trend */}
      {sizeTrend.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.dbSizeTrend")}</CardTitle>
            <CardDescription>{t("analytics.lastNBackups", { count: sizeTrend.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sizeConfig} className="h-[220px] w-full">
              <AreaChart data={sizeTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={40}
                  unit=" MB"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="sizeMb"
                  stroke="var(--color-sizeMb)"
                  fill="var(--color-sizeMb)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.dbSizeTrend")}</CardTitle>
            <CardDescription>{t("analytics.notEnoughData")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[220px] text-muted-foreground">
            {t("analytics.needTwoBackups")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
