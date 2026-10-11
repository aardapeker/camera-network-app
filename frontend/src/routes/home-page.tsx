import type { Route } from "./+types/home-page";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Network, FolderOpen, LayoutList, Plus, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import getCurrentUser from "~/functions/get_current_user";
import { CustomPermission } from "~/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "FieldDesk dashboard" },
  ];
}

export async function clientLoader() {
  const currentUser = await getCurrentUser();
  return { currentUser };
}

clientLoader.hydrate = true as const;

const SUPERIOR_ROLES = ["ROLE_ADMIN", "ROLE_DEVELOPER", "ROLE_MANAGER"];

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { currentUser } = loaderData;
  const { t } = useTranslation();

  if (!currentUser) return null;

  const isClient = currentUser.isClient;
  const isSuperior = SUPERIOR_ROLES.includes(currentUser.role);
  const isCustom = currentUser.role === "ROLE_CUSTOM";
  const isTech = currentUser.role === "ROLE_TECH";
  const isModerator = currentUser.role === "ROLE_MODERATOR";
  const perms = currentUser.customPermissions ?? [];

  const hasViewAll = isCustom && perms.includes(CustomPermission.VIEW_ALL_TOPOLOGIES);
  const hasCreate = isCustom && perms.includes(CustomPermission.CREATE_TOPOLOGY);
  const hasViewOwn = isCustom && perms.includes(CustomPermission.VIEW_OWN_UNASSIGNED);

  const showClientTopologies = isClient || isTech || isModerator || isSuperior ||
    (isCustom && (hasViewAll || hasCreate || hasViewOwn));
  const showMyTopologies = !isClient && (isSuperior || isTech || isModerator || hasCreate || hasViewOwn);
  const showAllTopologies = isSuperior || hasViewAll;
  const canCreate = !isClient && (isSuperior || isTech || isModerator || hasCreate);

  const greeting = t(getGreetingKey());

  return (
    <div className="p-6 md:p-10 space-y-8 h-full overflow-y-auto pb-24
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:rounded-full
      [&::-webkit-scrollbar-track]:bg-muted/30
      [&::-webkit-scrollbar-thumb]:rounded-full
      [&::-webkit-scrollbar-thumb]:bg-border
      hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">

      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {currentUser.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("home.subtitle")}
        </p>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showClientTopologies && (
          <DashboardCard
            to="/client-topologies"
            icon={<Users className="h-6 w-6 text-primary" />}
            title={t("home.clientTopologiesTitle")}
            description={t("home.clientTopologiesDescription")}
          />
        )}
        {showMyTopologies && (
          <DashboardCard
            to="/my-topologies"
            icon={<FolderOpen className="h-6 w-6 text-primary" />}
            title={t("home.myTopologiesTitle")}
            description={t("home.myTopologiesDescription")}
          />
        )}
        {showAllTopologies && (
          <DashboardCard
            to="/all-topologies"
            icon={<LayoutList className="h-6 w-6 text-primary" />}
            title={t("home.allTopologiesTitle")}
            description={t("home.allTopologiesDescription")}
          />
        )}
        {canCreate && (
          <DashboardCard
            to="/topology-editor"
            icon={<Plus className="h-6 w-6 text-primary" />}
            title={t("home.newTopologyTitle")}
            description={t("home.newTopologyDescription")}
          />
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription>{description}</CardDescription>
        <Button asChild className="w-full" size="sm">
          <Link to={to}>{t("common.open")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greetingMorning";
  if (hour < 17) return "home.greetingAfternoon";
  return "home.greetingEvening";
}
