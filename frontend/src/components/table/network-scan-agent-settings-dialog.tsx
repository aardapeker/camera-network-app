import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  getAgentSettings,
  saveAgentSettings,
  type ScanAgentSettings,
} from "~/functions/get_network_scan_agent_settings";

// Matches the Pi's actual scan floor - a write interval below this is
// meaningless since the Pi itself won't report more often than this anyway.
const MIN_WRITE_INTERVAL_SECONDS = 60;

interface NetworkScanAgentSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: string[];
}

export function NetworkScanAgentSettingsDialog({
  open,
  onOpenChange,
  sources,
}: NetworkScanAgentSettingsDialogProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<Record<string, ScanAgentSettings>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings whenever the dialog opens
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    getAgentSettings()
      .then((settings) => {
        const bySource = Object.fromEntries(settings.map((s) => [s.sourceId, s]));
        // Ensure every known source has a row, even if it has no explicit settings yet
        for (const sourceId of sources) {
          if (!bySource[sourceId]) {
            bySource[sourceId] = {
              sourceId,
              retentionDays: 30,
              minWriteIntervalSeconds: 60,
              retentionIsDefault: true,
              intervalIsDefault: true,
            };
          }
        }
        setRows(bySource);
      })
      .catch((error) => {
        toast.error(t("networkScan.settingsLoadFailed"), {
          description: error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => setIsLoading(false));
  }, [open, sources]);

  const updateRow = (sourceId: string, patch: Partial<ScanAgentSettings>) => {
    setRows((prev) => ({ ...prev, [sourceId]: { ...prev[sourceId], ...patch } }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        Object.values(rows).map((row) =>
          saveAgentSettings(row.sourceId, row.retentionDays, row.minWriteIntervalSeconds),
        ),
      );
      toast.success(t("networkScan.settingsSaved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(t("networkScan.settingsSaveFailed"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("networkScan.manageAgentSettings")}</DialogTitle>
          <DialogDescription>{t("networkScan.manageAgentSettingsDesc")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("networkScan.colSource")}</TableHead>
                  <TableHead>{t("networkScan.colRetentionDays")}</TableHead>
                  <TableHead>{t("networkScan.colWriteInterval")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(rows).map((row) => (
                  <TableRow key={row.sourceId}>
                    <TableCell className="font-medium">{row.sourceId}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        value={row.retentionDays}
                        onChange={(e) =>
                          updateRow(row.sourceId, { retentionDays: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={MIN_WRITE_INTERVAL_SECONDS}
                        value={row.minWriteIntervalSeconds}
                        onChange={(e) =>
                          updateRow(row.sourceId, {
                            minWriteIntervalSeconds: parseInt(e.target.value, 10) || MIN_WRITE_INTERVAL_SECONDS,
                          })
                        }
                        onBlur={() =>
                          updateRow(row.sourceId, {
                            minWriteIntervalSeconds: Math.max(MIN_WRITE_INTERVAL_SECONDS, row.minWriteIntervalSeconds),
                          })
                        }
                        className="w-24"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t("networkScan.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("networkScan.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
