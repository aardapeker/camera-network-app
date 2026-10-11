import { Outlet } from "react-router";
import { Header } from "~/components/header";
import getCurrentUser from "~/functions/get_current_user";
import type { Route } from "./+types/profile-layout";
import getMyLoginAttempts from "~/functions/get_my_login_attempts";
import { enforceServicePortal } from "~/lib/service-portal";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const currentUser = await getCurrentUser();

  enforceServicePortal(currentUser?.role, new URL(request.url).pathname);

  const myLoginAttempts = await getMyLoginAttempts();

  return { currentUser, myLoginAttempts };
}

function ProfileLayout({ loaderData, actionData }: Route.ComponentProps) {
  const { currentUser, myLoginAttempts } = loaderData;

  return (
    <div className="flex flex-col min-h-screen">
      <Header userData={currentUser} isAdmin={currentUser.isAdmin} />
      <main className="flex-1">
        <Outlet context={{ userData: currentUser, myLoginAttempts }} />
      </main>
    </div>
  );
}

export default ProfileLayout;
