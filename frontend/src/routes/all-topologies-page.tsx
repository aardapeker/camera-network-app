import type { Route } from "./+types/all-topologies-page";
import { Link, useRevalidator, redirect, useNavigate, useSearchParams } from "react-router";
import {
  Network, Calendar, User, Trash2, UserCheck, Inbox, UserX, Loader2, Eye, Clock,
  Search, X, RefreshCw, FilterX, ChevronDown,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import getAllTopologies from "~/functions/get_all_topologies";
import getMe from "~/functions/get_me";
import deleteTopology from "~/functions/delete_topology";
import unassignTopology from "~/functions/unassign_topology";
import type { Topology } from "~/functions/get_all_topologies";
import type { CurrentUserType } from "~/types";
import { CustomPermission } from "~/types";
import { useSearchDebounce } from "~/hooks/use-search-debounce";

const SUPERIOR_ROLES = ["ROLE_ADMIN", "ROLE_DEVELOPER", "ROLE_MANAGER"];

const SORT_OPTIONS = [
  { value: "createdAt|DESC", labelKey: "topologies.sortNewest" },
  { value: "createdAt|ASC", labelKey: "topologies.sortOldest" },
  { value: "updatedAt|DESC", labelKey: "topologies.sortLastUpdated" },
  { value: "name|ASC", labelKey: "topologies.sortNameAsc" },
  { value: "name|DESC", labelKey: "topologies.sortNameDesc" },
];

const ASSIGNED_OPTIONS = [
  { value: "", labelKey: "topologies.assignedAll" },
  { value: "assigned", labelKey: "topologies.assignedAssigned" },
  { value: "unassigned", labelKey: "topologies.assignedUnassigned" },
];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const sortBy = url.searchParams.get("sortBy");
  const sortDirection = url.searchParams.get("sortDirection");
  const assigned = url.searchParams.get("assigned");
  const creator = url.searchParams.get("creator");

  const [topologies, currentUser] = await Promise.all([
    getAllTopologies({ search, sortBy, sortDirection, assigned, creator }),
    getMe(),
  ]);
  const hasViewAll = currentUser.role === "ROLE_CUSTOM" &&
    currentUser.customPermissions?.includes(CustomPermission.VIEW_ALL_TOPOLOGIES);
  if (!SUPERIOR_ROLES.includes(currentUser.role) && !hasViewAll) {
    throw redirect("/home");
  }
  return { topologies, currentUser };
}

