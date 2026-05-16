import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardNewBuildingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  redirect("/dashboard");
}
