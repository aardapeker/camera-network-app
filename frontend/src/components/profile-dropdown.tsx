import { Form, Link } from "react-router";
import { useTranslation } from "react-i18next";

import type { HeaderProps } from "~/types";
import { CustomPermission } from "~/types";

import { LayoutDashboard, LogOut, Plus, Settings, FolderOpen, LayoutList, Users } from "lucide-react";

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

const SUPERIOR_ROLES = ["ROLE_ADMIN", "ROLE_DEVELOPER", "ROLE_MANAGER"];

function ProfileDropdown({ userData, isAdmin }: HeaderProps) {
  const { t } = useTranslation();
  const isCustom = userData.role === "ROLE_CUSTOM";
  const isSuperior = SUPERIOR_ROLES.includes(userData.role);
  const perms = userData.customPermissions ?? [];

  const hasPermission = (p: CustomPermission) => perms.includes(p);

  const hasViewAll = hasPermission(CustomPermission.VIEW_ALL_TOPOLOGIES);
  const hasCreate = hasPermission(CustomPermission.CREATE_TOPOLOGY);

  const isTech = userData.role === "ROLE_TECH";
  const isModerator = userData.role === "ROLE_MODERATOR";

  const showClientTopologies = userData.isClient || isTech || isModerator || isSuperior ||
    (isCustom && (hasViewAll || hasCreate || hasPermission(CustomPermission.VIEW_OWN_UNASSIGNED)));

  const hasTopologyAccess = !userData.isClient && (
    !isCustom ||
    hasCreate ||
    hasPermission(CustomPermission.VIEW_OWN_UNASSIGNED) ||
    hasViewAll
  );

  const canCreateTopology = !userData.isClient && (!isCustom || hasCreate);

  return (
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
          {/* Language + Theme Switch Toggle Buttons */}
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
        {showClientTopologies && (
          <DropdownMenuItem asChild>
            <Link to="/client-topologies">
              <Users className="mr-2 h-4 w-4" />
              <span>{t("profile.clientTopologies")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        {hasTopologyAccess && (
          <>
            {canCreateTopology && (
              <DropdownMenuItem asChild>
                <Link to="/my-topologies">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <span>{t("profile.myTopologies")}</span>
                </Link>
              </DropdownMenuItem>
            )}
            {(isSuperior || hasViewAll) && (
              <DropdownMenuItem asChild>
                <Link to="/all-topologies">
                  <LayoutList className="mr-2 h-4 w-4" />
                  <span>{t("profile.allTopologies")}</span>
                </Link>
              </DropdownMenuItem>
            )}
            {canCreateTopology && (
              <DropdownMenuItem asChild>
                <Link to="/topology-editor">
                  <Plus className="mr-2 h-4 w-4" />
                  <span>{t("profile.newTopology")}</span>
                </Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        {isAdmin && (
          <DropdownMenuItem
            asChild
            className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            <Link to="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t("profile.adminDashboard")}
            </Link>
          </DropdownMenuItem>
        )}
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
  );
}

export default ProfileDropdown;
