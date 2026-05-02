"use client";

import { useState, useTransition } from "react";
import { createInviteLinkAction } from "@/actions/invites";
import { Button, Card } from "@/components/ui";

export function InvitePanel(props: {
  buildingId: string;
  canInviteTenant: boolean;
  canInviteOwner: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card title="رابط دعوة (لوحدة شقتك الحالية)">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
        أي عضو يمكنه نسخ الرابط ومشاركته. المستأجر لا يملك خيار إضافة مستأجرين آخرين بعد
        انضمامه.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setErr(null);
          setUrl(null);
          const fd = new FormData(e.currentTarget);
          start(async () => {
            const res = await createInviteLinkAction(fd);
            if ("error" in res && res.error) setErr(res.error);
            else if ("ok" in res && res.ok) setUrl(res.url);
          });
        }}
      >
        <input type="hidden" name="buildingId" value={props.buildingId} />
        <div>
          <label className="mb-1 block text-xs text-slate-500">نوع المدعو</label>
          <select
            name="kind"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            {props.canInviteTenant ? (
              <option value="TENANT">مستأجر لنفس الشقة</option>
            ) : null}
            {props.canInviteOwner ? (
              <option value="OWNER">مالك مشارك (نفس الشقة)</option>
            ) : null}
          </select>
        </div>
        {err ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </p>
        ) : null}
        {url ? (
          <p className="break-all rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
            {url}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full">
          إنشاء رابط
        </Button>
      </form>
    </Card>
  );
}
