import React from "react"
import { useTranslation } from "react-i18next"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "~/components/ui/breadcrumb"

// Known admin path segments → translation keys; unknown segments fall back to auto-formatting
const SEGMENT_KEYS: Record<string, string> = {
  users: "sidebar.users",
  new: "sidebar.newUser",
  backup: "sidebar.backup",
  storage: "sidebar.storage",
  "server-metrics": "sidebar.serverMetrics",
  "service-forms": "sidebar.serviceForms",
  "email-recipients": "sidebar.emailRecipients",
}

function BreadCrumb({ pathSegments }: { pathSegments: string[] }) {
  const { t } = useTranslation()

  // Generate a readable name from path segment (e.g., "user-management" -> "User Management")
  const formatSegmentName = (segment: string) => {
    if (SEGMENT_KEYS[segment]) return t(SEGMENT_KEYS[segment])
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/admin">{t("breadcrumb.adminDashboard")}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />

        {/* Render breadcrumb items based on path segments */}
        {pathSegments.slice(1).map((segment, index) => (
          <React.Fragment key={segment}>
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem>
              {index === pathSegments.length - 2 ? (
                <BreadcrumbPage>{formatSegmentName(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${pathSegments.slice(0, index + 2).join('/')}`}>
                  {formatSegmentName(segment)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}

      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default BreadCrumb