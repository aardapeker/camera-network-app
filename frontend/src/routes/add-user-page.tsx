import React from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Form, redirect, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"
import addUserByAdmin from "~/functions/add_user_by_admin"
import type { Route } from "./+types/add-user-page"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { UserRole } from "~/types"

const AVAILABLE_ROLES: { value: UserRole; labelKey: string }[] = [
  { value: UserRole.ADMIN, labelKey: "addUser.roleAdmin" },
  { value: UserRole.DEVELOPER, labelKey: "addUser.roleDeveloper" },
  { value: UserRole.MANAGER, labelKey: "addUser.roleManager" },
  { value: UserRole.MODERATOR, labelKey: "addUser.roleModerator" },
  { value: UserRole.TECH, labelKey: "addUser.roleTech" },
  { value: UserRole.CLIENT, labelKey: "addUser.roleClient" },
  { value: UserRole.CUSTOM, labelKey: "addUser.roleCustom" },
]

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()

  // Validate passwords match
  if (formData.get("password") !== formData.get("verifyPassword")) {
    toast.error(i18n.t("addUser.createFailed"), {
      description: i18n.t("addUser.passwordsDoNotMatch"),
    })
    return null
  }

  // Get the single selected role
  const role = formData.get("role") as UserRole

  if (!role) {
    toast.error(i18n.t("addUser.createFailed"), {
      description: i18n.t("addUser.selectRolePrompt"),
    })
    return null
  }

  const userData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    authorities: [role],
  }

  try {
    const response = await addUserByAdmin(userData)
    toast.success(i18n.t("addUser.createSuccess"), {
      description: response.message,
    })

    // Return a redirect action that React Router will handle
    return { shouldRedirect: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : i18n.t("auth.unexpectedError")
    toast.error(i18n.t("addUser.createFailed"), {
      description: errorMessage,
    })
    return null
  }
}

export default function AddUserPage({ actionData }: Route.ComponentProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Handle form reset after successful user creation
  React.useEffect(() => {
    if (actionData?.shouldRedirect) {
      // Wait 2 seconds before resetting to allow users to read the notification
      const timer = setTimeout(() => {
        // Reset the form instead of navigating
        if (formRef.current) {
          formRef.current.reset()
        }
        setIsSubmitting(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [actionData])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t("addUser.pageTitle")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("addUser.pageSubtitle")}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5" />
              {t("addUser.cardTitle")}
            </CardTitle>
            <CardDescription>
              {t("addUser.cardDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              ref={formRef}
              method="POST"
              className="space-y-6"
              onSubmit={() => setIsSubmitting(true)}
            >
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("addUser.personalInfo")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="firstName">
                      {t("addUser.firstName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="lastName">
                      {t("addUser.lastName")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("addUser.accountInfo")}
                </h3>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">
                    {t("addUser.username")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe"
                    required
                    minLength={3}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("addUser.usernameHint")}
                  </p>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">
                    {t("addUser.email")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">
                    {t("addUser.password")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={t("addUser.passwordPlaceholder")}
                    required
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("addUser.passwordHint")}
                  </p>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="verifyPassword">
                    {t("addUser.verifyPassword")} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="verifyPassword"
                    name="verifyPassword"
                    type="password"
                    placeholder={t("addUser.verifyPasswordPlaceholder")}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="role">
                    {t("addUser.selectRole")} <span className="text-destructive">*</span>
                  </Label>
                  <Select name="role" defaultValue="ROLE_CLIENT" required disabled={isSubmitting}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("addUser.selectRolePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("addUser.rolesLabel")}</SelectLabel>
                        {AVAILABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {t(role.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("addUser.selectRoleHint")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  <UserPlus />
                  {isSubmitting ? t("addUser.creating") : t("addUser.createUser")}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
