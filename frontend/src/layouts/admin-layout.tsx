import { Outlet, redirect, useLocation } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AdminSidebar } from "~/components/admin-sidebar";
import { Separator } from "~/components/ui/separator";
import BreadCrumb from "~/components/bread-crumb";
import { getAdminStatus } from "~/functions/get_admin_status";
import getCurrentUser from "~/functions/get_current_user";
import { CustomPermission } from "~/types";
import type { Route } from "./+types/admin-layout";

export async function clientLoader() {
  const currentUser = await getCurrentUser();

  // Only ADMIN, DEVELOPER, MANAGER, and CUSTOM (with ACCESS_ADMIN_PANEL) can access the admin panel
  const allowedRoles = ["ROLE_ADMIN", "ROLE_DEVELOPER", "ROLE_MANAGER"];
  const isCustomWithAdminAccess =
    currentUser?.role === "ROLE_CUSTOM" &&
    currentUser.customPermissions?.includes(CustomPermission.ACCESS_ADMIN_PANEL);

  if (!currentUser || (!allowedRoles.includes(currentUser.role) && !isCustomWithAdminAccess)) {
    throw redirect("/home");
  }

  const isAdmin = await getAdminStatus();

  return { currentUser, isAdmin };
}

clientLoader.hydrate = true as const;

function AdminLayout({ loaderData, actionData }: Route.ComponentProps) {
  const { currentUser } = loaderData;
  const location = useLocation();

  // Parse the current path for breadcrumb
  const pathSegments = location.pathname
    .split("/")
    .filter((segment) => segment);

  return (
    <div className="flex h-screen ">
      <SidebarProvider>
        <AdminSidebar userData={currentUser} />
        <SidebarInset>
          <header className="flex h-16 border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <BreadCrumb pathSegments={pathSegments} />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ contain: "strict" }}>
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export default AdminLayout;
