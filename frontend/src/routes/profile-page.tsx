import { Badge } from "~/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Switch } from "~/components/ui/switch"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { CalendarDays, Mail, Shield, User } from "lucide-react"
import { useParams } from "react-router"
import { useTranslation } from "react-i18next"
import getUserByUsername from "~/functions/get_user_by_username"
import getCustomPermissions from "~/functions/get_custom_permissions"
import updateCustomPermissions from "~/functions/update_custom_permissions"
import updateUserRole from "~/functions/update_user_role"
import getMe from "~/functions/get_me"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { User as UserType, CurrentUserType } from "~/types"
import { CustomPermission, UserRole } from "~/types"

const ASSIGNABLE_ROLES = [
  UserRole.DEVELOPER,
  UserRole.MANAGER,
  UserRole.MODERATOR,
  UserRole.TECH,
  UserRole.CLIENT,
  UserRole.CUSTOM,
] as const

const ROLE_LABEL_KEYS: Record<string, string> = {
  [UserRole.DEVELOPER]: "userProfile.roleDeveloper",
  [UserRole.MANAGER]: "userProfile.roleManager",
  [UserRole.MODERATOR]: "userProfile.roleModerator",
  [UserRole.TECH]: "userProfile.roleTech",
  [UserRole.CLIENT]: "userProfile.roleClient",
  [UserRole.CUSTOM]: "userProfile.roleCustom",
}

const PERMISSION_LABELS: Record<CustomPermission, { labelKey: string; descKey: string }> = {
  [CustomPermission.ACCESS_ADMIN_PANEL]: {
    labelKey: "userProfile.permAccessAdminPanelLabel",
    descKey: "userProfile.permAccessAdminPanelDesc",
  },
  [CustomPermission.VIEW_ALL_TOPOLOGIES]: {
    labelKey: "userProfile.permViewAllLabel",
    descKey: "userProfile.permViewAllDesc",
  },
  [CustomPermission.VIEW_OWN_UNASSIGNED]: {
    labelKey: "userProfile.permViewOwnUnassignedLabel",
    descKey: "userProfile.permViewOwnUnassignedDesc",
  },
  [CustomPermission.EDIT_OWN_UNASSIGNED]: {
    labelKey: "userProfile.permEditOwnUnassignedLabel",
    descKey: "userProfile.permEditOwnUnassignedDesc",
  },
  [CustomPermission.CREATE_TOPOLOGY]: {
    labelKey: "userProfile.permCreateLabel",
    descKey: "userProfile.permCreateDesc",
  },
  [CustomPermission.ASSIGN_TO_CLIENT]: {
    labelKey: "userProfile.permAssignLabel",
    descKey: "userProfile.permAssignDesc",
  },
  [CustomPermission.EDIT_ALL_UNASSIGNED]: {
    labelKey: "userProfile.permEditAllUnassignedLabel",
    descKey: "userProfile.permEditAllUnassignedDesc",
  },
  [CustomPermission.EDIT_CLIENT_ASSIGNED]: {
    labelKey: "userProfile.permEditClientAssignedLabel",
    descKey: "userProfile.permEditClientAssignedDesc",
  },
  [CustomPermission.VIEW_OWN_ASSIGNED]: {
    labelKey: "userProfile.permViewOwnAssignedLabel",
    descKey: "userProfile.permViewOwnAssignedDesc",
  },
}

// Permissions that are children of CREATE_TOPOLOGY (auto-enable parent when toggled on)
const CREATE_TOPOLOGY_CHILDREN = [
  CustomPermission.ASSIGN_TO_CLIENT,
  CustomPermission.EDIT_ALL_UNASSIGNED,
  CustomPermission.EDIT_CLIENT_ASSIGNED,
]

const TOP_LEVEL_PERMISSIONS = [
  CustomPermission.ACCESS_ADMIN_PANEL,
  CustomPermission.VIEW_ALL_TOPOLOGIES,
  CustomPermission.CREATE_TOPOLOGY,
]

