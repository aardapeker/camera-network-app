// I SHOULD REFACTOR WHOLE ERROR HANDLING LOGIC WITH TOAST COMPONENT LIKE CHANGE PASSWORD HANDLER :

import type { Route } from "./+types/settings-page"
import type { CurrentUserType, LoginAttempt } from "~/types"

import { useState, useEffect, useRef } from "react"
import { Form, useOutletContext, useFetcher, useNavigate, useNavigation } from "react-router"
import { useTranslation } from "react-i18next"
import i18n from "~/lib/i18n"

import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Camera, Edit, LogOut, Trash2, Loader2, TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"

import deleteMe from "~/functions/delete_me"
import logoutEverywhere from "~/functions/logout_everywhere"
import cleanupAllTokens from "~/functions/cleanup_all_tokens"
import cleanupOldTokens from "~/functions/cleanup_old_tokens"
import updateUserDetails from "~/functions/update_user_details"
import updateUserPassword from "~/functions/update_user_password"
import uploadProfilePicture from "~/functions/upload_profile_picture"
import deleteProfilePicture from "~/functions/delete_profile_picture"

import { toast } from "sonner"
import { Switch } from "~/components/ui/switch"
import { LoginAttemptsTable } from "~/components/table/login-attempts-table"
import getSettings from "~/functions/get_settings"
import updateSettings from "~/functions/update_settings"
import getMyFailedLoginCounts from "~/functions/get_my_failed_login_counts"
import { DeviceType } from "~/components/icons"
import { useTypeLabels } from "~/hooks/use-type-labels"
import { getSettingsPrefixes, type DeviceTypePrefixes } from "~/lib/device-defaults"

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData()

  const intent = formData.get("intent")

  const userData = Object.fromEntries(formData)

  // Handle profile picture upload
  if (intent === "uploadProfilePicture") {
    try {
      const file = formData.get("file") as File

      if (!file || file.size === 0) {
        toast.error(i18n.t("settings.uploadFailedTitle"), {
          description: i18n.t("settings.noFileProvided"),
        })
        return null
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error(i18n.t("settings.invalidFileTypeTitle"), {
          description: i18n.t("settings.invalidFileTypeDescription"),
        })
        return null
      }

      // Validate file size (1MB)
      if (file.size > 1 * 1024 * 1024) {
        toast.error(i18n.t("settings.fileTooLargeTitle"), {
          description: i18n.t("settings.fileTooLargeDescription"),
        })
        return null
      }

      const result = await uploadProfilePicture(file)

      toast.success(i18n.t("settings.pictureUpdatedTitle"), {
        description: result.message,
      })

      return null
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : i18n.t("auth.unexpectedError")
      toast.error(i18n.t("settings.uploadFailedTitle"), {
        description: errorMessage,
      })
      return null
    }
  }

  // Handle delete profile picture
  if (intent === "deleteProfilePicture") {
    try {
      const fileName = formData.get("fileName") as string

      if (!fileName) {
        toast.error(i18n.t("settings.deleteFailedTitle"), {
          description: i18n.t("settings.noFilenameProvided"),
        })
        return null
      }

      const result = await deleteProfilePicture(fileName)

      toast.success(i18n.t("settings.pictureDeletedTitle"), {
        description: result.message,
      })

      return null
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : i18n.t("auth.unexpectedError")
      toast.error(i18n.t("settings.deleteFailedTitle"), {
        description: errorMessage,
      })
      return null
    }
  }

  // Handle password change
  if (intent === "changePassword") {
    if (userData.newPassword === userData.confirmNewPassword) {
      try {
        const updatePasswordRequestData = {
          currentPassword: userData.currentPassword,
          newPassword: userData.newPassword,
        }

        const result = await updateUserPassword(updatePasswordRequestData)
        if (result) {
          toast.success(result.message, {
            description: i18n.t("settings.passwordUpdatedDescription"),
          })
        }
        return null
        // I SHOULD REFACTOR WHOLE ERROR HANDLING LOGIC WITH TOAST COMPONENT LIKE THIS:
      } catch (error: unknown) {
        const err = error as {
          message?: string
          details?: Record<string, string>
        }
        const errorDetails = err.details
          ? Object.values(err.details)[0]
          : i18n.t("settings.passwordUpdateFailed")
        const errorMessage = err.message || i18n.t("auth.unexpectedError")
        toast.error(errorMessage, {
          description: errorDetails,
        })
        return null
      }
    } else {
      toast.error(i18n.t("settings.passwordsDontMatchTitle"), {
        description: i18n.t("settings.passwordsDontMatchDescription"),
      })
      return null
    }
  }

  // Handle profile update
  if (userData.formType === "updateProfile") {
    try {
      const updateUserDetailsRequestData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
      }

      const result = await updateUserDetails(updateUserDetailsRequestData)

      if (result) {
        toast.success(result.message, {
          description: i18n.t("settings.detailsUpdatedDescription"),
        })
      }
      return null
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : i18n.t("auth.unexpectedError")
      toast.error(errorMessage, {
        description: i18n.t("settings.detailsUpdateFailedDescription"),
      })
      return null
    }
  }
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { deviceLabels } = useTypeLabels()
  const context = useOutletContext<{
    userData: CurrentUserType
    myLoginAttempts: LoginAttempt[]
  }>()
  const userData = context?.userData
  const myLoginAttempts = context?.myLoginAttempts
  const navigate = useNavigate()

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isEditUserInfoDialogOpen, setIsEditUserInfoDialogOpen] =
    useState(false)
  const [isLogoutEveryDeviceDialogOpen, setIsLogoutEveryDeviceDialogOpen] =
    useState(false)
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false)
  const [isCleanupAllTokensDialogOpen, setIsCleanupAllTokensDialogOpen] =
    useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCleaningUpOldTokens, setIsCleaningUpOldTokens] = useState(false)
  const [isCleaningUpAllTokens, setIsCleaningUpAllTokens] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const isSavingSettingsRef = useRef(false)
  const [devicePrefixes, setDevicePrefixes] = useState<DeviceTypePrefixes | null>(null)
  const [isSavingDevicePrefixes, setIsSavingDevicePrefixes] = useState(false)

  useEffect(() => {
    getSettings()
      .then((s) => {
        setAutoSaveEnabled(s.autoSaveEnabled)
        setDevicePrefixes(getSettingsPrefixes(s))
      })
      .catch(() => toast.error(t("settings.loadFailed")))
      .finally(() => setIsLoadingSettings(false))
  }, [])

  const handleSaveDevicePrefixes = async () => {
    if (!devicePrefixes) return
    setIsSavingDevicePrefixes(true)
    try {
      await updateSettings({
        cameraPrefix: devicePrefixes[DeviceType.CAMERA],
        switchPrefix: devicePrefixes[DeviceType.SWITCH],
        nvrPrefix: devicePrefixes[DeviceType.NVR],
        routerPrefix: devicePrefixes[DeviceType.ROUTER],
        accessPointPrefix: devicePrefixes[DeviceType.ACCESS_POINT],
        upsPrefix: devicePrefixes[DeviceType.UPS],
        hornSpeakerPrefix: devicePrefixes[DeviceType.HORN_SPEAKER],
      })
      toast.success(t("settings.devicePrefixesSaved"))
    } catch {
      toast.error(t("settings.saveFailed"))
    } finally {
      setIsSavingDevicePrefixes(false)
    }
  }

  const handleAutoSaveToggle = async (enabled: boolean) => {
    if (isSavingSettingsRef.current) return
    isSavingSettingsRef.current = true
    setAutoSaveEnabled(enabled)
    try {
      await updateSettings({ autoSaveEnabled: enabled })
    } catch {
      setAutoSaveEnabled(!enabled)
      toast.error(t("settings.saveFailed"))
    } finally {
      isSavingSettingsRef.current = false
    }
  }

  // Use fetcher for upload and delete profile picture
  const uploadPictureFetcher = useFetcher()
  const deletePictureFetcher = useFetcher()

  const navigation = useNavigation()
  const isUploading = uploadPictureFetcher.state !== "idle"
  const isDeletingPicture = deletePictureFetcher.state !== "idle"
  const isSubmittingPassword =
    navigation.state === "submitting" &&
    navigation.formData?.get("intent") === "changePassword"
  const isSubmittingUserInfo =
    navigation.state === "submitting" &&
    navigation.formData?.get("formType") === "updateProfile"

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteMe()
      toast.success(t("settings.accountDeletedTitle"), {
        description: t("settings.accountDeletedDescription"),
      })
      // Redirect to login or home page after deletion
      setTimeout(() => {
        navigate("/", { replace: true })
      }, 1500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("auth.unexpectedError")
      toast.error(t("settings.deleteFailedTitle"), {
        description: errorMessage,
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleCleanupAllTokens = async () => {
    setIsCleaningUpAllTokens(true)
    try {
      const result = await cleanupAllTokens()

      toast.success(t("settings.tokenCleanupCompletedTitle"), {
        description: t("settings.tokenCleanupCompletedDescription", { count: result.deletedCount }),
      })

      setIsCleanupAllTokensDialogOpen(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("auth.unexpectedError")

      toast.error(t("settings.cleanupFailedTitle"), {
        description: errorMessage,
      })
    } finally {
      setIsCleaningUpAllTokens(false)
    }
  }

  const handleCleanupOldTokens = async () => {
    setIsCleaningUpOldTokens(true)
    try {
      const result = await cleanupOldTokens()

      toast.success(t("settings.oldTokensCleanedTitle"), {
        description: t("settings.oldTokensCleanedDescription", { count: result.deletedCount }),
      })

      setIsCleanupDialogOpen(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("auth.unexpectedError")

      toast.error(t("settings.cleanupFailedTitle"), {
        description: errorMessage,
      })
    } finally {
      setIsCleaningUpOldTokens(false)
    }
  }

  const handleLogoutEveryDevice = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logoutEverywhere()

      toast.success(result.message, {
        description: t("settings.sessionsRevoked", { count: result.revokedTokensCount }),
      })

      // Close dialog
      setIsLogoutEveryDeviceDialogOpen(false)

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/signin", { replace: true })
      }, 1500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("auth.unexpectedError")

      toast.error(t("settings.logoutFailedTitle"), {
        description: errorMessage,
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Create FormData and submit using fetcher
    const formData = new FormData()
    formData.append("intent", "uploadProfilePicture")
    formData.append("file", file)

    uploadPictureFetcher.submit(formData, {
      method: "POST",
      encType: "multipart/form-data",
    })

    // Reset the file input
    event.target.value = ""
  }

  // Helper to get filename from URL
  const getFileNameFromUrl = (url: string) => {
    return url.substring(url.lastIndexOf("/") + 1)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t("settings.pageTitle")}</h1>

      {/* Profile Photo Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.photoTitle")}</CardTitle>
          <CardDescription>
            {t("settings.photoDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32">
            <AvatarImage
              src={userData?.profilePictureUrl}
              alt="Profile Picture"
            />
            <AvatarFallback className="text-2xl">
              {userData?.firstName?.[0]?.toUpperCase()}
              {userData?.lastName?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Hidden file input */}
          <input
            type="file"
            id="profile-picture-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading || isDeletingPicture}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Upload/Update Button */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() =>
                document.getElementById("profile-picture-upload")?.click()
              }
              disabled={isUploading || isDeletingPicture}
            >
              <Camera className="h-4 w-4" />
              {isUploading ? t("settings.uploading") : t("settings.updatePicture")}
            </Button>

            {/* Delete Button - Only show if user has a profile picture */}
            {userData?.profilePictureUrl && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                    disabled={isUploading || isDeletingPicture}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeletingPicture ? t("settings.deletingPicture") : t("settings.deletePicture")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("settings.deletePictureDialogTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("settings.deletePictureDialogDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (userData?.profilePictureUrl) {
                          const fileName = getFileNameFromUrl(
                            userData.profilePictureUrl,
                          )
                          deletePictureFetcher.submit(
                            {
                              intent: "deleteProfilePicture",
                              fileName: fileName,
                            },
                            { method: "POST" },
                          )
                        }
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Details Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.basicDetailsTitle")}</CardTitle>
          <CardDescription>{t("settings.basicDetailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("settings.firstName")}</Label>
              <Input
                id="firstName"
                value={userData.firstName}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("settings.lastName")}</Label>
              <Input
                id="lastName"
                value={userData.lastName}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t("settings.username")}</Label>
            <Input
              id="username"
              value={userData.username}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.email")}</Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              readOnly
              className="bg-muted"
            />
          </div>

          <Dialog
            open={isEditUserInfoDialogOpen}
            onOpenChange={setIsEditUserInfoDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Edit className="h-4 w-4" />
                {t("settings.changeUserInfo")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("settings.editUserInfoTitle")}</DialogTitle>
                <DialogDescription>
                  {t("settings.editUserInfoDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form method="post" className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="hidden"
                      name="formType"
                      value="updateProfile"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("settings.firstName")}</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder={userData.firstName}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("settings.lastName")}</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder={userData.lastName}
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditUserInfoDialogOpen(false)}
                    disabled={isSubmittingUserInfo}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                    onClick={() => setIsEditUserInfoDialogOpen(false)}
                    disabled={isSubmittingUserInfo}
                  >
                    {isSubmittingUserInfo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                    {isSubmittingUserInfo ? t("common.saving") : t("settings.changeName")}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.passwordTitle")}</CardTitle>
          <CardDescription>{t("settings.passwordDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("settings.currentPassword")}</Label>
            <Input
              id="password"
              type="password"
              value="••••••••••"
              readOnly
              className="bg-muted"
            />
          </div>

          <Dialog
            open={isPasswordDialogOpen}
            onOpenChange={setIsPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                <Edit className="h-4 w-4" />
                {t("settings.changeMyPassword")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t("settings.changePasswordTitle")}</DialogTitle>
                <DialogDescription>
                  {t("settings.editUserInfoDescription")}
                </DialogDescription>
              </DialogHeader>
              <Form method="post" className="space-y-4 py-4">
                <div className="space-y-2">
                  <input type="hidden" name="intent" value="changePassword" />
                  <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("settings.confirmNewPassword")}</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={isSubmittingPassword}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => setIsPasswordDialogOpen(false)}
                    disabled={isSubmittingPassword}
                  >
                    {isSubmittingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("settings.changing")}
                      </>
                    ) : (
                      t("settings.changePassword")
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Logout Everywhere Section */}
      <Card className="mb-6 border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("settings.logoutEverywhereTitle")}</CardTitle>
          <CardDescription>
            {t("settings.logoutEverywhereDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isLogoutEveryDeviceDialogOpen}
            onOpenChange={setIsLogoutEveryDeviceDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                {t("settings.logoutEverywhereTitle")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("settings.areYouSure")}</DialogTitle>
                <DialogDescription>
                  {t("settings.logoutEverywhereConfirm")}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsLogoutEveryDeviceDialogOpen(false)}
                  disabled={isLoggingOut}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLogoutEveryDevice}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? t("settings.loggingOut") : t("settings.yesLogoutAll")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Token Cleanup Section - Admin Only */}
      {userData.isAdmin && (
        <>
          {/* Cleanup Old Tokens (30+ days) */}
          <Card className="mb-6 border-orange-500">
            <CardHeader>
              <CardTitle className="text-orange-600">
                {t("settings.cleanupOldTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.cleanupOldDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isCleanupDialogOpen}
                onOpenChange={setIsCleanupDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("settings.cleanupOldTitle")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("settings.cleanupOldDialogTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("settings.cleanupOldDialogDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCleanupDialogOpen(false)}
                      disabled={isCleaningUpOldTokens}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleCleanupOldTokens}
                      disabled={isCleaningUpOldTokens}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {isCleaningUpOldTokens
                        ? t("settings.cleaning")
                        : t("settings.yesCleanupOld")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Cleanup ALL Revoked Tokens */}
          <Card className="mb-6 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">
                {t("settings.cleanupAllTitle")}
              </CardTitle>
              <CardDescription>
                {t("settings.cleanupAllDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog
                open={isCleanupAllTokensDialogOpen}
                onOpenChange={setIsCleanupAllTokensDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("settings.cleanupAllTitle")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("settings.cleanupAllDialogTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("settings.cleanupAllDialogDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCleanupAllTokensDialogOpen(false)}
                      disabled={isCleaningUpAllTokens}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCleanupAllTokens}
                      disabled={isCleaningUpAllTokens}
                    >
                      {isCleaningUpAllTokens
                        ? t("settings.cleaning")
                        : t("settings.yesCleanupAll")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Profile Section */}
      {!userData.isAdmin && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t("settings.deleteProfileTitle")}</CardTitle>
            <CardDescription>
              {t("settings.deleteProfileDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("settings.deleteAccount")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("settings.areYouSure")}</DialogTitle>
                  <DialogDescription>
                    {t("settings.deleteAccountConfirm")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? t("settings.deleting") : t("settings.yesDeleteAccount")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
      {/* Editor Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.editorPreferencesTitle")}</CardTitle>
          <CardDescription>{t("settings.editorPreferencesDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-save-toggle">{t("settings.autoSave")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.autoSaveDescription")}
              </p>
            </div>
            <Switch
              id="auto-save-toggle"
              checked={autoSaveEnabled}
              onCheckedChange={handleAutoSaveToggle}
              disabled={isLoadingSettings}
            />
          </div>
          {autoSaveEnabled && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{t("settings.autoSaveWarning")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Naming Defaults */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("settings.deviceNamingTitle")}</CardTitle>
          <CardDescription>{t("settings.deviceNamingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {devicePrefixes && Object.values(DeviceType).map((type) => (
            <div key={type} className="flex items-center gap-3">
              <Label className="w-36 shrink-0">{deviceLabels[type]}</Label>
              <Input
                value={devicePrefixes[type]}
                onChange={(e) =>
                  setDevicePrefixes((prev) => prev && { ...prev, [type]: e.target.value })
                }
                disabled={isLoadingSettings}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveDevicePrefixes} disabled={isSavingDevicePrefixes || !devicePrefixes}>
            {isSavingDevicePrefixes ? t("common.saving") : t("common.save")}
          </Button>
        </CardFooter>
      </Card>

      <LoginAttemptsTable loginAttempts={myLoginAttempts} />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.failedLoginTitle")}</CardTitle>
            <CardDescription>
              {t("settings.failedLoginDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => getMyFailedLoginCounts(null)}
              >
                {t("settings.allTime")}
              </Button>
              <Button
                variant="outline"
                onClick={() => getMyFailedLoginCounts("60")}
              >
                {t("settings.lastHour")}
              </Button>
              <Button
                variant="outline"
                onClick={() => getMyFailedLoginCounts("1440")}
              >
                {t("settings.lastDay")}
              </Button>
              <Button
                variant="outline"
                onClick={() => getMyFailedLoginCounts("10080")}
              >
                {t("settings.lastWeek")}
              </Button>
              <Button
                variant="outline"
                onClick={() => getMyFailedLoginCounts("43200")}
              >
                {t("settings.lastMonth")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
