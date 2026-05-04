"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

type Props = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  variant?: "primary" | "ghost";
};

export function SubmitButton({ children, pendingLabel, className = "", variant = "primary" }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
