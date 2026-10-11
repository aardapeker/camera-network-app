import type { Column } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  BrushCleaningIcon,
  ChevronsUpDown,
  EyeOff,
} from "lucide-react";

import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  /** i18n key for the column title */
  titleKey: string;
  /** Backend default sortBy field, omitted from the URL when it matches (default: "username") */
  defaultSortBy?: string;
  /** Backend default sort direction, omitted from the URL when it matches (default: "ASC") */
  defaultSortDirection?: "ASC" | "DESC";
  /** Extra URL params (besides size/filterInput/filterBy) to preserve when re-sorting, e.g. ["roles"] or ["sources"] */
  preserveParams?: string[];
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  titleKey,
  className,
  defaultSortBy = "username",
  defaultSortDirection = "ASC",
  preserveParams = ["roles"],
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useTranslation();
  const title = t(titleKey);
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  const currentSize = searchParams.get("size");
  const currentSortBy = searchParams.get("sortBy");
  const currentSortDirection = searchParams.get("sortDirection");
  const currentFilterInput = searchParams.get("filterInput");
  const currentFilterBy = searchParams.get("filterBy");

  // Sorting
  const handleSortingChange = (
    sortingArray: Array<{ id: string; desc: boolean }>,
  ) => {
    const params = new URLSearchParams();

    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    // Preserve filters
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }

    // Preserve extra filters (e.g. roles, sources)
    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) {
        params.append(key, value);
      }
    }

    // Add sorting if present
    if (sortingArray.length > 0) {
      const sort = sortingArray[0];
      const direction = sort.desc ? "DESC" : "ASC";

      if (sort.id !== defaultSortBy) {
        params.append("sortBy", sort.id);
      }

      if (direction !== defaultSortDirection) {
        params.append("sortDirection", direction);
      }
    }

    navigate(`?${params.toString()}`);
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {currentSortBy === column.id && currentSortDirection === "DESC" ? (
              <ArrowDown />
            ) : currentSortBy === column.id ? (
              <ArrowUp />
            ) : (
              <ChevronsUpDown />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              handleSortingChange([{ id: column.id, desc: false }])
            }
          >
            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
            {t("table.sortAsc")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSortingChange([{ id: column.id, desc: true }])}
          >
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            {t("table.sortDesc")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSortingChange([])}>
            <BrushCleaningIcon className="h-3.5 w-3.5 text-muted-foreground/70" />
            {t("table.clearSorting")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
            {t("table.hide")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
