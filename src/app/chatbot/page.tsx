import { TopNav } from "@/components/TopNav";
import { ChatbotClient } from "@/components/ChatbotClient";
import { getLocale } from "@/lib/locale";

export default async function ChatbotPage() {
  const locale = await getLocale();
  return (
    <div className="flex min-h-full flex-col">
      <TopNav />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <ChatbotClient locale={locale} />
      </main>
    </div>
  );
}
