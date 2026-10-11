import {
  Check,
  ChevronDown,
  Filter,
  FilterX,
  RefreshCw,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { DataTableViewOptions } from "./data-table-view-options";
import { NetworkScanAgentSettingsDialog } from "./network-scan-agent-settings-dialog";
import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSearchDebounce } from "~/hooks/use-search-debounce";
import { useIsDesktop } from "~/hooks/use-desktop";
import { useIsMobile } from "~/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import type { useReactTable } from "@tanstack/react-table";
import type { NetworkScanHost } from "~/types";

type TableInstance<T> = ReturnType<typeof useReactTable<T>>;

type SearchScope = "all" | "ip" | "hostname" | "vendor";

export default function NetworkScanFilter({
  table,
  sources,
}: {
  table: TableInstance<NetworkScanHost>;
  sources: string[];
}) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  const currentSize = searchParams.get("size");
  const currentSortBy = searchParams.get("sortBy");
  const currentSortDirection = searchParams.get("sortDirection");
  const currentFilterInput = searchParams.get("filterInput");
  const currentFilterBy = searchParams.get("filterBy");
  const currentSources = searchParams.get("sources");
  const isFiltered =
    currentSortBy !== null ||
    currentSortDirection !== null ||
    currentFilterInput !== null ||
    currentFilterBy !== null ||
    currentSources !== null;

  const activeFilterCount = sourceFilter.length;

  const buildBaseParams = () => {
    const params = new URLSearchParams();
    if (currentSize && currentSize !== "25") {
      params.append("size", currentSize);
    }
    if (currentSortBy && currentSortBy !== "scannedAt") {
      params.append("sortBy", currentSortBy);
    }
    if (currentSortDirection && currentSortDirection !== "DESC") {
      params.append("sortDirection", currentSortDirection);
    }
    return params;
  };

  const toggleSourceFilter = (source: string) => {
    setSourceFilter((prev) => {
      const next = prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source];

      const params = buildBaseParams();
      if (currentFilterInput && currentFilterBy) {
        params.append("filterInput", currentFilterInput);
        params.append("filterBy", currentFilterBy);
      }
      if (next.length > 0) {
        params.append("sources", next.join(","));
      }
      navigate(`?${params.toString()}`);

      return next;
    });
  };

  const clearSourceFilter = () => {
    setSourceFilter([]);
    const params = buildBaseParams();
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }
    navigate(`?${params.toString()}`);
  };

  const performSearch = useCallback(
    (value: string) => {
      const params = buildBaseParams();
      if (currentSources) {
        params.append("sources", currentSources);
      }
      if (value) {
        params.append("filterInput", value);
        params.append("filterBy", searchScope);
      }
      navigate(`?${params.toString()}`);
      setIsSearching(false);
    },
    [navigate, searchParams, searchScope],
  );

  const { debouncedSearch, cancelSearch } = useSearchDebounce(performSearch, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setIsSearching(true);
    debouncedSearch(value);
  };

  const handleSearchScopeChange = (scope: SearchScope) => {
    setSearchScope(scope);
    cancelSearch();

    if (searchText) {
      const params = buildBaseParams();
      if (currentSources) {
        params.append("sources", currentSources);
      }
      params.append("filterInput", searchText);
      params.append("filterBy", scope);
      navigate(`?${params.toString()}`);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    cancelSearch();
    setIsSearching(false);

    const params = buildBaseParams();
    if (currentSources) {
      params.append("sources", currentSources);
    }
    navigate(`?${params.toString()}`);
  };

  const resetAllFilters = () => {
    setSearchText("");
    setSearchScope("all");
    setSourceFilter([]);
    navigate("?");
  };

  return (
    <>
      <div className="min-h-10 flex items-center gap-2">
        {isFiltered && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("table.filtersActive")}</span>
            <Button onClick={resetAllFilters} size="sm" variant="outline" className="h-8">
              <FilterX className="h-4 w-4 mr-1" />
              {t("table.clear")}
            </Button>
          </div>
        )}
      </div>
      <div className={`flex items-center py-4 ${isMobile && "flex-col"}`}>
        <div className="relative flex justify-between gap-1 items-center w-full">
          <div className="flex w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-1 h-8 px-2 border-r border-y border-l rounded-r-none flex items-center gap-1 min-w-[90px] justify-between"
                >
                  {searchScope === "all"
                    ? t("networkScan.scopeAll")
                    : searchScope === "ip"
                      ? t("networkScan.scopeIp")
                      : searchScope === "hostname"
                        ? t("networkScan.scopeHostname")
                        : t("networkScan.scopeVendor")}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                {(["all", "ip", "hostname", "vendor"] as SearchScope[]).map((scope) => (
                  <DropdownMenuItem key={scope} onClick={() => handleSearchScopeChange(scope)}>
                    <Check
                      className={`mr-2 h-4 w-4 ${searchScope === scope ? "opacity-100" : "opacity-0"}`}
                    />
                    {scope === "all"
                      ? t("networkScan.scopeAll")
                      : scope === "ip"
                        ? t("networkScan.scopeIp")
                        : scope === "hostname"
                          ? t("networkScan.scopeHostname")
                          : t("networkScan.scopeVendor")}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center relative w-full">
              <Input
                placeholder={t("networkScan.searchPlaceholder")}
                value={searchText}
                onChange={handleSearchChange}
                className={`h-8 ${!isMobile && "w-[300px]"} rounded-l-none pl-8`}
              />
              {isSearching ? (
                <RefreshCw className="h-4 w-4 text-muted-foreground absolute left-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground absolute left-2" />
              )}
              {searchText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-8 w-8 p-0 absolute right-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 lg:flex">
                <Filter className="h-4 w-4" />
                {t("table.filter")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <div className="p-2">
                <div className="font-medium mb-2">{t("networkScan.filterBySource")}</div>
                {sources.map((source) => (
                  <DropdownMenuCheckboxItem
                    key={source}
                    checked={sourceFilter.includes(source)}
                    onCheckedChange={() => toggleSourceFilter(source)}
                  >
                    {source}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={clearSourceFilter}
                    disabled={sourceFilter.length === 0}
                  >
                    {t("table.clear")}
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          onClick={() => setShowAgentSettings(true)}
          className="ml-1 flex items-center gap-1 px-3 py-1.5 bg-secondary text-foreground text-sm rounded hover:bg-accent transition-colors shrink-0"
          title={t("networkScan.manageAgentSettings")}
        >
          <Settings2 className="h-4 w-4" />
          {t("networkScan.manageAgentSettings")}
        </button>
        {isDesktop && (
          <div className="ml-1">
            <DataTableViewOptions table={table} />
          </div>
        )}
      </div>
      <NetworkScanAgentSettingsDialog
        open={showAgentSettings}
        onOpenChange={setShowAgentSettings}
        sources={sources}
      />
    </>
  );
}
