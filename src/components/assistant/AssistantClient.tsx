"use client";

import { useState, useTransition } from "react";
import { chatbotReplyAction } from "@/actions/chatbot";
import { ConversationHeader } from "@/components/conversations/ConversationHeader";

const accentMaroon = "#5C2E35";
const quickActionBg = "#B8B8B8";
const screenBg = "#F3F3F3";

type AssistantStrings = {
  title: string;
  welcomeUser: string;
  roleOwner: string;
  roleTenant: string;
  welcomeMessage: string;
  quickStatus: string;
  quickMaintenance: string;
  quickNextVisit: string;
  placeholder: string;
  demoReply: string;
};

type Line = { isUser: boolean; text: string };

export function AssistantClient({
  buildingId,
  userName,
  isOwner,
  strings,
}: {
  buildingId: string;
  userName: string;
  isOwner: boolean;
  strings: AssistantStrings;
}) {
  const [text, setText] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pending, start] = useTransition();

  const quickPrompts = [
    strings.quickStatus,
    strings.quickMaintenance,
    strings.quickNextVisit,
  ];

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

  const welcomeLine = strings.welcomeUser.replace("{name}", userName);
  const roleLine = isOwner ? strings.roleOwner : strings.roleTenant;

  return (
    <div
      className="-mx-4 flex min-h-[min(720px,calc(100dvh-10rem))] flex-col sm:-mx-6"
      style={{ backgroundColor: screenBg }}
    >
      <ConversationHeader
        backHref={`/building/${buildingId}`}
        welcomeLine={welcomeLine}
        roleLine={roleLine}
        screenTitle={strings.title}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-2">
          <div
            className="w-full rounded-[20px] px-4 py-4 text-[15px] leading-[1.55] text-white shadow-md"
            style={{ backgroundColor: accentMaroon }}
          >
            <p className="whitespace-pre-line text-end">{strings.welcomeMessage}</p>
          </div>
          <div className="space-y-2.5 pt-1">
            {quickPrompts.map((label) => (
              <button
                key={label}
                type="button"
                disabled={pending}
                onClick={() => sendMessage(label)}
                className="w-full rounded-[14px] px-4 py-3.5 text-center text-[15px] font-semibold text-white transition hover:brightness-95 disabled:opacity-60"
                style={{ backgroundColor: quickActionBg }}
              >
                {label}
              </button>
            ))}
          </div>
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex ${line.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className="max-w-[88%] rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed shadow-sm"
                style={{
                  backgroundColor: line.isUser ? "#ffffff" : accentMaroon,
                  color: line.isUser ? "rgba(0,0,0,0.87)" : "#ffffff",
                }}
              >
                <p className="whitespace-pre-line text-end">{line.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form
          className="shrink-0 px-4 pb-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(text);
          }}
        >
          <div className="flex items-center gap-1 rounded-[28px] bg-white px-3 py-1 shadow-md">
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              style={{ color: accentMaroon }}
              aria-label="إرسال"
            >
              <SendIcon />
            </button>
            <button
              type="button"
              disabled={pending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/45 disabled:opacity-40"
              aria-label="تسجيل صوتي"
            >
              <MicIcon />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={pending}
              placeholder={strings.placeholder}
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-end text-sm outline-none placeholder:text-foreground/40 disabled:opacity-50"
              autoComplete="off"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  );
}
