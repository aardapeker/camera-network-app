import { Form, Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ClipboardList, LogOut, Plus, Settings } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import ModeToggle from "./mode-toggle";
import LanguageToggle from "./language-toggle";
import { SERVICE_PORTAL_FORMS, SERVICE_PORTAL_HOME } from "~/lib/service-portal";
import type { HeaderProps } from "~/types";

/**
 * Header for the service-form portal host. Deliberately narrow: a new form, the
 * technician's own forms, and account actions. No topology or admin entries.
 */
export function ServicePortalHeader({ userData }: HeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const links = [
    { to: SERVICE_PORTAL_HOME, label: t("serviceForm.newForm"), icon: Plus },
    { to: SERVICE_PORTAL_FORMS, label: t("serviceForm.myForms"), icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 w-full border-b bg-background z-10">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link to={SERVICE_PORTAL_HOME} className="flex items-center shrink-0">
            <span className="sr-only">FieldDesk</span>
            <img
              src="/logo.png"
              alt="FieldDesk"
              className="h-8 sm:h-10"
            />
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                asChild
                variant={pathname === to ? "secondary" : "ghost"}
                size="sm"
              >
                <Link to={to}>
                  <Icon className="size-4 sm:mr-2" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.profilePictureUrl} alt="User Avatar" />
                <AvatarFallback>
                  {userData.firstName?.charAt(0).toUpperCase()}
                  {userData.lastName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">{t("profile.openUserMenu")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-between px-2 py-1.5 text-sm font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userData.firstName} {userData.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userData.email}
                </p>
              </div>
              <div className="flex items-center">
                <LanguageToggle />
                <ModeToggle />
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>{t("profile.settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Form method="post" action="/logout">
                <button type="submit" className="flex flex-row gap-2 w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("profile.logOut")}</span>
                </button>
              </Form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
