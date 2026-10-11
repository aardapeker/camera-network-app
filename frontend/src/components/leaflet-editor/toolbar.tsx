import { useRef, useState, useEffect, useCallback } from "react"
import {
  Save,
  Upload,
  X,
  Link,
  Users,
  Loader2,
  Pencil,
  Undo2,
  Redo2,
  FileImage,
  FileDown,
  Lock,
  LockOpen,
  ChevronDown,
  Check,
  Settings2,
} from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import getClients from "~/functions/get_clients"
import uploadBlueprintPicture from "~/functions/upload_blueprint_picture"
import { PdfExportDialog } from "~/components/pdf-export-dialog"
import type { User } from "~/types"
import type { PdfExportOptions } from "~/hooks/use-pdf-export"
import type { ViewerDevice } from "~/types/topology"
import L from "leaflet"

interface LeafletToolbarProps {
  clientUsernames: string[]
  onClientChange: (usernames: string[]) => void
  blueprintUrl: string | null
  onBlueprintUploaded: (url: string) => void
  onBlueprintRemove: () => void
  connectionMode: boolean
  onToggleConnectionMode: () => void
  onSave: () => void
  isSaving: boolean
  hasUnsavedChanges: boolean
  isEditMode?: boolean
  topologyName?: string
  onTopologyNameChange?: (name: string) => void
  onUndo?: () => void
  onRedo?: () => void
  // null = not yet resolved (user data still loading), true/false = resolved
  clientOptional?: boolean | null
  // When true, a client must be selected before uploading a blueprint
  clientRequired?: boolean
  onExportPdf?: (options: PdfExportOptions) => void
  isExporting?: boolean
  exportImageBounds?: L.LatLngBoundsExpression
  exportDevices?: ViewerDevice[]
  isLocked?: boolean
  onToggleLock?: () => void
  lastSavedAt?: Date | null
  onEditProjectDefaults?: () => void
}

