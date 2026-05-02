import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
) {
  const { className = "", variant = "primary", type = "button", ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
      : "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800";
  return (
    <button type={type} className={`${base} ${styles} ${className}`} {...rest} />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...rest}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-500/30 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 ${className}`}
      {...rest}
    />
  );
}

export function Card(props: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-[var(--card)] p-5 shadow-sm dark:border-slate-800 ${props.className ?? ""}`}
    >
      {props.title ? (
        <h2 className="mb-3 text-base font-semibold">{props.title}</h2>
      ) : null}
      {props.children}
    </section>
  );
}
