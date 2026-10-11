import { useMemo, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { DataTablePagination } from "./data-table-pagination";
import NetworkScanFilter from "./network-scan-filter";
import { getNetworkScanColumns } from "./network-scan-columns";
import { TIMEZONES, DEFAULT_TIMEZONE } from "~/lib/timezone";
import { useTranslation } from "react-i18next";
import type { NetworkScanHost, PaginationData } from "~/types";

interface NetworkScanTableProps {
  hosts: NetworkScanHost[];
  paginationData: PaginationData;
  sources: string[];
}

export function NetworkScanTable({ hosts, paginationData, sources }: NetworkScanTableProps) {
  const { t } = useTranslation();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const columns = useMemo(() => getNetworkScanColumns(timezone), [timezone]);

  const table = useReactTable({
    data: hosts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: { columnVisibility },
  });

  return (
    <div className="mx-3">
      <div className="flex items-center justify-end gap-2 pt-2">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t("networkScan.timezone")}</span>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger className="w-[220px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="custom-scrollbar">
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value} className="text-xs">
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <NetworkScanFilter table={table} sources={sources} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex-1 text-sm text-muted-foreground items-center justify-end space-x-2 py-4">
        <DataTablePagination
          table={table}
          paginationData={paginationData}
          defaultSize="25"
          defaultSortBy="scannedAt"
          defaultSortDirection="DESC"
          preserveParams={["sources"]}
        />
      </div>
    </div>
  );
}
