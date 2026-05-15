import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
) {
  const { className = "", variant = "primary", type = "button", style, ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold tracking-tight transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "shadow-md hover:-translate-y-px hover:shadow-lg hover:brightness-105 active:translate-y-0 active:brightness-95"
      : "border-2 shadow-sm hover:bg-[var(--accent-soft)] active:brightness-95";
  const inlineStyle =
    variant === "primary"
      ? {
          backgroundColor: "var(--accent)",
          color: "var(--accent-foreground)",
          ...style,
        }
      : {
          backgroundColor: "var(--card)",
          borderColor: "var(--accent)",
          color: "var(--accent)",
          ...style,
        };
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
  "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2";
const fieldStyle = {
  backgroundColor: "var(--field-bg)",
  borderColor: "var(--field-border)",
  color: "var(--foreground)",
} as const;

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", style, ...rest } = props;
  return (
    <input
      className={`${fieldClass} ${className}`}
      style={{ ...fieldStyle, ...style }}
      {...rest}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", style, ...rest } = props;
  return (
    <textarea
      className={`${fieldClass} ${className}`}
      style={{ ...fieldStyle, ...style }}
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
      className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm backdrop-blur transition hover:shadow-md ${props.className ?? ""}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
        borderColor: "var(--card-border)",
      }}
    >
      {props.title ? (
        <header className="mb-4 flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <h2 className="text-base font-semibold tracking-tight text-accent">
            {props.title}
          </h2>
        </header>
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
      className={`mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] [padding-inline-start:max(1rem,env(safe-area-inset-left,0px))] [padding-inline-end:max(1rem,env(safe-area-inset-right,0px))] sm:px-6 ${className}`}
    >
      {children}
    </main>
  );
}
