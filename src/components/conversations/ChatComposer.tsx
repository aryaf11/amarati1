"use client";

import { postChatAction } from "@/actions/social";

const accentMaroon = "#5C2E35";

export function ChatComposer({
  buildingId,
  tab,
  placeholder,
  disabled,
}: {
  buildingId: string;
  tab: string;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={postChatAction}
      className="shrink-0 px-4 pb-4 pt-2"
    >
      <input type="hidden" name="buildingId" value={buildingId} />
      <input type="hidden" name="tab" value={tab} />
      <div className="flex items-center gap-1 rounded-[28px] bg-white px-3 py-1 shadow-md">
        <button
          type="submit"
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
          style={{ color: accentMaroon }}
          aria-label="إرسال"
        >
          <SendIcon />
        </button>
        <button
          type="button"
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/45 disabled:opacity-40"
          aria-label="تسجيل صوتي"
        >
          <MicIcon />
        </button>
        <input
          name="body"
          required={!disabled}
          disabled={disabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-end text-sm outline-none placeholder:text-foreground/40 disabled:opacity-50"
          autoComplete="off"
        />
      </div>
    </form>
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
