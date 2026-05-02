"use client";

import { useState, useTransition } from "react";
import { chatbotReplyAction } from "@/actions/chatbot";
import { Button, Card, Input } from "@/components/ui";

export function ChatbotClient() {
  const [text, setText] = useState("");
  const [lines, setLines] = useState<{ q: string; a: string }[]>([]);
  const [p, start] = useTransition();
  return (
    <Card title="مساعد عمارتي">
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto text-sm">
        {lines.map((l, i) => (
          <div key={i} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60">
            <p className="font-medium text-slate-500">سؤالك</p>
            <p>{l.q}</p>
            <p className="mt-2 font-medium text-teal-800 dark:text-teal-200">الرد</p>
            <p className="whitespace-pre-line">{l.a}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب سؤالك..."
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
          إرسال
        </Button>
      </div>
    </Card>
  );
}
