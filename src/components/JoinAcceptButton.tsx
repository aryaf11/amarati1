"use client";

import { useState, useTransition } from "react";
import { acceptInviteAction } from "@/actions/invites";
import type { AppLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";
import { Button } from "@/components/ui";

export function JoinAcceptButton(props: { token: string; locale: AppLocale }) {
  const t = ui(props.locale);
  const [err, setErr] = useState<string | null>(null);
  const [p, start] = useTransition();
  return (
    <div>
      {err ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {err}
        </p>
      ) : null}
      <Button
        type="button"
        disabled={p}
        className="w-full"
        onClick={() => {
          setErr(null);
          start(async () => {
            const res = await acceptInviteAction(props.token);
            if (res && "error" in res) setErr(res.error);
          });
        }}
      >
        {t.join.accept}
      </Button>
    </div>
  );
}
