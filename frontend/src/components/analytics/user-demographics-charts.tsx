import { Label, Pie, PieChart } from "recharts";
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
import type { User } from "~/types";
import { CHART_COLORS } from "~/constants/colors";
import { useTranslation } from "react-i18next";

type UserDemographicsProps = {
  users: User[];
};

const ROLE_LABEL_KEYS: Record<string, string> = {
  ROLE_ADMIN: "addUser.roleAdmin",
  ROLE_DEVELOPER: "addUser.roleDeveloper",
  ROLE_MANAGER: "addUser.roleManager",
  ROLE_MODERATOR: "addUser.roleModerator",
  ROLE_TECH: "addUser.roleTech",
  ROLE_CLIENT: "addUser.roleClient",
  ROLE_CUSTOM: "addUser.roleCustom",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--chart-2)",
  PENDING: "var(--chart-3)",
  BANNED: "var(--chart-1)",
  EXPIRED: "var(--chart-4)",
};

const ROLE_COLORS = CHART_COLORS;

export function UserDemographicsCharts({ users }: UserDemographicsProps) {
  const { t } = useTranslation();
  if (!users || users.length === 0) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.usersByRole")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t("analytics.noUserData")}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.usersByStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
            {t("analytics.noUserData")}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role distribution
  const roleCounts = users.reduce((acc, user) => {
    const role = user.authorities?.[0] ?? "Unknown";
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleConfig: ChartConfig = {};
  const roleData = Object.entries(roleCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([role, count], i) => {
      const color = ROLE_COLORS[i % ROLE_COLORS.length];
      const key = role.toLowerCase();
      roleConfig[key] = { label: ROLE_LABEL_KEYS[role] ? t(ROLE_LABEL_KEYS[role]) : role, color };
      return { role: key, count, fill: `var(--color-${key})` };
    });

  // Status distribution
  const statusCounts = users.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusConfig: ChartConfig = {};
  const statusData = Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => {
      const color = STATUS_COLORS[status] ?? "var(--chart-5)";
      const key = status.toLowerCase();
      statusConfig[key] = { label: status.charAt(0) + status.slice(1).toLowerCase(), color };
      return { status: key, count, fill: `var(--color-${key})` };
    });

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {/* Role distribution */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.usersByRole")}</CardTitle>
          <CardDescription>{t("analytics.totalUsers", { count: users.length })}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={roleConfig} className="mx-auto aspect-square max-h-[220px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={roleData} dataKey="count" nameKey="role" innerRadius={55} strokeWidth={5}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                            {users.length}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                            {t("analytics.users")}
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

      {/* Status distribution */}
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{t("analytics.usersByStatus")}</CardTitle>
          <CardDescription>{t("analytics.accountHealthOverview")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-[220px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={55} strokeWidth={5}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      const active = statusCounts["ACTIVE"] ?? 0;
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                            {active}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                            {t("analytics.active")}
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
    </div>
  );
}
