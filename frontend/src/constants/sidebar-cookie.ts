import {
  Home,
  User2,
  LayoutDashboard,
  LucideUserPlus2,
  DatabaseBackup,
  HardDrive,
  Activity,
  ClipboardList,
  Mail,
  Package,
  Radar,
  Sparkles,
  Building2,
} from "lucide-react";

export const SIDEBAR_COOKIE_NAME = "sidebar_state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTH = "16rem";
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
export const menuItems = [
  { nameKey: "sidebar.home", icon: Home, href: "/home", exact: true },
  {
    nameKey: "sidebar.dashboard",
    icon: LayoutDashboard,
    href: "/admin",
    exact: true,
  },
  { nameKey: "sidebar.users", icon: User2, href: "/admin/users", exact: true },
  {
    nameKey: "sidebar.newUser",
    icon: LucideUserPlus2,
    href: "/admin/users/new",
    exact: true,
  },
  {
    nameKey: "sidebar.backup",
    icon: DatabaseBackup,
    href: "/admin/backup",
    exact: true,
  },
  {
    nameKey: "sidebar.storage",
    icon: HardDrive,
    href: "/admin/storage",
    exact: true,
  },
  {
    nameKey: "sidebar.serverMetrics",
    icon: Activity,
    href: "/admin/server-metrics",
    exact: true,
  },
  {
    nameKey: "sidebar.serviceForms",
    icon: ClipboardList,
    href: "/admin/service-forms",
    exact: true,
  },
  {
    nameKey: "sidebar.emailRecipients",
    icon: Mail,
    href: "/admin/email-recipients",
    exact: true,
  },
  {
    nameKey: "sidebar.components",
    icon: Package,
    href: "/admin/components",
    exact: true,
  },
  {
    nameKey: "sidebar.customers",
    icon: Building2,
    href: "/admin/customers",
    exact: true,
  },
  {
    nameKey: "sidebar.serviceFormTemplates",
    icon: Sparkles,
    href: "/admin/service-form-templates",
    exact: true,
  },
  {
    nameKey: "sidebar.networkScans",
    icon: Radar,
    href: "/admin/network-scans",
    exact: true,
  },
];
