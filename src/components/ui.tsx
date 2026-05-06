import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const accent = "#157083";

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
) {
  const { className = "", variant = "primary", type = "button", style, ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "text-white shadow-md hover:brightness-105 active:brightness-95"
      : "border-2 bg-white shadow-sm hover:bg-[#f0fffd] active:bg-[#e6faf7] dark:bg-slate-900 dark:hover:bg-slate-800";
  const inlineStyle =
    variant === "primary"
      ? { backgroundColor: accent, ...style }
      : { borderColor: accent, color: accent, ...style };
  return (
    <button
      type={type}
      className={`${base} ${styles} ${className}`}
      style={inlineStyle}
      {...rest}
    />
  );
}

const fieldClass =
  "w-full rounded-xl border border-[#157083]/25 bg-white px-3 py-2.5 text-sm outline-none ring-[#157083]/30 transition focus:border-[#157083]/60 focus:ring-2 dark:border-teal-700/40 dark:bg-slate-900";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${fieldClass} ${className}`} {...rest} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`${fieldClass} ${className}`} {...rest} />;
}

export function Card(props: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#157083]/15 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 ${props.className ?? ""}`}
    >
      {props.title ? (
        <h2
          className="mb-3 text-base font-semibold"
          style={{ color: accent }}
        >
          {props.title}
        </h2>
      ) : null}
      {props.children}
    </section>
  );
}

export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6 ${className}`}
    >
      {children}
    </main>
  );
}
