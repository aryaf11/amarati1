import { redirect } from "next/navigation";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const qs = sp.error ? `?error=${encodeURIComponent(sp.error)}` : "";
  redirect(`/signup${qs}`);
}
