import { Input } from "@/components/ui";
import type { AppLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export function NationalAddressFields({ locale }: { locale: AppLocale }) {
  const t = ui(locale).dashboard;
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">{t.nationalAddressHelp}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted">{t.region}</label>
          <Input name="region" required placeholder={t.regionPh} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.city}</label>
          <Input name="city" required placeholder={t.cityPh} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.district}</label>
          <Input name="district" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.streetName}</label>
          <Input name="streetName" required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.buildingNumber}</label>
          <Input name="buildingNumber" required dir="ltr" className="text-left" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.additionalNumber}</label>
          <Input name="additionalNumber" dir="ltr" className="text-left" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.postalCode}</label>
          <Input
            name="postalCode"
            required
            minLength={5}
            maxLength={5}
            pattern="[0-9]{5}"
            dir="ltr"
            className="text-left"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">{t.shortAddressCode}</label>
          <Input
            name="shortAddressCode"
            maxLength={8}
            dir="ltr"
            className="text-left uppercase"
          />
        </div>
      </div>
    </div>
  );
}
