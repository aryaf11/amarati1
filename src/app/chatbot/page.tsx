import { redirect } from "next/navigation";
import { TopNav } from "@/components/TopNav";
import { ChatbotClient } from "@/components/ChatbotClient";
import { PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/current-user";
import { getLocale } from "@/lib/locale";

export default async function ChatbotPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/chatbot");
  const locale = await getLocale();
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <PageShell className="max-w-xl">
        <ChatbotClient locale={locale} />
      </PageShell>
    </div>
  );
}
