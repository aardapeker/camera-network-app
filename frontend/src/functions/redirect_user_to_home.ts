// Not used
import { redirect } from "react-router";
import { getAdminStatus } from "./get_admin_status";

type IsAdmin = boolean;

export async function redirectUserToHome() {
  let isAdmin: IsAdmin = false;

  isAdmin = await getAdminStatus();

  if (!isAdmin) {
    throw redirect(`/home`);
  }

  return true;
}
