"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { chatbotReplyAction } from "@/actions/chatbot";
import type { AppLocale } from "@/lib/locale";
import { Button, Card, Input } from "@/components/ui";

const labels: Record<
  AppLocale,
  { title: string; back: string; you: string; reply: string; ph: string; send: string }
> = {
  ar: {
    title: "مساعد عَمارتي",
    back: "إغلاق والعودة",
    you: "سؤالك",
    reply: "الرد",
    ph: "اكتب سؤالك...",
    send: "إرسال",
  },
  en: {
    title: "Amarati assistant",
    back: "Close and go back",
    you: "You",
    reply: "Reply",
    ph: "Type your question...",
    send: "Send",
  },
};

export function ChatbotClient({ locale }: { locale: AppLocale }) {
  const L = labels[locale];
  const [text, setText] = useState("");
  const [lines, setLines] = useState<{ q: string; a: string }[]>([]);
  const [p, start] = useTransition();
  return (
    <Card title={L.title}>
      <div className="mb-4 flex justify-end">
        <Link
          href="/"
          className="text-xs font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-400"
        >
          {L.back}
        </Link>
      </div>
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto text-sm">
        {lines.map((l, i) => (
          <div key={i} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60">
            <p className="font-medium text-slate-500">{L.you}</p>
            <p>{l.q}</p>
            <p className="mt-2 font-medium text-teal-800 dark:text-teal-200">{L.reply}</p>
            <p className="whitespace-pre-line">{l.a}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={L.ph}
          disabled={p}
        />
        <Button
          type="button"
          disabled={p || !text.trim()}
          onClick={() => {
            const q = text.trim();
            setText("");
            start(async () => {
              const a = await chatbotReplyAction(q);
              setLines((prev) => [...prev, { q, a }]);
            });
          }}
        >
          {L.send}
        </Button>
      </div>
    </Card>
  );
}
