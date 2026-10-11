import { columns } from "~/components/table/columns"
import { DataTable } from "~/components/table/data-table"
import { useLoaderData } from "react-router"
import {
  UserRole,
  UserStatus,
  type PaginatedUsersResponse,
  type PaginationData,
  type User,
} from "~/types"
import type { Route } from "./+types/users-page"
import getUsers from "~/functions/get_users"

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  try {
    // Parse URL search params
    const url = new URL(request.url)
    const page = url.searchParams.get("page")
    const size = url.searchParams.get("size")
    const sortBy = url.searchParams.get("sortBy")
    const sortDirection = url.searchParams.get("sortDirection") as
      | "ASC"
      | "DESC"
      | null

    // Get filter parameters
    const filterInput = url.searchParams.get("filterInput")
    const filterBy = url.searchParams.get("filterBy") as
      | "all"
      | "username"
      | "firstName"
      | "lastName"
      | "email"
      | "role"
      | null

    // Get role filter parameter
    const rolesParam = url.searchParams.get("roles")
    const roles = rolesParam
      ? (rolesParam
        .split(",")
        .filter((role) =>
          Object.values(UserRole).includes(role as UserRole),
        ) as UserRole[])
      : null

    // Get status filter parameter
    const statusParam = url.searchParams.get("statuses")
    const statuses = statusParam
      ? (statusParam
        .split(",")
        .filter((status) =>
          Object.values(UserStatus).includes(status as UserStatus),
        ) as UserStatus[])
      : null

    let data: PaginatedUsersResponse = await getUsers({
      filterInput,
      filterBy,
      roles,
      statuses,
      page,
      size,
      sortBy,
      sortDirection,
    })

    const paginationData: PaginationData = {
      currentPage: data.currentPage,
      hasPrevious: data.hasPrevious,
      hasNext: data.hasNext,
      totalPages: data.totalPages,
      totalItems: data.totalItems,
      pageSize: data.pageSize,
      message: data.message,
    }

    const users: User[] = data.content

    return { users, paginationData }
  } catch (error) {
    throw error
  }
}

// Add this to prevent the loader from running during SSR/build
clientLoader.hydrate = true as const

const UsersPage = () => {
  const { users, paginationData } = useLoaderData()

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        paginationData={paginationData}
        users={users}
      />
    </div>
  )
}

export default UsersPage
