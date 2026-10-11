import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { NetworkScanHost } from "~/types";
import { DataTableColumnHeader } from "./data-table-column-header";
import { toTzDate } from "~/lib/timezone";
import i18n from "~/lib/i18n";

export function getNetworkScanColumns(timezone: string): ColumnDef<NetworkScanHost>[] {
  return [
  {
    accessorKey: "scannedAt",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        titleKey="networkScan.colScannedAt"
        defaultSortBy="scannedAt"
        defaultSortDirection="DESC"
        preserveParams={["sources"]}
      />
    ),
    cell: ({ row }) => (
      <span className="font-medium whitespace-nowrap">
        {format(toTzDate(row.original.scannedAt, timezone), "dd.MM.yyyy HH:mm:ss")}
      </span>
    ),
  },
  {
    accessorKey: "ip",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        titleKey="networkScan.colIp"
        defaultSortBy="scannedAt"
        defaultSortDirection="DESC"
        preserveParams={["sources"]}
      />
    ),
    cell: ({ row }) => <span className="font-medium">{row.original.ip}</span>,
  },
  {
    accessorKey: "mac",
    header: () => i18n.t("networkScan.colMac"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.mac || "—"}</span>
    ),
  },
  {
    accessorKey: "vendor",
    header: () => i18n.t("networkScan.colVendor"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.vendor || "—"}</span>
    ),
  },
  {
    accessorKey: "hostname",
    header: () => i18n.t("networkScan.colHostname"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.hostname || "—"}</span>
    ),
  },
  {
    accessorKey: "openPorts",
    header: () => i18n.t("networkScan.colPorts"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.openPorts || "—"}</span>
    ),
  },
  {
    accessorKey: "sourceId",
    header: () => i18n.t("networkScan.colSource"),
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.sourceId}</span>
    ),
  },
  ];
}
