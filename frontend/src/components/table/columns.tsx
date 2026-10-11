import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, X } from "lucide-react";
import { DataTableColumnHeader } from "./data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Link, useRevalidator } from "react-router";
import { UserStatus, type User } from "~/types";
import { toast } from "sonner";
import { updateUserStatus } from "~/functions/update_user_status";
import { useTranslation } from "react-i18next";
import i18n from "~/lib/i18n";

async function handleUserStatusChange(
  userId: string,
  status: UserStatus,
  onSuccess?: () => void,
) {
  const action = status === UserStatus.BANNED ? "ban" : "unban";
  try {
    await updateUserStatus(userId, status);
    if (action === "ban") {
      toast.success(i18n.t("table.userBanned"));
    } else if (action === "unban") {
      toast.success(i18n.t("table.userUnbanned"));
    }

    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : action === "ban"
          ? i18n.t("table.banFailed")
          : i18n.t("table.unbanFailed");
    toast.error(errorMessage);
  }
}

// Component to handle actions with access to React Router hooks
function UserActionsCell({ user }: { user: User }) {
  const revalidator = useRevalidator();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">{t("table.openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("table.actions")}</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(user.id)}
        >
          {t("table.copyUserId")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/admin/users/${user.username}`}>{t("table.viewUser")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>{t("table.viewUserDetails")}</DropdownMenuItem>
        {/* Conditionally show Ban or Unban based on current status */}
        {user.status === UserStatus.ACTIVE ? (
          <DropdownMenuItem
            onClick={() =>
              handleUserStatusChange(user.id, UserStatus.BANNED, () => {
                revalidator.revalidate();
              })
            }
          >
            {t("table.banUser")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() =>
              handleUserStatusChange(user.id, UserStatus.ACTIVE, () => {
                revalidator.revalidate();
              })
            }
          >
            {t("table.unbanUser")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Component wrapper so the select-column clear button can use hooks
function SelectHeaderButton({ selectedCount, onClear }: { selectedCount: number; onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClear}
      className="h-6 w-6 p-0 hover:bg-destructive/10"
      title={t("table.clearSelected", { count: selectedCount })}
    >
      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
    </Button>
  );
}

export const columns: ColumnDef<User>[] = [
  {
    id: "actions",
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  },
  {
    id: "select",
    header: ({ table }) => {
      const selectedCount = table.getFilteredSelectedRowModel().rows.length;

      if (selectedCount === 0) {
        return <div className="h-6 w-6  p-0" />; // Empty placeholder to maintain column width
      }

      return (
        <SelectHeaderButton
          selectedCount={selectedCount}
          onClear={() => table.toggleAllRowsSelected(false)}
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={i18n.t("table.selectRow")}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "avatar",
    cell: ({ row }) => (
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={row.original.profilePictureUrl}
          alt={row.original.username}
        />
        <AvatarFallback>
          {row.original.firstName?.charAt(0).toUpperCase()}
          {row.original.lastName?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ),
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} titleKey="table.colFirstName" />;
    },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} titleKey="table.colLastName" />;
    },
  },
  {
    accessorKey: "authorities",
    header: () => i18n.t("table.colRole"),
    cell: ({ row }) => {
      const authorities = row.getValue("authorities") as string[];
      return (
        <div>
          {authorities.map((role) => (
            <span key={role}>
              {role === "ROLE_ADMIN"
                ? "ADMIN"
                : role === "ROLE_DEVELOPER"
                  ? "DEVELOPER"
                  : role === "ROLE_MANAGER"
                    ? "MANAGER"
                    : role === "ROLE_MODERATOR"
                      ? "MODERATOR"
                      : role === "ROLE_TECH"
                        ? "TECH"
                        : role === "ROLE_CLIENT"
                          ? "CLIENT"
                          : role === "ROLE_CUSTOM"
                            ? "CUSTOM"
                            : role}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} titleKey="table.colUsername" />;
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} titleKey="table.colEmail" />;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} titleKey="table.colSignupDate" />;
    },
  },
  {
    accessorKey: "status",
    header: () => i18n.t("table.colStatus"),
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium me-2 ${
            status === UserStatus.ACTIVE
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : status === UserStatus.BANNED
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : status === UserStatus.PENDING || status === UserStatus.EXPIRED
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : ""
          }`}
        >
          {status}
        </span>
      );
    },
  },
];
