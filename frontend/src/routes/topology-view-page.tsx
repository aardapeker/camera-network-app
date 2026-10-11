import type { Route } from "./+types/topology-view-page";
import TopologyViewer from "~/components/topology-viewer";
import getMe from "~/functions/get_me";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const currentUser = await getMe();
  return { currentUser, topologyId: params.topologyId as string };
}

clientLoader.hydrate = true as const;

export default function TopologyViewPage({ loaderData }: Route.ComponentProps) {
  const { currentUser, topologyId } = loaderData;
  return <TopologyViewer currentUser={currentUser} initialTopologyId={topologyId} />;
}
