"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type Props = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  variant?: "primary" | "ghost";
} & Omit<ComponentProps<typeof Button>, "type" | "children" | "disabled" | "aria-busy">;

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  variant = "primary",
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      className={className}
      disabled={pending}
      aria-busy={pending}
      {...rest}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