export function LeafletToolbar({
  clientUsernames,
  onClientChange,
  blueprintUrl,
  onBlueprintUploaded,
  onBlueprintRemove,
  connectionMode,
  onToggleConnectionMode,
  onSave,
  isSaving,
  hasUnsavedChanges,
  isEditMode = false,
  topologyName = "",
  onTopologyNameChange,
  onUndo,
  onRedo,
  clientOptional = null,
  clientRequired = false,
  onExportPdf,
  isExporting = false,
  exportImageBounds,
  exportDevices = [],
  isLocked = false,
  onToggleLock,
  lastSavedAt = null,
  onEditProjectDefaults,
}: LeafletToolbarProps) {
  const { t } = useTranslation()
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [clients, setClients] = useState<User[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const clientDropdownRef = useRef<HTMLDivElement>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(topologyName)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [, setTick] = useState(0)

  // Re-render every 30s so the "Saved X ago" label stays fresh
  useEffect(() => {
    if (!lastSavedAt) return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [lastSavedAt])

  const formatSavedAt = useCallback((date: Date) => {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return t("editor.savedJustNow")
    if (diffMin < 60) return t("editor.savedMinAgo", { count: diffMin })
    return t("editor.savedAt", { time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
  }, [t])

  useEffect(() => {
    setEditedName(topologyName)
  }, [topologyName])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Debounced name change handler
  const handleNameChange = (value: string) => {
    setEditedName(value)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer for 3 seconds
    debounceTimerRef.current = setTimeout(() => {
      onTopologyNameChange?.(value)
    }, 3000)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleClient = (username: string) => {
    if (clientUsernames.includes(username)) {
      onClientChange(clientUsernames.filter((u) => u !== username))
    } else {
      onClientChange([...clientUsernames, username])
    }
  }

  useEffect(() => {
    // Wait until the parent has resolved whether client selection is optional
    if (clientOptional === null) return
    if (clientOptional === true) {
      setIsLoadingClients(false)
      return
    }
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true)
        const data = await getClients()
        setClients(data)
      } catch {
        toast.error(t("editor.loadClientsFailed"))
      } finally {
        setIsLoadingClients(false)
      }
    }
    fetchClients()
  }, [clientOptional])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (clientRequired && clientUsernames.length === 0) {
      toast.error(t("editor.selectClientFirst"))
      return
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("editor.invalidFileType"), { description: t("editor.invalidFileTypeDesc") })
      return
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(t("editor.fileTooLarge"), { description: t("editor.fileTooLargeDesc") })
      return
    }

    setIsUploading(true)
    try {
      const result = await uploadBlueprintPicture(file, clientUsernames[0] ?? "")
      toast.success(t("editor.blueprintUploaded"))
      onBlueprintUploaded(result.blueprintPictureUrl)
    } catch (error) {
      toast.error(t("editor.uploadFailed"), {
        description: error instanceof Error ? error.message : t("editor.unknownError"),
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="bg-card border-b border-border p-3 flex flex-wrap items-center gap-3 overflow-x-auto">
      {/* Client Selector — hidden when client is optional (TECH users) */}
      {!clientOptional && (
        <>
          <div className="flex items-center gap-2 shrink-0" ref={clientDropdownRef}>
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="relative">
              <button
                type="button"
                disabled={isLoadingClients}
                onClick={() => setIsClientDropdownOpen((v) => !v)}
                className="flex items-center gap-1 bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px] disabled:opacity-50"
              >
                <span className="flex-1 text-left truncate">
                  {isLoadingClients
                    ? t("editor.loading")
                    : clientUsernames.length === 0
                      ? t("editor.selectClients")
                      : clientUsernames.length === 1
                        ? (clients.find((c) => c.username === clientUsernames[0])
                            ? `${clients.find((c) => c.username === clientUsernames[0])!.username}`
                            : clientUsernames[0])
                        : t("editor.clientsCount", { count: clientUsernames.length })}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </button>

              {isClientDropdownOpen && !isLoadingClients && (
                <div className="fixed mt-1 z-9999 bg-popover border border-border rounded shadow-lg min-w-[200px] max-h-60 overflow-y-auto custom-scrollbar"
                  style={{
                    top: clientDropdownRef.current
                      ? clientDropdownRef.current.getBoundingClientRect().bottom + 4
                      : 0,
                    left: clientDropdownRef.current
                      ? clientDropdownRef.current.getBoundingClientRect().left
                      : 0,
                  }}
                >
                  {clients.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{t("editor.noClientsFound")}</div>
                  ) : (
                    clients.map((client) => {
                      const checked = clientUsernames.includes(client.username)
                      return (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => toggleClient(client.username)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                        >
                          <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-primary border-primary" : "border-border"}`}>
                            {checked && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <span className="truncate">
                            {client.username}
                            {client.firstName || client.lastName
                              ? ` (${[client.firstName, client.lastName].filter(Boolean).join(" ")})`
                              : ""}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="w-px h-6 bg-border shrink-0" />
        </>
      )}

      {/* Topology Name */}
      <div className="flex items-center gap-2 shrink-0">
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editedName}
            onChange={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                // Apply immediately on Enter/Escape
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current)
                }
                onTopologyNameChange?.(editedName)
                setIsEditingName(false)
              }
            }}
            onBlur={() => {
              // Apply immediately on blur
              if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
              }
              onTopologyNameChange?.(editedName)
              setIsEditingName(false)
            }}
            placeholder={t("editor.topologyNamePlaceholder")}
            className="bg-secondary text-foreground text-sm rounded px-2 py-1.5 border border-border focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="flex items-center gap-1 px-2 py-1.5 bg-secondary hover:bg-accent text-foreground text-sm rounded transition-colors"
            title={t("editor.editTopologyName")}
          >
            <span className="max-w-[150px] truncate">
              {topologyName || t("editor.untitledTopology")}
            </span>
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Blueprint Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {blueprintUrl ? (
        <button
          onClick={onBlueprintRemove}
          disabled={isUploading}
          className="flex items-center gap-1 px-3 py-1.5 bg-destructive hover:bg-destructive/80 text-primary-foreground text-sm rounded transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
          {t("editor.remove")}
        </button>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || (clientRequired && clientUsernames.length === 0)}
          className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-accent text-foreground text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isUploading ? t("editor.uploading") : t("editor.upload")}
        </button>
      )}

      {/* Import from PDF */}
      {!blueprintUrl && (
        <button
          onClick={() => {
            const params = new URLSearchParams()
            if (clientUsernames.length > 0) params.set("client", clientUsernames[0])
            navigate(`/topology/import-pdf?${params.toString()}`)
          }}
          disabled={isUploading || (clientRequired && clientUsernames.length === 0)}
          className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-accent text-foreground text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title={t("editor.importBlueprintFromPdf")}
        >
          <FileImage className="h-4 w-4" />
          {t("editor.importPdf")}
        </button>
      )}

      <div className="w-px h-6 bg-border shrink-0" />

      {/* Connection Mode */}
      <button
        onClick={onToggleConnectionMode}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors shrink-0 ${
          connectionMode
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-secondary hover:bg-accent text-foreground"
        }`}
      >
        <Link className="h-4 w-4" />
        {connectionMode ? t("editor.exitConnect") : t("editor.connect")}
      </button>

      {/* Undo / Redo */}
      <div className="w-px h-6 bg-border shrink-0" />
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onUndo}
          className="p-1.5 bg-secondary hover:bg-accent text-foreground rounded transition-colors"
          title={t("editor.undo")}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          className="p-1.5 bg-secondary hover:bg-accent text-foreground rounded transition-colors"
          title={t("editor.redo")}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* Lock / Unlock */}
      {onToggleLock && (
        <>
          <div className="w-px h-6 bg-border shrink-0" />
          <button
            onClick={onToggleLock}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors shrink-0 ${
              isLocked
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-secondary hover:bg-accent text-foreground"
            }`}
            title={isLocked ? t("editor.unlockComponents") : t("editor.lockComponents")}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {isLocked ? t("editor.locked") : t("editor.lock")}
          </button>
        </>
      )}

      {/* Project naming/IP defaults */}
      {onEditProjectDefaults && (
        <>
          <div className="w-px h-6 bg-border shrink-0" />
          <button
            onClick={onEditProjectDefaults}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0"
            title={t("projectDefaults.toolbarButton")}
          >
            <Settings2 className="h-4 w-4" />
            {t("projectDefaults.toolbarButton")}
          </button>
        </>
      )}

      <div className="flex-1 min-w-0" />

      {/* Export PDF */}
      {onExportPdf && (
        <>
          <button
            onClick={() => setIsExportDialogOpen(true)}
            disabled={isExporting}
            className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {t("editor.exportPdf")}
          </button>
          <PdfExportDialog
            open={isExportDialogOpen}
            onOpenChange={setIsExportDialogOpen}
            onExport={(options) => {
              setIsExportDialogOpen(false)
              onExportPdf(options)
            }}
            isExporting={isExporting}
            blueprintUrl={blueprintUrl}
            imageBounds={exportImageBounds ?? [[0, 0], [1000, 1000]]}
            devices={exportDevices}
          />
        </>
      )}

      {/* Auto-save status */}
      {lastSavedAt && !isSaving && (
        <span className="text-xs text-muted-foreground shrink-0">
          {formatSavedAt(lastSavedAt)}
        </span>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={isSaving || !blueprintUrl}
        className={`flex items-center gap-1 px-4 py-1.5 text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
          hasUnsavedChanges
            ? "bg-primary text-primary-foreground hover:bg-primary/80"
            : "bg-secondary hover:bg-accent text-foreground"
        }`}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {isSaving ? (isEditMode ? t("editor.updating") : t("editor.saving")) : (isEditMode ? t("editor.update") : t("editor.save"))}
      </button>
    </div>
  )
}
