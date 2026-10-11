import type { Route } from "./+types/client-topologies-page";
import TopologyViewer from "~/components/topology-viewer";
import getCurrentUser from "~/functions/get_current_user";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Client Topologies" },
    { name: "description", content: "View client assigned topologies" },
  ];
}

export async function clientLoader() {
  const currentUser = await getCurrentUser();
  return { currentUser };
}

clientLoader.hydrate = true as const;

export default function ClientTopologiesPage({ loaderData }: Route.ComponentProps) {
  return <TopologyViewer currentUser={loaderData?.currentUser} />;
}
