import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { PaginationData } from "~/types";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  paginationData: PaginationData;
  /** Backend default page size, shown/omitted from the URL when it matches (default: "10") */
  defaultSize?: string;
  /** Backend default sortBy field, omitted from the URL when it matches (default: "username") */
  defaultSortBy?: string;
  /** Backend default sort direction, omitted from the URL when it matches (default: "ASC") */
  defaultSortDirection?: string;
  /** Extra URL params (besides size/filterInput/filterBy) to preserve, e.g. ["roles"] or ["sources"] */
  preserveParams?: string[];
}

export function DataTablePagination<TData>({
  table,
  paginationData,
  defaultSize = "10",
  defaultSortBy = "username",
  defaultSortDirection = "ASC",
  preserveParams = ["roles"],
}: DataTablePaginationProps<TData>) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const currentPage = searchParams.get("page");
  const currentSize = searchParams.get("size");
  const currentSortBy = searchParams.get("sortBy");
  const currentSortDirection = searchParams.get("sortDirection");
  const currentFilterInput = searchParams.get("filterInput");
  const currentFilterBy = searchParams.get("filterBy");

  const appendPreservedParams = (params: URLSearchParams) => {
    for (const key of preserveParams) {
      const value = searchParams.get(key);
      if (value) {
        params.append(key, value);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();

    // Add page if not 0
    if (newPage !== 0) {
      params.append("page", newPage.toString());
    }

    // Only append if different from backend defaults
    if (currentSize && currentSize !== defaultSize) {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== defaultSortBy) {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== defaultSortDirection) {
      params.append("sortDirection", currentSortDirection);
    }

    // Preserve search filters
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }

    appendPreservedParams(params);

    navigate(`?${params.toString()}`);
  };

  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams();

    // Reset to page 0 when changing size
    // (don't append page, let backend default to 0)

    if (newSize && newSize !== defaultSize) {
      params.append("size", newSize);
    }

    if (currentSortBy && currentSortBy !== defaultSortBy) {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== defaultSortDirection) {
      params.append("sortDirection", currentSortDirection);
    }

    // Preserve search filters
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }

    appendPreservedParams(params);

    navigate(`?${params.toString()}`);
  };

  // Calculate display values safely
  const pageNum = Number(currentPage) || 0;
  const sizeNum = Number(currentSize) || Number(defaultSize);
  const startItem = pageNum * sizeNum + 1;
  const endItem = Math.min((pageNum + 1) * sizeNum, paginationData.totalItems);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {t("table.showingItems", { start: startItem, end: endItem, total: paginationData.totalItems })}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{t("table.rowsPerPage")}</p>
          <Select
            value={currentSize || defaultSize}
            onValueChange={(value) => {
              handlePageSizeChange(value);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={currentSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[3, 5, 10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {t("table.pageOf", { page: pageNum + 1, total: paginationData.totalPages })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(0)}
            disabled={!paginationData.hasPrevious}
          >
            <span className="sr-only">{t("table.goToFirst")}</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(Number(currentPage) - 1)}
            disabled={!paginationData.hasPrevious}
          >
            <span className="sr-only">{t("table.goToPrevious")}</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(Number(currentPage) + 1)}
            disabled={!paginationData.hasNext}
          >
            <span className="sr-only">{t("table.goToNext")}</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(paginationData.totalPages - 1)}
            disabled={!paginationData.hasNext}
          >
            <span className="sr-only">{t("table.goToLast")}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
