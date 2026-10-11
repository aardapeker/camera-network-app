import { LogOut, ChevronUp, Settings } from 'lucide-react'

import { Form, Link, NavLink } from "react-router"
import { useTranslation } from "react-i18next"

import type { CurrentUserType } from "~/types"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '~/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

import ModeToggle from "./mode-toggle"
import LanguageToggle from "./language-toggle"
import { menuItems } from "~/constants/sidebar-cookie"



export function AdminSidebar({ userData }: { userData: CurrentUserType }) {
  const { t } = useTranslation()

  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader>
        <div className="flex justify-center px-2 py-3">
          <img src="/logo.png" alt="FieldDesk" className="h-14 w-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-1.5">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.nameKey}>
              <SidebarMenuButton
                asChild
                className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <NavLink to={item.href} end={item.exact} className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  {t(item.nameKey)}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full justify-between text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={userData.profilePictureUrl} alt="User Avatar" />
                  <AvatarFallback>{userData.firstName.charAt(0).toUpperCase()}{userData.lastName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{userData.username}</span>
              </div>
              <ChevronUp className="h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" side="right">
            {/* This div is same as the profile dropdown */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData.firstName} {userData.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
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
                <span>{t("sidebar.settings")}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Form method="post" action="/logout" >
                <button type="submit" className="flex flex-row gap-2 w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("sidebar.logOut")}</span>
                </button>
              </Form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

