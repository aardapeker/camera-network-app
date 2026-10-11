import {
  AlertTriangle,
  Check,
  ChevronDown,
  Filter,
  FilterX,
  RefreshCw,
  Search,
  Table,
  Trash2,
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
import { UserRole, UserStatus, type User } from "~/types";
import { useCallback, useState } from "react";
import { useNavigate, useRevalidator, useSearchParams } from "react-router";
import { useSearchDebounce } from "~/hooks/use-search-debounce";

import deleteUsers from "~/functions/delete_users";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import type { useReactTable } from "@tanstack/react-table";

type TableInstance<T> = ReturnType<typeof useReactTable<T>>;

type SearchScope = "all" | "username" | "firstName" | "lastName" | "email";

import { toast } from "sonner";
import { useIsDesktop } from "~/hooks/use-desktop";
import { useIsMobile } from "~/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export default function DataTableFilter({
  table,
}: {
  table: TableInstance<User>;
}) {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [usersToDelete, setUsersToDelete] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole[]>([]);
  const [statusFilter, setStatusFilter] = useState<UserStatus[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("all");
  const [searchParams] = useSearchParams();

  const uniqueRoles = Object.entries(UserRole);

  const uniquesStatuses = Object.entries(UserStatus);

  const rowSelection = table.getState().rowSelection;

  const selectedCount = Object.keys(rowSelection).length;

  const revalidator = useRevalidator();

  const navigate = useNavigate();

  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();

  const currentSize = searchParams.get("size");
  const currentSortBy = searchParams.get("sortBy");
  const currentSortDirection = searchParams.get("sortDirection");
  const currentFilterInput = searchParams.get("filterInput");
  const currentFilterBy = searchParams.get("filterBy");
  const currentRoles = searchParams.get("roles");
  const currentStatuses = searchParams.get("statuses");
  const isFiltered =
    currentSortBy !== null ||
    currentSortDirection !== null ||
    currentFilterInput !== null ||
    currentFilterBy !== null ||
    currentRoles !== null ||
    currentStatuses !== null;

  const activeFilterCount = roleFilter.length + statusFilter.length;

  // Filtering
  // Toggle role in filter
  const toggleRoleFilter = (role: UserRole) => {
    setRoleFilter((prev) => {
      const roles = prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role];

      // Navigate with updated role filter
      handleRoleFilterChange(roles);

      return roles;
    });
  };

  // Toggle status in filter
  const toggleStatusFilter = (status: UserStatus) => {
    setStatusFilter((prev) => {
      const statuses = prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status];

      // Navigate with updated role filter
      handleStatusFilterChange(statuses);

      return statuses;
    });
  };

  // Handle role filter changes and update URL
  const handleRoleFilterChange = (roles: string[]) => {
    const params = new URLSearchParams();

    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== "username") {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== "ASC") {
      params.append("sortDirection", currentSortDirection);
    }

    if (currentFilterBy && currentFilterInput) {
      params.append("filterBy", currentFilterBy);
      params.append("filterInput", currentFilterInput);
    }

    if (roles && roles.length > 0) {
      params.append("roles", roles.join(","));
    }

    if (currentStatuses) {
      params.append("statuses", currentStatuses);
    }

    navigate(`?${params.toString()}`);
  };

  // Handle role filter changes and update URL
  const handleStatusFilterChange = (statuses: UserStatus[]) => {
    const params = new URLSearchParams();

    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== "username") {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== "ASC") {
      params.append("sortDirection", currentSortDirection);
    }

    if (currentFilterBy && currentFilterInput) {
      params.append("filterBy", currentFilterBy);
      params.append("filterInput", currentFilterInput);
    }

    if (currentRoles) {
      params.append("roles", currentRoles);
    }

    if (statuses && statuses.length > 0) {
      params.append("statuses", statuses.join(","));
    }

    navigate(`?${params.toString()}`);
  };

  const resetAllFilters = () => {
    setSearchText("");
    setSearchScope("all");
    setRoleFilter([]);
    setStatusFilter([]);

    const params = new URLSearchParams();

    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    navigate(`?${params.toString()}`);

    revalidator.revalidate();
  };

  // Clear all role filters
  const clearRoleFilter = () => {
    const params = new URLSearchParams();

    // Only append if different from backend defaults
    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== "username") {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== "ASC") {
      params.append("sortDirection", currentSortDirection);
    }

    // Preserve search filters
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }

    if (currentStatuses) {
      params.append("statuses", currentStatuses);
    }

    setRoleFilter([]);

    navigate(`?${params.toString()}`);
  };

  // Clear all status filters
  const clearStatusFilter = () => {
    const params = new URLSearchParams();

    // Only append if different from backend defaults
    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== "username") {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== "ASC") {
      params.append("sortDirection", currentSortDirection);
    }

    // Preserve search filters
    if (currentFilterInput && currentFilterBy) {
      params.append("filterInput", currentFilterInput);
      params.append("filterBy", currentFilterBy);
    }

    if (currentRoles) {
      params.append("roles", currentRoles);
    }

    setStatusFilter([]);

    navigate(`?${params.toString()}`);
  };

  // Deleting
  const handleDelete = () => {
    // Get the selected users
    const selectedUsers = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original);

    // Store the users to delete temporarily
    setUsersToDelete(selectedUsers);

    // Open the confirmation dialog
    setIsDeleteDialogOpen(true);
  };

  // Handle actual deletion after confirmation
  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const userIdsToDelete = usersToDelete.map((user) => user.id);

      // Single function handles both cases
      await deleteUsers(userIdsToDelete);

      // Success: close dialog, clear selection, and revalidate
      setIsDeleteDialogOpen(false);
      // setRowSelection({}); // I should find a way to set this from here!
      table.resetRowSelection();

      toast.success(
        t("table.deleteSuccess", { count: userIdsToDelete.length }),
      );

      revalidator.revalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("table.deleteFailed"),
      );
    } finally {
      setIsDeleting(false);
      resetAllFilters();
    }
  };

  // Searching
  const performSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams();

      // Only append if different from backend defaults
      if (currentSize && currentSize !== "10") {
        params.append("size", currentSize);
      }

      if (currentSortBy && currentSortBy !== "username") {
        params.append("sortBy", currentSortBy);
      }

      if (currentSortDirection && currentSortDirection !== "ASC") {
        params.append("sortDirection", currentSortDirection);
      }

      // Preserve role filters
      if (currentRoles) {
        params.append("roles", currentRoles);
      }

      if (currentStatuses) {
        params.append("statuses", currentStatuses);
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

  const { debouncedSearch, cancelSearch } = useSearchDebounce(
    performSearch,
    500,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setIsSearching(true);
    debouncedSearch(value);
  };

  const handleSearchScopeChange = (
    scope: "all" | "username" | "firstName" | "lastName" | "email",
  ) => {
    setSearchScope(scope);
    cancelSearch();

    // If there's active search text, re-trigger search with new scope
    if (searchText) {
      const params = new URLSearchParams();

      // Only append if different from backend defaults
      if (currentSize && currentSize !== "10") {
        params.append("size", currentSize);
      }

      if (currentSortBy && currentSortBy !== "username") {
        params.append("sortBy", currentSortBy);
      }

      if (currentSortDirection && currentSortDirection !== "ASC") {
        params.append("sortDirection", currentSortDirection);
      }

      // Preserve role filters
      if (currentRoles) {
        params.append("roles", currentRoles);
      }

      if (currentStatuses) {
        params.append("statuses", currentStatuses);
      }

      // Add search with new scope
      params.append("filterInput", searchText);
      params.append("filterBy", scope);

      navigate(`?${params.toString()}`);
    }
  };

  const clearSearch = () => {
    setSearchText("");
    cancelSearch(); // Cancel any pending debounced searches
    setIsSearching(false);

    const params = new URLSearchParams();

    // Only append if different from backend defaults
    if (currentSize && currentSize !== "10") {
      params.append("size", currentSize);
    }

    if (currentSortBy && currentSortBy !== "username") {
      params.append("sortBy", currentSortBy);
    }

    if (currentSortDirection && currentSortDirection !== "ASC") {
      params.append("sortDirection", currentSortDirection);
    }

    // Preserve role filters when clearing search
    if (currentRoles) {
      params.append("roles", currentRoles);
    }

    if (currentStatuses) {
      params.append("statuses", currentStatuses);
    }

    navigate(`?${params.toString()}`);
  };

  return (
    <>
      {/* Action Bar - Stable height, above table */}
      <div className="min-h-10 flex items-center gap-2">
        {/* Left side - Filter actions */}
        <div className="flex items-center gap-2">
          {isFiltered && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("table.filtersActive")}
              </span>
              <Button
                onClick={resetAllFilters}
                size="sm"
                variant="outline"
                className="h-8"
              >
                <FilterX className="h-4 w-4 mr-1" />
                {t("table.clear")}
              </Button>
            </div>
          )}
        </div>

        {/* Right side - Selection actions */}
        <div className="flex items-center gap-2">
          {(table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()) && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDelete}
                size="sm"
                variant="destructive"
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {selectedCount > 1 ? t("table.deleteUsers", { count: selectedCount }) : t("table.deleteUser")}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className={`flex  items-center py-4 ${isMobile && "flex-col"}`}>
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
                    ? t("table.scopeAll")
                    : searchScope === "username"
                      ? t("table.scopeUsername")
                      : searchScope === "firstName"
                        ? t("table.scopeFirstName")
                        : searchScope === "lastName"
                          ? t("table.scopeLastName")
                          : t("table.scopeEmail")}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                <DropdownMenuItem
                  onClick={() => handleSearchScopeChange("all")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${searchScope === "all" ? "opacity-100" : "opacity-0"}`}
                  />
                  {t("table.scopeAllFields")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSearchScopeChange("username")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${searchScope === "username" ? "opacity-100" : "opacity-0"}`}
                  />
                  {t("table.scopeUsername")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSearchScopeChange("firstName")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${searchScope === "firstName" ? "opacity-100" : "opacity-0"}`}
                  />
                  {t("table.scopeFirstName")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSearchScopeChange("lastName")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${searchScope === "lastName" ? "opacity-100" : "opacity-0"}`}
                  />
                  {t("table.scopeLastName")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSearchScopeChange("email")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${searchScope === "email" ? "opacity-100" : "opacity-0"}`}
                  />
                  {t("table.scopeEmail")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center relative w-full">
              <Input
                id="unified-search-input"
                placeholder={t("table.searchUsers")}
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
                  <span className="sr-only">{t("table.clearSearch")}</span>
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
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2">
                <div className="font-medium mb-2">{t("table.filterByRole")}</div>
                {uniqueRoles.map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={roleFilter.includes(value)}
                    onCheckedChange={() => toggleRoleFilter(value)}
                  >
                    {key}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={clearRoleFilter}
                    disabled={roleFilter.length === 0}
                  >
                    {t("table.clearRoleFilters")}
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <div className="font-medium mb-2">{t("table.filterByStatus")}</div>
                {uniquesStatuses.map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilter.includes(value)}
                    onCheckedChange={() => toggleStatusFilter(value)}
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={clearStatusFilter}
                    disabled={statusFilter.length === 0}
                  >
                    {t("table.clearStatusFilters")}
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex">
          {/*{(table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()) && (
            <Button
              onClick={handleDelete}
              size="sm"
              className="ml-auto h-8 lg:flex mr-2"
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 /> Delete Users ({selectedCount})
                </>
              )}
            </Button>
          )}*/}

          {/*{isFiltered && (
            <Button
              onClick={resetAllFilters}
              size="sm"
              className="ml-auto h-8 lg:flex mr-2"
              variant="destructive"
            >
              <FilterX /> Reset Filtering
            </Button>
          )}*/}
          {/*<DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto h-8 lg:flex mr-2"
              >
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <div className="p-2">
                <div className="font-medium mb-2">Filter by Role</div>
                {uniqueRoles.map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={roleFilter.includes(value)}
                    onCheckedChange={() => toggleRoleFilter(value)}
                  >
                    {key}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={clearRoleFilter}
                    disabled={roleFilter.length === 0}
                  >
                    Clear Role Filters
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <div className="font-medium mb-2">Filter by Status</div>
                {uniquesStatuses.map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilter.includes(value)}
                    onCheckedChange={() => toggleStatusFilter(value)}
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
                <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start font-normal"
                    onClick={clearStatusFilter}
                    disabled={statusFilter.length === 0}
                  >
                    Clear Status Filters
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>*/}
          {isDesktop && (
            <div className="ml-1">
              <DataTableViewOptions table={table} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t("table.confirmDeletion")}
            </DialogTitle>
            <DialogDescription>
              {t("table.confirmDeleteText", { count: usersToDelete.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[200px] overflow-auto border rounded-md my-2">
            <div className="w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">{t("table.scopeUsername")}</th>
                    <th className="text-left p-2 font-medium">{t("table.scopeEmail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {usersToDelete.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="p-2 font-medium">{user.username}</td>
                      <td className="p-2">{user.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              {t("table.cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {t("table.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t("table.deleteSelected", { count: selectedCount })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
