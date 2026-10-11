import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getSessionToken } from "~/functions/get_session_token"
import { Activity, RefreshCw } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Progress } from "~/components/ui/progress"

type ServerMetrics = {
  heapUsedBytes: number | null
  heapMaxBytes: number | null
  systemCpuUsage: number | null
  processCpuUsage: number | null
  processUptimeSeconds: number | null
  diskFreeBytes: number | null
  diskTotalBytes: number | null
  liveThreads: number | null
  httpRequestCount: number | null
  ramTotalBytes: number | null
  ramUsedBytes: number | null
}

async function fetchMetricsApi(): Promise<ServerMetrics> {
  const token = getSessionToken()
  const res = await fetch("/api/admin/metrics", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes < 0) return "—"
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatCpu(value: number | null): string {
  if (value === null) return "—"
  return `${(value * 100).toFixed(1)}%`
}

function formatUptime(seconds: number | null): string {
  if (seconds === null) return "—"
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m ${sec}s`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function pct(used: number | null, max: number | null): number {
  if (!used || !max || max <= 0) return 0
  return Math.min(100, Math.round((used / max) * 100))
}

export default function ServerMetricsPage() {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  async function load() {
    try {
      const data = await fetchMetricsApi()
      setMetrics(data)
      setLastUpdated(new Date())
      setError(null)
    } catch {
      setError(t("serverMetrics.fetchFailed"))
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  const heapPct = pct(metrics?.heapUsedBytes ?? null, metrics?.heapMaxBytes ?? null)
  const diskUsed =
    metrics?.diskTotalBytes != null && metrics?.diskFreeBytes != null
      ? metrics.diskTotalBytes - metrics.diskFreeBytes
      : null
  const diskPct = pct(diskUsed, metrics?.diskTotalBytes ?? null)
  const ramPct = pct(metrics?.ramUsedBytes ?? null, metrics?.ramTotalBytes ?? null)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">{t("serverMetrics.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("serverMetrics.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live pulse */}
          {!error && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              {lastUpdated ? lastUpdated.toLocaleTimeString() : t("serverMetrics.connecting")}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("serverMetrics.refresh")}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard label={t("serverMetrics.heapUsed")} value={formatBytes(metrics?.heapUsedBytes ?? null)} />
        <MetricCard label={t("serverMetrics.heapMax")} value={formatBytes(metrics?.heapMaxBytes ?? null)} />
        <MetricCard
          label={t("serverMetrics.systemCpu")}
          value={formatCpu(metrics?.systemCpuUsage ?? null)}
          highlight={
            metrics?.systemCpuUsage != null && metrics.systemCpuUsage > 0.8
          }
        />
        <MetricCard
          label={t("serverMetrics.appCpu")}
          value={formatCpu(metrics?.processCpuUsage ?? null)}
          highlight={
            metrics?.processCpuUsage != null && metrics.processCpuUsage > 0.5
          }
        />
        <MetricCard label={t("serverMetrics.uptime")} value={formatUptime(metrics?.processUptimeSeconds ?? null)} />
        <MetricCard
          label={t("serverMetrics.liveThreads")}
          value={metrics?.liveThreads != null ? String(metrics.liveThreads) : "—"}
        />
        <MetricCard
          label={t("serverMetrics.httpRequests")}
          value={
            metrics?.httpRequestCount != null
              ? metrics.httpRequestCount.toLocaleString()
              : "—"
          }
        />
        <MetricCard label={t("serverMetrics.diskFree")} value={formatBytes(metrics?.diskFreeBytes ?? null)} />
        <MetricCard label={t("serverMetrics.ramUsed")} value={formatBytes(metrics?.ramUsedBytes ?? null)} />
        <MetricCard label={t("serverMetrics.ramTotal")} value={formatBytes(metrics?.ramTotalBytes ?? null)} />
      </div>

      {/* RAM usage bar — only shown on Linux/Docker where /proc/meminfo is available */}
      {metrics?.ramTotalBytes != null ? (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {t("serverMetrics.systemRamUsage")}
          </h2>
          <Progress value={ramPct} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("serverMetrics.used", { value: formatBytes(metrics.ramUsedBytes) })}</span>
            <span>{ramPct}%</span>
            <span>{t("serverMetrics.total", { value: formatBytes(metrics.ramTotalBytes) })}</span>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">
            {t("serverMetrics.systemRamUsage")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("serverMetrics.ramNotAvailable")}
          </p>
        </div>
      )}

      {/* Heap memory bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("serverMetrics.heapMemoryUsage")}
        </h2>
        <Progress value={heapPct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("serverMetrics.used", { value: formatBytes(metrics?.heapUsedBytes ?? null) })}</span>
          <span>{heapPct}%</span>
          <span>{t("serverMetrics.max", { value: formatBytes(metrics?.heapMaxBytes ?? null) })}</span>
        </div>
      </div>

      {/* Disk usage bar */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("serverMetrics.diskUsage")}
        </h2>
        <Progress value={diskPct} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("serverMetrics.used", { value: formatBytes(diskUsed) })}</span>
          <span>{diskPct}%</span>
          <span>{t("serverMetrics.total", { value: formatBytes(metrics?.diskTotalBytes ?? null) })}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("serverMetrics.free", { value: formatBytes(metrics?.diskFreeBytes ?? null) })}
        </p>
      </div>
    </div>
  )
}

function MetricCard({
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
