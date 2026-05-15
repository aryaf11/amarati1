"use client";

import { useId, useState } from "react";

const MAX_DATA_URL = 280_000;

export function ProfileAvatarField({
  label,
  initial,
}: {
  label: string;
  initial: string | null;
}) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(initial);
  const [hiddenValue, setHiddenValue] = useState(initial ?? "");

  return (
    <div className="space-y-2">
      <input type="hidden" name="avatarUrl" value={hiddenValue} />
      <div className="flex flex-wrap items-center gap-4">
        <span
          className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-xs text-muted"
          style={{ borderColor: "var(--card-border)", backgroundColor: "var(--accent-soft)" }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <span>—</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="mb-1 block text-xs text-muted">
            {label}
          </label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full max-w-xs text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 220 * 1024) {
                alert(
                  label.startsWith("ص")
                    ? "الصورة كبيرة جداً (الحدّ حوالي 200 كيلوبايت)."
                    : "Image is too large (about 200 KB max).",
                );
                e.target.value = "";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = String(reader.result ?? "");
                if (dataUrl.length > MAX_DATA_URL) {
                  alert(
                    label.startsWith("ص")
                      ? "تعذّر حفظ الصورة بحجمها الحالي."
                      : "Could not store this image at its current size.",
                  );
                  return;
                }
                setHiddenValue(dataUrl);
                setPreview(dataUrl);
              };
              reader.readAsDataURL(f);
            }}
          />
        </div>
      </div>
    </div>
  );
}
