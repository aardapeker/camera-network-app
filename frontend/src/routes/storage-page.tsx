import { useLoaderData, useRevalidator } from "react-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { getSessionToken } from "~/functions/get_session_token"
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
import { Badge } from "~/components/ui/badge"
import { toast } from "sonner"
import {
  HardDrive,
  Trash2,
  RefreshCw,
  ImageOff,
  ExternalLink,
  CheckSquare,
  Square,
  FolderOpen,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { CHART_COLORS } from "~/constants/colors"

type StorageStats = {
  blueprintCount: number
  blueprintsTotalBytes: number
  orphanedCount: number
  orphanedTotalBytes: number
}

type BlueprintFileInfo = {
  relativePath: string
  serveUrl: string
  sizeBytes: number
  orphaned: boolean
  topologyId: string | null
  topologyName: string | null
  clientUsername: string | null
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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
  const [statsRes, blueprintsRes] = await Promise.all([
    fetchWithAuth("/api/admin/storage/stats"),
    fetchWithAuth("/api/admin/storage/blueprints"),
  ])

  const stats: StorageStats = statsRes.ok
    ? await statsRes.json()
    : {
        blueprintCount: 0,
        blueprintsTotalBytes: 0,
        orphanedCount: 0,
        orphanedTotalBytes: 0,
      }

  const blueprints: BlueprintFileInfo[] = blueprintsRes.ok
    ? await blueprintsRes.json()
    : []

  return { stats, blueprints }
}


export default function StoragePage() {
  const { stats, blueprints } = useLoaderData() as {
    stats: StorageStats
    blueprints: BlueprintFileInfo[]
  }
  const { revalidate } = useRevalidator()
  const { t } = useTranslation()

  const [filter, setFilter] = useState<"all" | "orphaned" | "linked">("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeleteSelected, setShowDeleteSelected] = useState(false)
  const [showDeleteOrphaned, setShowDeleteOrphaned] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = blueprints.filter((b) => {
    if (filter === "orphaned") return b.orphaned
    if (filter === "linked") return !b.orphaned
    return true
  })

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((b) => b.relativePath)))
    }
  }

  async function handleDeleteSelected() {
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth("/api/admin/storage/blueprints", {
        method: "DELETE",
        body: JSON.stringify([...selected]),
      })
      if (!res.ok) throw new Error("Delete failed")
      toast.success(t("storage.deletedFiles", { count: selected.size }))
      setSelected(new Set())
      revalidate()
    } catch {
      toast.error(t("storage.deleteFilesFailed"))
    } finally {
      setIsDeleting(false)
      setShowDeleteSelected(false)
    }
  }

  async function handleDeleteOrphaned() {
    setIsDeleting(true)
    try {
      const res = await fetchWithAuth("/api/admin/storage/orphaned", {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      toast.success(t("storage.deletedOrphaned", { count: stats.orphanedCount }))
      setSelected(new Set())
      revalidate()
    } catch {
      toast.error(t("storage.deleteOrphanedFailed"))
    } finally {
      setIsDeleting(false)
      setShowDeleteOrphaned(false)
    }
  }

  // Chart data
  const linkedBytes = blueprints
    .filter((b) => !b.orphaned)
    .reduce((s, b) => s + b.sizeBytes, 0)
  const sizePieData = [
    { name: t("storage.linked"), value: linkedBytes },
    { name: t("storage.orphaned"), value: stats.orphanedTotalBytes },
  ]
  const sizePieColors = [CHART_COLORS[0], CHART_COLORS[1]]

  const blueprintBarData = [
    { name: t("storage.linked"), value: blueprints.filter((b) => !b.orphaned).length },
    { name: t("storage.orphaned"), value: stats.orphanedCount },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{t("storage.title")}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => revalidate()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {t("storage.refresh")}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label={t("storage.blueprintFiles")} value={String(stats.blueprintCount)} />
        <StatCard label={t("storage.blueprintsSize")} value={formatBytes(stats.blueprintsTotalBytes)} />
        <StatCard
          label={t("storage.orphaned")}
          value={`${stats.orphanedCount} (${formatBytes(stats.orphanedTotalBytes)})`}
          highlight={stats.orphanedCount > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blueprint size breakdown pie */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3 text-muted-foreground">
            {t("storage.sizeBreakdown")}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sizePieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                labelLine={false}
                strokeWidth={0}
              >
                {sizePieData.map((_: unknown, i: number) => (
                  <Cell key={i} fill={sizePieColors[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatBytes(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {sizePieData.map((d: { name: string; value: number }, i: number) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: sizePieColors[i] }}
                />
                <span className="text-muted-foreground">
                  {d.name}: {formatBytes(d.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blueprint count bar */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium mb-3 text-muted-foreground">
            {t("storage.blueprintFiles")}
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={blueprintBarData} barSize={48}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--card-foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey="value" name="Files">
                {blueprintBarData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={CHART_COLORS[i]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", "linked", "orphaned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-accent text-foreground"
              }`}
            >
              {t(`storage.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              {f === "all" && ` (${blueprints.length})`}
              {f === "orphaned" && ` (${stats.orphanedCount})`}
              {f === "linked" &&
                ` (${blueprints.length - stats.orphanedCount})`}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {stats.orphanedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteOrphaned(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("storage.deleteAllOrphaned", { count: stats.orphanedCount })}
          </Button>
        )}
        {selected.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteSelected(true)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("storage.deleteSelected", { count: selected.size })}
          </Button>
        )}
      </div>

      {/* Blueprint grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <ImageOff className="h-10 w-10" />
          <p>{t("storage.noFiles")}</p>
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {selected.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {t("storage.selectAll")}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((b) => {
              const isSelected = selected.has(b.relativePath)
              return (
                <div
                  key={b.relativePath}
                  onClick={() => toggleSelect(b.relativePath)}
                  className={`relative cursor-pointer rounded-lg border overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary"
                      : "border-border hover:border-muted-foreground"
                  } bg-card`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    <img
                      src={b.serveUrl}
                      alt={b.relativePath}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Selection checkbox overlay */}
                  <div className="absolute top-1.5 left-1.5">
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-primary drop-shadow" />
                    ) : (
                      <Square className="h-5 w-5 text-white drop-shadow" />
                    )}
                  </div>

                  {/* Orphan badge */}
                  {b.orphaned && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        {t("storage.orphanBadge")}
                      </Badge>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-2 space-y-0.5">
                    <p
                      className="text-xs font-medium truncate"
                      title={b.relativePath}
                    >
                      {b.relativePath.split("/").pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(b.sizeBytes)}
                    </p>
                    {b.topologyName && (
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={b.topologyName}
                      >
                        {b.topologyName}
                      </p>
                    )}
                    {b.clientUsername && (
                      <p className="text-xs text-muted-foreground truncate">
                        {b.clientUsername}
                      </p>
                    )}
                    {!b.orphaned && b.topologyId && (
                      <a
                        href={`/topology-editor/${b.topologyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("storage.openTopology")}
                      </a>
                    )}
                    {b.orphaned && (
                      <a
                        href={`/topology-editor?blueprint=${encodeURIComponent(b.serveUrl)}${b.clientUsername ? `&client=${encodeURIComponent(b.clientUsername)}` : ""}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                      >
                        <FolderOpen className="h-3 w-3" />
                        {t("storage.openInEditor")}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Delete selected dialog */}
      <AlertDialog open={showDeleteSelected} onOpenChange={setShowDeleteSelected}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("storage.deleteSelectedTitle", { count: selected.size })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("storage.deleteSelectedDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-primary-foreground hover:bg-destructive/80"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete orphaned dialog */}
      <AlertDialog
        open={showDeleteOrphaned}
        onOpenChange={setShowDeleteOrphaned}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("storage.deleteOrphanedTitle", { count: stats.orphanedCount })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("storage.deleteOrphanedDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrphaned}
              className="bg-destructive text-primary-foreground hover:bg-destructive/80"
            >
              {t("storage.deleteAllOrphanedShort")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-xl font-semibold mt-1 ${highlight ? "text-destructive" : ""}`}
      >
        {value}
      </p>
    </div>
  )
}
