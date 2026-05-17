"use client";

import { useState, useTransition } from "react";
import { chatbotReplyAction } from "@/actions/chatbot";
import { MessageInputBar } from "@/components/messaging/MessageInputBar";
import { Button, Card } from "@/components/ui";

type AssistantStrings = {
  title: string;
  welcomeMessage: string;
  quickStatus: string;
  quickMaintenance: string;
  placeholder: string;
  demoReply: string;
};

type Line = { isUser: boolean; text: string };

export function AssistantClient({ strings }: { strings: AssistantStrings }) {
  const [text, setText] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, start] = useTransition();

  const quickPrompts = [strings.quickStatus, strings.quickMaintenance];

  function sendMessage(q: string) {
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    setText("");
    setLines((prev) => [...prev, { isUser: true, text: trimmed }]);
    start(async () => {
      try {
        const reply = await chatbotReplyAction(trimmed);
        setLines((prev) => [...prev, { isUser: false, text: reply }]);
      } catch {
        setLines((prev) => [...prev, { isUser: false, text: strings.demoReply }]);
      }
    });
  }

  return (
    <Card title={strings.title}>
      <div
        className="rounded-2xl px-4 py-4 text-sm leading-relaxed"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--accent-foreground)",
        }}
      >
        <p className="whitespace-pre-line text-end">{strings.welcomeMessage}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {quickPrompts.map((label) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            disabled={pending}
            className="w-full sm:w-auto sm:flex-1"
            onClick={() => sendMessage(label)}
          >
            {label}
          </Button>
        ))}
      </div>

      {lines.length > 0 ? (
        <div
          className="mt-6 max-h-[min(40vh,20rem)] space-y-3 overflow-y-auto border-t pt-4"
          style={{ borderColor: "var(--card-border)" }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex ${line.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={
                  line.isUser
                    ? {
                        backgroundColor: "var(--accent-soft)",
                        color: "var(--foreground)",
                        border: "1px solid var(--card-border)",
                      }
                    : {
                        backgroundColor: "var(--accent)",
                        color: "var(--accent-foreground)",
                      }
                }
              >
                <p className="whitespace-pre-line text-end">{line.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form
        className="mt-6 border-t pt-4"
        style={{ borderColor: "var(--card-border)" }}
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(text);
        }}
      >
        <MessageInputBar
          value={text}
          onChange={setText}
          placeholder={strings.placeholder}
          disabled={pending}
          onSubmit={() => sendMessage(text)}
        />
      </form>
    </Card>
  );
}
