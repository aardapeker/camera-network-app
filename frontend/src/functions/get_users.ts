import type { PaginatedUsersResponse, UserRole, UserStatus } from "~/types";
import { getSessionToken } from "./get_session_token";

interface GetUsersParams {
  filterInput: string | null;
  filterBy:
    | "all"
    | "username"
    | "firstName"
    | "lastName"
    | "email"
    | "role"
    | null;
  roles: UserRole[] | null;
  statuses: UserStatus[] | null;
  page: string | null;
  size: string | null;
  sortBy: string | null;
  sortDirection: "ASC" | "DESC" | null;
}

async function getUsers({
  filterInput,
  filterBy,
  roles,
  statuses,
  page,
  size,
  sortBy,
  sortDirection,
}: GetUsersParams): Promise<PaginatedUsersResponse> {
  const token = getSessionToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Build query params
  const params = new URLSearchParams();

  if (page) params.append("page", page);
  if (size) params.append("size", size);
  if (sortBy) params.append("sortBy", sortBy);
  if (sortDirection) params.append("sortDirection", sortDirection);

  // nullable params
  if (filterInput && filterBy) {
    params.append("filterInput", filterInput);
    params.append("filterBy", filterBy);
  }

  if (roles && roles.length > 0) {
    params.append("roles", roles.join(","));
  }

  if (statuses && statuses.length > 0) {
    params.append("statuses", statuses.join(","));
  }

  const response = await fetch(`/api/admin/users?${params}`, {
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
  }

  const data = (await response.json()) as PaginatedUsersResponse;
  return data;
}

export default getUsers;
