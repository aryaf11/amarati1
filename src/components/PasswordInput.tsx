"use client";

import { useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/LandingIcons";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  className = "",
  style,
  showLabel = "إظهار كلمة المرور",
  hideLabel = "إخفاء كلمة المرور",
  ...rest
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`w-full rounded-xl border px-3 py-2.5 pe-11 text-sm outline-none transition focus:ring-2 ${className}`}
        style={{
          backgroundColor: "var(--field-bg)",
          borderColor: "var(--field-border)",
          color: "var(--foreground)",
          ...style,
        }}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute end-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-lg text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
        title={show ? hideLabel : showLabel}
        aria-label={show ? hideLabel : showLabel}
        aria-pressed={show}
        tabIndex={-1}
      >
        {show ? <EyeIcon /> : <EyeOffIcon />}
      </button>
    </div>
  );
}
