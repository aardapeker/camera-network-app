import { Link } from "react-router";

import ProfileDropdown from "./profile-dropdown";
import { ServicePortalHeader } from "./service-portal-header";
import { isServicePortalHost } from "~/lib/service-portal";
import type { HeaderProps } from "~/types";

export function Header({ userData, isAdmin }: HeaderProps) {
  // The portal host gets a service-form-only header (no topology/admin entries).
  if (isServicePortalHost()) {
    return <ServicePortalHeader userData={userData} isAdmin={isAdmin} />;
  }

  return (
    <header className="sticky top-0 w-full border-b bg-background z-10">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center">
          <span className="sr-only">FieldDesk</span>
          <img
            src="/logo.png"
            alt="FieldDesk"
            className="h-10"
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Profile Dropdown */}
          <ProfileDropdown userData={userData} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
