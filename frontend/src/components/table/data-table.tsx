import { UserRole, type PaginationData, type User } from "~/types";

import { useEffect, useState } from "react";

import type { ColumnDef, VisibilityState } from "@tanstack/react-table";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import DataTableFilter from "./data-table-filter";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "~/hooks/use-mobile";
import { useIsDesktop } from "~/hooks/use-desktop";

interface DataTableProps<TValue> {
  columns: ColumnDef<User, TValue>[];
  paginationData: PaginationData;
  users: User[];
}

export function DataTable<TValue>({
  columns,
  users,
  paginationData,
}: DataTableProps<TValue>) {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Update column visibility based on screen size changes
  useEffect(() => {
    if (isMobile) {
      // Mobile screens (< 768px) - hide Avatar → Signup Date → Status → Email
      setColumnVisibility({
        avatar: false,
        createdAt: false,
        status: false,
        email: false,
      });
    } else if (!isDesktop) {
      // Tablet screens (768px - 1200px) - hide Avatar → Signup Date → Status
      setColumnVisibility({
        avatar: false,
        createdAt: false,
        status: false,
        email: true,
      });
    } else {
      // Desktop screens (> 1200px) - show all columns
      setColumnVisibility({
        avatar: true,
        createdAt: true,
        status: true,
        email: true,
      });
    }
  }, [isMobile, isDesktop]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="mx-3">
      <DataTableFilter table={table} />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {cell.column.id === "select" &&
                      row.original.authorities.includes(UserRole.ADMIN)
                        ? null
                        : flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                      {/*{flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}*/}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex-1 text-sm text-muted-foreground items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} paginationData={paginationData} />
      </div>
    </div>
  );
}
