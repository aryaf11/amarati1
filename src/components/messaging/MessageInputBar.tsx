"use client";

type MessageInputBarProps = {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder: string;
  disabled?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
};

export function MessageInputBar({
  value,
  onChange,
  name = "body",
  placeholder,
  disabled,
  onSubmit,
  submitLabel = "إرسال",
}: MessageInputBarProps) {
  const controlled = value !== undefined && onChange !== undefined;

  return (
    <div
      className="flex items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-sm"
      style={{
        backgroundColor: "var(--field-bg)",
        borderColor: "var(--field-border)",
      }}
    >
      <button
        type={onSubmit ? "button" : "submit"}
        disabled={disabled}
        onClick={onSubmit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-accent transition hover:bg-accent-soft disabled:opacity-40"
        aria-label={submitLabel}
      >
        <SendIcon />
      </button>
      <input
        {...(controlled
          ? { value, onChange: (e) => onChange(e.target.value) }
          : { name })}
        disabled={disabled}
        required={!disabled}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-end text-sm outline-none placeholder:text-muted disabled:opacity-50"
        autoComplete="off"
        onKeyDown={
          onSubmit
            ? (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }
            : undefined
        }
      />
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}
