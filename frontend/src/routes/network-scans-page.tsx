import { toast } from "sonner"
import i18n from "~/lib/i18n"
import type { Route } from "./+types/network-scans-page"
import { NetworkScanTable } from "~/components/table/network-scan-table"
import { getNetworkScans, getNetworkScanSources } from "~/functions/get_network_scans"
import type { NetworkScanHost, PaginationData } from "~/types"

export async function clientLoader({ request }: Route.ClientLoaderArgs): Promise<{
  hosts: NetworkScanHost[]
  paginationData: PaginationData
  sources: string[]
}> {
  try {
    const url = new URL(request.url)
    const page = url.searchParams.get("page")
    const size = url.searchParams.get("size")
    const sortBy = url.searchParams.get("sortBy")
    const sortDirection = url.searchParams.get("sortDirection") as "ASC" | "DESC" | null
    const filterInput = url.searchParams.get("filterInput")
    const filterBy = url.searchParams.get("filterBy") as "all" | "ip" | "hostname" | "vendor" | null
    const sourcesParam = url.searchParams.get("sources")
    const sources = sourcesParam ? sourcesParam.split(",") : null

    const [data, availableSources] = await Promise.all([
      getNetworkScans({ filterInput, filterBy, sources, page, size, sortBy, sortDirection }),
      getNetworkScanSources(),
    ])

    const paginationData: PaginationData = {
      currentPage: data.currentPage,
      hasPrevious: data.hasPrevious,
      hasNext: data.hasNext,
      totalPages: data.totalPages,
      totalItems: data.totalItems,
      pageSize: data.pageSize,
      message: "",
    }

    return { hosts: data.content, paginationData, sources: availableSources }
  } catch (error) {
    toast.error(i18n.t("networkScan.loadFailed"), {
      description: error instanceof Error ? error.message : i18n.t("serviceForm.unknownError"),
    })
    return {
      hosts: [],
      paginationData: {
        currentPage: 0, hasPrevious: false, hasNext: false,
        totalPages: 0, totalItems: 0, pageSize: 25, message: "",
      },
      sources: [],
    }
  }
}

clientLoader.hydrate = true as const

export default function NetworkScansPage({ loaderData }: Route.ComponentProps) {
  const { hosts, paginationData, sources } = loaderData

  return (
    <div className="container mx-auto py-10">
      <NetworkScanTable hosts={hosts} paginationData={paginationData} sources={sources} />
    </div>
  )
}
