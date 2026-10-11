import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DeviceType } from "~/components/icons";
import { useTypeLabels } from "~/hooks/use-type-labels";
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
import {
  deviceTypeHasIp,
  type DeviceProjectDefaults,
  type DeviceTypePrefixes,
  type ProjectDeviceDefaultsMap,
} from "~/lib/device-defaults";

const DEVICE_TYPES = Object.values(DeviceType);

interface ProjectDefaultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProjectDeviceDefaultsMap;
  settingsPrefixes: DeviceTypePrefixes;
  onSave: (next: ProjectDeviceDefaultsMap) => void;
}

export function ProjectDefaultsDialog({
  open,
  onOpenChange,
  value,
  settingsPrefixes,
  onSave,
}: ProjectDefaultsDialogProps) {
  const { t } = useTranslation();
  const { deviceLabels } = useTypeLabels();
  const [rows, setRows] = useState<ProjectDeviceDefaultsMap>(value);

  // Re-sync from the current project state whenever the dialog opens
  useEffect(() => {
    if (open) setRows(value);
  }, [open, value]);

  const updateRow = (type: DeviceType, patch: Partial<DeviceProjectDefaults>) => {
    setRows((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  };

  const handleSave = () => {
    // Only persist a prefix override when it actually differs from the current Settings default,
    // so a project keeps following Settings if that default is changed later.
    const resolved = {} as ProjectDeviceDefaultsMap;
    for (const type of DEVICE_TYPES) {
      const row = rows[type];
      const isSettingsDefault = (row.prefix ?? "") === (settingsPrefixes[type] ?? "");
      resolved[type] = { ...row, prefix: isSettingsDefault ? null : row.prefix };
    }
    onSave(resolved);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("projectDefaults.title")}</DialogTitle>
          <DialogDescription>{t("projectDefaults.description")}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("projectDefaults.deviceType")}</TableHead>
                <TableHead>{t("projectDefaults.prefix")}</TableHead>
                <TableHead>{t("projectDefaults.startNumber")}</TableHead>
                <TableHead>{t("projectDefaults.startIp")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEVICE_TYPES.map((type) => {
                const row = rows[type];
                return (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{deviceLabels[type]}</TableCell>
                    <TableCell>
                      <Input
                        value={row?.prefix ?? ""}
                        onChange={(e) => updateRow(type, { prefix: e.target.value })}
                        placeholder={settingsPrefixes[type]}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={row?.startNumber ?? 1}
                        onChange={(e) =>
                          updateRow(type, { startNumber: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      {deviceTypeHasIp(type) ? (
                        <Input
                          value={row?.startIp ?? ""}
                          onChange={(e) => updateRow(type, { startIp: e.target.value })}
                          className="w-36"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {t("projectDefaults.noIp")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("projectDefaults.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("projectDefaults.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
