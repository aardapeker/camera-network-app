import {
  type RouteConfig,
  layout,
  route,
  index,
} from "@react-router/dev/routes";

export default [
  // Landing page (outside any layout)
  index("routes/landing-page.tsx"),

  // Service-form portal dead end for roles that may not use that host
  route("portal-access-denied", "routes/portal-access-denied-page.tsx"),

  // Auth routes (outside any layout)
  layout("layouts/auth-layout.tsx", [
    route("signin", "routes/signin-page.tsx"),
    route("signup", "routes/signup-page.tsx"),
    route("forgot-password", "routes/forgot-password-page.tsx"),
    route("reset-password", "routes/reset-password-page.tsx"),
    route("verify-user/:email", "routes/verify-user-page.tsx"),
    route("logout", "routes/logout-page.tsx"),
    route("auth/success", "routes/auth-success-page.tsx"),
    route("auth/error", "routes/auth-error-page.tsx"),
  ]),

  // Root layout (protected routes - all authenticated users)
  layout("layouts/root-layout.tsx", [
    route("home", "routes/home-page.tsx"),
    route("client-topologies", "routes/client-topologies-page.tsx"),
    route("my-topologies", "routes/my-topologies-page.tsx", {
      id: "my-topologies",
    }),
    route("all-topologies", "routes/all-topologies-page.tsx", {
      id: "all-topologies",
    }),
    route("topology-editor", "routes/topology-editor-page.tsx", {
      id: "topology-editor-new-staff",
    }),
    route(
      "topology-editor/:topologyId",
      "routes/topology-editor-page.tsx",
      { id: "topology-editor-edit-staff" },
    ),
    route("topology/import-pdf", "routes/pdf-import-page.tsx"),
    route("topology-view/:topologyId", "routes/topology-view-page.tsx"),
    route("form/service", "routes/form/service-form-page.tsx"),
    // Technician-facing view of their own submitted forms. Same pages as the
    // admin list/detail, mounted outside the admin panel so the service-form
    // portal (servisform.<your-domain>) can reach them.
    route("form/my-forms", "routes/form/service-forms-list-page.tsx", {
      id: "my-service-forms",
    }),
    route("form/my-forms/:id", "routes/form/service-form-detail-page.tsx", {
      id: "my-service-form-detail",
    }),
  ]),

  // Admin layout (protected routes)
  layout("layouts/admin-layout.tsx", [
    route("admin", "routes/admin-dashboard-page.tsx"),
    route("admin/users", "routes/users-page.tsx"),
    route("admin/users/:username", "routes/profile-page.tsx"),
    route("admin/users/new", "routes/add-user-page.tsx"),
    route("admin/service-forms", "routes/form/service-forms-list-page.tsx"),
    route("admin/service-forms/:id", "routes/form/service-form-detail-page.tsx"),
    route("admin/email-recipients", "routes/form/email-recipients-page.tsx"),
    route("admin/components", "routes/form/components-admin-page.tsx"),
    route("admin/service-form-templates", "routes/form/service-form-templates-admin-page.tsx"),
    route("admin/customers", "routes/form/customers-admin-page.tsx"),
    route("admin/network-scans", "routes/network-scans-page.tsx"),
    route("admin/backup", "routes/backup-page.tsx"),
    route("admin/storage", "routes/storage-page.tsx"),
    route("admin/server-metrics", "routes/server-metrics-page.tsx"),
    // route("admin/topology-viewer", "routes/topology-viewer-page.tsx"),
  ]),

  // Profile layout (protected routes)
  layout("layouts/profile-layout.tsx", [
    route("profile/settings", "routes/settings-page.tsx"),
  ]),
] satisfies RouteConfig;
