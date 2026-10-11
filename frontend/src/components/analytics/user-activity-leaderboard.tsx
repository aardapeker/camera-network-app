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
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useTranslation } from "react-i18next";

export type UserActivityStats = {
  userId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  totalSessions: number;
  totalTimeSeconds: number;
  averageSessionDurationSeconds: number;
  lastLoginTime: string | null;
  lastActivityTime: string | null;
  activeSessions: number;
};

type UserActivityLeaderboardProps = {
  users: UserActivityStats[];
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function UserActivityLeaderboard({ users }: UserActivityLeaderboardProps) {
  const { t } = useTranslation();
  const chartConfig = {
    hours: {
      label: t("analytics.hoursActive"),
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  if (!users || users.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>{t("analytics.leaderboardTitle")}</CardTitle>
          <CardDescription>{t("analytics.leaderboardEmptyDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          {t("analytics.leaderboardNoActivity")}
        </CardContent>
      </Card>
    );
  }

  const top10 = users.slice(0, 10);

  const chartData = top10.map((u) => ({
    name: u.username,
    hours: parseFloat((u.totalTimeSeconds / 3600).toFixed(1)),
  }));

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{t("analytics.leaderboardTitle")}</CardTitle>
        <CardDescription>{t("analytics.leaderboardDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Bar chart */}
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} unit="h" />
            <YAxis
              type="category"
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
          </BarChart>
        </ChartContainer>

        {/* Top 5 detailed list */}
        <div className="space-y-2">
          {top10.slice(0, 5).map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                {index + 1}
              </div>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.profilePictureUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {(user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">{formatDuration(user.totalTimeSeconds)}</p>
                <p className="text-xs text-muted-foreground">{t("analytics.sessions", { count: user.totalSessions })}</p>
              </div>
              {user.activeSessions > 0 && (
                <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" title={t("analytics.currentlyActive")} />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
