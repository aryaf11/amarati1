import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function SignupCreatePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  redirect("/signup/join");
}