export default function ProfilePage() {
  const { t } = useTranslation()
  const { username } = useParams<{ username: string }>()

  const [user, setUser] = useState<UserType | null>(null)
  const [currentViewer, setCurrentViewer] = useState<CurrentUserType | null>(null)
  const [permissions, setPermissions] = useState<Set<CustomPermission>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isChangingRole, setIsChangingRole] = useState(false)

  const isCustomRole = user?.authorities?.includes(UserRole.CUSTOM)
  const isViewerAdmin = currentViewer?.role === "ROLE_ADMIN"
  const isTargetAdmin = user?.authorities?.includes(UserRole.ADMIN)

  useEffect(() => {
    getMe().then(setCurrentViewer).catch(console.error)
  }, [])

  useEffect(() => {
    if (!username) return
    getUserByUsername(username).then((u) => {
      const loaded = u as unknown as UserType
      setUser(loaded)
      const currentRole = loaded.authorities?.[0] ?? ""
      setSelectedRole(currentRole)
    }).catch(console.error)
  }, [username])

  useEffect(() => {
    if (!username || !isCustomRole) return
    getCustomPermissions(username)
      .then((perms) => setPermissions(new Set(perms)))
      .catch(console.error)
  }, [username, isCustomRole])

  function togglePermission(perm: CustomPermission) {
    setPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) {
        next.delete(perm)
        // Turning off CREATE_TOPOLOGY also turns off its children
        if (perm === CustomPermission.CREATE_TOPOLOGY) {
          CREATE_TOPOLOGY_CHILDREN.forEach((c) => next.delete(c))
        }
      } else {
        next.add(perm)
        // Turning on a child automatically enables CREATE_TOPOLOGY
        if (CREATE_TOPOLOGY_CHILDREN.includes(perm)) {
          next.add(CustomPermission.CREATE_TOPOLOGY)
        }
      }
      return next
    })
  }

  async function handleRoleChange() {
    if (!username || !selectedRole) return
    setIsChangingRole(true)
    try {
      await updateUserRole(username, selectedRole)
      const updated = await getUserByUsername(username) as unknown as UserType
      setUser(updated)
      toast.success(t("userProfile.roleUpdated"))
    } catch (e) {
      toast.error(t("userProfile.roleUpdateFailed"), {
        description: e instanceof Error ? e.message : t("userProfile.unexpectedError"),
      })
    } finally {
      setIsChangingRole(false)
    }
  }

  async function savePermissions() {
    if (!username) return
    setIsSaving(true)
    try {
      await updateCustomPermissions(username, Array.from(permissions))
      toast.success(t("userProfile.permissionsSaved"))
    } catch (e) {
      toast.error(t("userProfile.permissionsSaveFailed"), {
        description: e instanceof Error ? e.message : t("userProfile.unexpectedError"),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?"

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profilePictureUrl ?? ""} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-muted-foreground">@{user?.username}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user?.authorities?.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role.replace("ROLE_", "")}
                    </Badge>
                  ))}
                  <Badge
                    variant={user?.status === "ACTIVE" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {user?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={isCustomRole ? "permissions" : "details"}>
          <TabsList>
            <TabsTrigger value="details">{t("userProfile.details")}</TabsTrigger>
            {isCustomRole && (
              <TabsTrigger value="permissions" className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {t("userProfile.permissions")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>{t("userProfile.userDetailsTitle")}</CardTitle>
                <CardDescription>{t("userProfile.userDetailsDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("userProfile.email")}</span>
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("userProfile.username")}</span>
                  <span>{user?.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("userProfile.memberSince")}</span>
                  <span>{user?.createdAt}</span>
                </div>

                {isViewerAdmin && !isTargetAdmin && (
                  <div className="pt-4 border-t space-y-2">
                    <Label className="text-sm font-medium">{t("userProfile.changeRole")}</Label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="flex-1 bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {t(ROLE_LABEL_KEYS[role])}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleRoleChange}
                        disabled={isChangingRole || selectedRole === (user?.authorities?.[0] ?? "")}
                      >
                        {isChangingRole ? t("common.saving") : t("common.apply")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions tab — only for ROLE_CUSTOM users */}
          {isCustomRole && (
            <TabsContent value="permissions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("userProfile.customPermissionsTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("userProfile.customPermissionsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TOP_LEVEL_PERMISSIONS.map((perm) => (
                    <div key={perm}>
                      <div className="flex items-center justify-between py-2 border-b">
                        <div className="space-y-0.5">
                          <Label htmlFor={perm} className="text-sm font-medium cursor-pointer">
                            {t(PERMISSION_LABELS[perm].labelKey)}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {t(PERMISSION_LABELS[perm].descKey)}
                          </p>
                        </div>
                        <Switch
                          id={perm}
                          checked={permissions.has(perm)}
                          onCheckedChange={() => togglePermission(perm)}
                        />
                      </div>
                      {perm === CustomPermission.CREATE_TOPOLOGY && CREATE_TOPOLOGY_CHILDREN.map((child) => (
                        <div key={child} className="flex items-center justify-between py-2 pl-6 border-b border-dashed">
                          <div className="space-y-0.5">
                            <Label htmlFor={child} className="text-sm font-medium cursor-pointer text-muted-foreground">
                              ↳ {t(PERMISSION_LABELS[child].labelKey)}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {t(PERMISSION_LABELS[child].descKey)}
                            </p>
                          </div>
                          <Switch
                            id={child}
                            checked={permissions.has(child)}
                            onCheckedChange={() => togglePermission(child)}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="pt-2">
                    <Button onClick={savePermissions} disabled={isSaving}>
                      {isSaving ? t("common.saving") : t("userProfile.savePermissions")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
