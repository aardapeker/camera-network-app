import { useLoaderData, useRevalidator, useNavigate } from "react-router"
import { useState } from "react"
import { useTranslation, Trans } from "react-i18next"
import { getSessionToken } from "~/functions/get_session_token"
import { BackupHealthCharts } from "~/components/analytics/backup-health-charts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { AlertCircle, DatabaseBackup, RefreshCw, RotateCcw } from "lucide-react"

type BackupLog = {
  id: string | null
  type: "AUTO" | "MANUAL" | "RESTORE"
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "SKIPPED"
  timestamp: string
  dbSize: string | null
  imagesUploaded: number | null
  backupKey: string | null
  details: string | null
}

async function fetchWithAuth(path: string, options?: RequestInit) {
  const token = getSessionToken()
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })
}

export async function clientLoader() {
  const [logsRes, healthRes] = await Promise.all([
    fetchWithAuth("/api/admin/backup/logs"),
    fetchWithAuth("/api/admin/backup/health"),
  ])

  const logs: BackupLog[] = logsRes.ok ? await logsRes.json() : []
  const health: { healthy: boolean } = healthRes.ok
    ? await healthRes.json()
    : { healthy: false }

  return { logs, s3Healthy: health.healthy }
}

clientLoader.hydrate = true as const

export default function BackupPage() {
  const { logs, s3Healthy } = useLoaderData<typeof clientLoader>()
  const { revalidate } = useRevalidator()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<BackupLog | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  function handleUnauthorized(res: Response) {
    if (res.status === 401 || res.status === 403) {
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      navigate("/signin")
      return true
    }
    return false
  }

  async function handleManualBackup() {
    setBackupLoading(true)
    try {
      const res = await fetchWithAuth("/api/admin/backup/create", { method: "POST" })
      if (handleUnauthorized(res)) return
      revalidate()
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleRestore() {
    if (!restoreTarget || !restoreTarget.backupKey) return
    setRestoreLoading(true)
    try {
      const res = await fetchWithAuth("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: restoreTarget.backupKey,
      })
      if (handleUnauthorized(res)) return
      // Restore wipes the DB (and all sessions) — always redirect to sign in
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      navigate("/signin")
    } finally {
      setRestoreLoading(false)
      setRestoreTarget(null)
    }
  }

  function formatTimestamp(ts: string) {
    // Backend sends LocalDateTime without timezone — treat as UTC
    const date = new Date(ts.endsWith("Z") ? ts : ts + "Z")
    return date.toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatDetails(log: BackupLog) {
    if (log.type === "RESTORE") return log.details ?? "-"
    if (log.status === "FAILED" || log.status === "SKIPPED") return log.details ?? "-"
    const parts: string[] = []
    if (log.dbSize) parts.push(t("backup.detailsDb", { size: log.dbSize }))
    if (log.imagesUploaded !== null) {
      const imgValue = log.imagesUploaded === 0
        ? t("backup.detailsNoChanges")
        : t("backup.detailsFiles", { count: log.imagesUploaded })
      parts.push(t("backup.detailsImages", { value: imgValue }))
    }
    return parts.length > 0 ? parts.join(" · ") : (log.details ?? "-")
  }

  function statusBadge(status: BackupLog["status"]) {
    switch (status) {
      case "SUCCESS":
        return <Badge variant="default" className="bg-green-600 hover:bg-green-600">{t("backup.statusSuccess")}</Badge>
      case "FAILED":
        return <Badge variant="destructive">{t("backup.statusFailed")}</Badge>
      case "IN_PROGRESS":
        return <Badge variant="secondary">{t("backup.statusInProgress")}</Badge>
      case "SKIPPED":
        return <Badge variant="outline">{t("backup.statusSkipped")}</Badge>
    }
  }

  function typeBadge(log: BackupLog) {
    switch (log.type) {
      case "AUTO":
        return <Badge variant="outline">{t("backup.typeAuto")}</Badge>
      case "MANUAL":
        return <Badge variant="secondary">{t("backup.typeManual")}</Badge>
      case "RESTORE":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">{t("backup.typeRestore")}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("backup.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("backup.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualBackup}
            disabled={backupLoading || !s3Healthy}
          >
            <DatabaseBackup className="mr-2 h-4 w-4" />
            {backupLoading ? t("backup.backingUp") : t("backup.manualBackup")}
          </Button>
        </div>
      </div>

      {/* S3 warning banner */}
      {!s3Healthy && (
        <div className="flex items-center gap-3 rounded-md border border-yellow-500 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            <Trans i18nKey="backup.s3Warning" components={[<code className="font-mono" />]} />
          </span>
        </div>
      )}

      {/* Backup charts */}
      {logs.length > 0 && <BackupHealthCharts logs={logs} />}

      {/* Backup log table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("backup.colTimestamp")}</TableHead>
              <TableHead>{t("backup.colType")}</TableHead>
              <TableHead>{t("backup.colStatus")}</TableHead>
              <TableHead>{t("backup.colDetails")}</TableHead>
              <TableHead className="text-right">{t("backup.colAction")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("backup.noBackups")}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(log.timestamp)}
                  </TableCell>
                  <TableCell>{typeBadge(log)}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-sm truncate">
                    {formatDetails(log)}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.status === "SUCCESS" && log.type !== "RESTORE" && log.backupKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!s3Healthy || restoreLoading}
                        onClick={() => setRestoreTarget(log)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {t("backup.restore")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Restore confirmation dialog */}
      <AlertDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => { if (!open) setRestoreTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("backup.restoreDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <Trans i18nKey="backup.restoreDialogLine1" components={[<strong />]} />
              </span>
              <span className="block font-mono text-sm">
                {restoreTarget ? formatTimestamp(restoreTarget.timestamp) : ""}
              </span>
              <span className="block mt-2 text-yellow-600">
                {t("backup.restoreDialogWarning")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreLoading}>{t("backup.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {restoreLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {t("backup.restoring")}
                </>
              ) : (
                t("backup.yesRestore")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