clientLoader.hydrate = true as const;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AllTopologiesPage({ loaderData }: Route.ComponentProps) {
  const { topologies, currentUser } = loaderData;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentSearch = searchParams.get("search") ?? "";
  const currentSortBy = searchParams.get("sortBy") ?? "createdAt";
  const currentSortDirection = searchParams.get("sortDirection") ?? "DESC";
  const currentAssigned = searchParams.get("assigned") ?? "";
  const currentCreator = searchParams.get("creator") ?? "";

  const currentSortValue = `${currentSortBy}|${currentSortDirection}`;
  const isFiltered = !!(currentSearch || currentAssigned || currentCreator ||
    (currentSortBy !== "createdAt" || currentSortDirection !== "DESC"));

  const [searchText, setSearchText] = useState(currentSearch);
  const [creatorText, setCreatorText] = useState(currentCreator);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatorSearching, setIsCreatorSearching] = useState(false);

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const base: Record<string, string> = {
      search: currentSearch,
      sortBy: currentSortBy,
      sortDirection: currentSortDirection,
      assigned: currentAssigned,
      creator: currentCreator,
      ...overrides,
    };
    Object.entries(base).forEach(([k, v]) => {
      if (v && !(k === "sortBy" && v === "createdAt" && (base.sortDirection ?? "DESC") === "DESC") &&
          !(k === "sortDirection" && v === "DESC" && (base.sortBy ?? "createdAt") === "createdAt")) {
        params.set(k, v);
      }
    });
    // Always omit defaults to keep URL clean
    if (base.sortBy === "createdAt" && base.sortDirection === "DESC") {
      params.delete("sortBy");
      params.delete("sortDirection");
    }
    return params;
  }

  const performSearch = useCallback((value: string) => {
    const params = buildParams({ search: value, creator: currentCreator });
    navigate(`?${params.toString()}`);
    setIsSearching(false);
  }, [currentSortBy, currentSortDirection, currentAssigned, currentCreator]);

  const performCreatorSearch = useCallback((value: string) => {
    const params = buildParams({ creator: value, search: currentSearch });
    navigate(`?${params.toString()}`);
    setIsCreatorSearching(false);
  }, [currentSortBy, currentSortDirection, currentAssigned, currentSearch]);

  const { debouncedSearch, cancelSearch } = useSearchDebounce(performSearch, 500);
  const { debouncedSearch: debouncedCreatorSearch, cancelSearch: cancelCreatorSearch } = useSearchDebounce(performCreatorSearch, 500);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearchText(v);
    setIsSearching(true);
    debouncedSearch(v);
  }

  function handleCreatorChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setCreatorText(v);
    setIsCreatorSearching(true);
    debouncedCreatorSearch(v);
  }

  function clearSearch() {
    setSearchText("");
    cancelSearch();
    setIsSearching(false);
    const params = buildParams({ search: "" });
    navigate(`?${params.toString()}`);
  }

  function clearCreator() {
    setCreatorText("");
    cancelCreatorSearch();
    setIsCreatorSearching(false);
    const params = buildParams({ creator: "" });
    navigate(`?${params.toString()}`);
  }

  function handleSortChange(value: string) {
    const [sortBy, sortDirection] = value.split("|");
    const params = buildParams({ sortBy, sortDirection });
    navigate(`?${params.toString()}`);
  }

  function handleAssignedChange(value: string) {
    const params = buildParams({ assigned: value });
    navigate(`?${params.toString()}`);
  }

  function resetFilters() {
    setSearchText("");
    setCreatorText("");
    cancelSearch();
    cancelCreatorSearch();
    navigate("?");
  }

  const currentSortLabelKey = SORT_OPTIONS.find(o => o.value === currentSortValue)?.labelKey ?? "topologies.sortNewest";
  const currentAssignedLabelKey = ASSIGNED_OPTIONS.find(o => o.value === currentAssigned)?.labelKey ?? "topologies.assignedAll";

  return (
    <div
      className="p-6 space-y-6 h-full overflow-y-auto
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-muted/30
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-border
        hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("topologies.allTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("topologies.countFound", { count: topologies.length })}
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Name search */}
        <div className="relative flex items-center">
          <Input
            placeholder={t("topologies.searchByName")}
            value={searchText}
            onChange={handleSearchChange}
            className="h-8 w-[220px] pl-8 pr-8"
          />
          {isSearching ? (
            <RefreshCw className="h-4 w-4 text-muted-foreground absolute left-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground absolute left-2" />
          )}
          {searchText && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 w-6 p-0 absolute right-1">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Creator search */}
        <div className="relative flex items-center">
          <Input
            placeholder={t("topologies.filterByCreator")}
            value={creatorText}
            onChange={handleCreatorChange}
            className="h-8 w-[200px] pl-8 pr-8"
          />
          {isCreatorSearching ? (
            <RefreshCw className="h-4 w-4 text-muted-foreground absolute left-2 animate-spin" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground absolute left-2" />
          )}
          {creatorText && (
            <Button variant="ghost" size="sm" onClick={clearCreator} className="h-6 w-6 p-0 absolute right-1">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Assignment filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              {t(currentAssignedLabelKey)}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ASSIGNED_OPTIONS.map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => handleAssignedChange(opt.value)}>
                {t(opt.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              {t(currentSortLabelKey)}
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SORT_OPTIONS.map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)}>
                {t(opt.labelKey)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {isFiltered && (
          <Button variant="ghost" size="sm" className="h-8" onClick={resetFilters}>
            <FilterX className="h-4 w-4 mr-1" />
            {t("common.clear")}
          </Button>
        )}
      </div>

      {topologies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Network className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">{t("topologies.noneFoundTitle")}</h2>
          <p className="text-muted-foreground mt-1">
            {t("topologies.noneFoundFilters")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topologies.map((topology: Topology) => (
            <TopologyCard
              key={topology.id}
              topology={topology}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopologyCard({
  topology,
  currentUser,
}: {
  topology: Topology;
  currentUser: CurrentUserType;
}) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const revalidator = useRevalidator();

  const isCustom = currentUser.role === "ROLE_CUSTOM";
  const isSuperior = SUPERIOR_ROLES.includes(currentUser.role);
  const perms = currentUser.customPermissions ?? [];
  const hasCreate = isCustom && perms.includes(CustomPermission.CREATE_TOPOLOGY);
  const hasEditAllUnassigned = isCustom && perms.includes(CustomPermission.EDIT_ALL_UNASSIGNED);
  const hasEditClientAssigned = isCustom && perms.includes(CustomPermission.EDIT_CLIENT_ASSIGNED);

  const isAssigned = !!(topology.clientUsernames?.length);
  const isOwner = topology.createdByUsername === currentUser.username;

  const canEdit = isSuperior
    || (!isCustom && isOwner && !isAssigned)
    || (!isAssigned && (hasEditAllUnassigned || (hasCreate && isOwner)))
    || (isAssigned && hasEditClientAssigned);
  const canDelete = canEdit;
  const canUnassign = (isSuperior || hasEditClientAssigned) && isAssigned;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteTopology(topology.id);
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("topologies.deleteFailed"));
      setDeleting(false);
    }
  }

  async function handleUnassign() {
    setUnassigning(true);
    setError(null);
    try {
      await unassignTopology(topology.id);
      revalidator.revalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("topologies.unassignFailed"));
      setUnassigning(false);
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Network className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-base truncate">{topology.name}</CardTitle>
          </div>
          {isAssigned ? (
            <Badge variant="outline" className="shrink-0 text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              {topology.clientUsernames?.join(", ")}
            </Badge>
          ) : (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {t("topologies.unassigned")}
            </Badge>
          )}
        </div>
        <CardDescription className="flex flex-col gap-1 mt-1 text-xs">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("topologies.created", { date: formatDate(topology.createdAt) })}
          </span>
          {topology.updatedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("topologies.updated", { date: formatDate(topology.updatedAt) })}
            </span>
          )}
          {topology.createdByUsername && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {topology.createdByUsername}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex flex-col gap-2">
        {error && <p className="text-destructive text-xs text-center">{error}</p>}
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to={`/topology-view/${topology.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            {t("topologies.view")}
          </Link>
        </Button>
        {canEdit && (
          <Button asChild size="sm" className="w-full">
            <Link to={`/topology-editor/${topology.id}`}>{t("topologies.openEditor")}</Link>
          </Button>
        )}
        {canUnassign && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full" disabled={unassigning}>
                {unassigning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4 mr-2" />
                )}
                {unassigning ? t("topologies.unassigning") : t("topologies.unassign")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("topologies.unassignDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  <Trans
                    i18nKey="topologies.unassignDialogDescription"
                    values={{ name: topology.name, clients: topology.clientUsernames?.join(", ") }}
                    components={[<strong />, <strong />]}
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnassign}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("topologies.unassign")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? t("topologies.deleting") : t("topologies.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("topologies.deleteDialogTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  <Trans
                    i18nKey="topologies.deleteDialogDescription"
                    values={{ name: topology.name }}
                    components={[<strong />]}
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("topologies.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}
