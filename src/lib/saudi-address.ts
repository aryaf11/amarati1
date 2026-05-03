/** تنسيق سطر عرض للعنوان الوطني (السعودية) من الحقول المنظمة */
export function formatSaudiNationalAddressLine(input: {
  region: string;
  city: string;
  district: string;
  streetName: string;
  buildingNumber: string;
  additionalNumber?: string | null;
  postalCode: string;
  shortAddressCode?: string | null;
}): string {
  const segments = [
    input.region.trim(),
    input.city.trim(),
    input.district.trim() && `حي ${input.district.trim()}`,
    input.streetName.trim(),
    input.buildingNumber.trim() && `مبنى ${input.buildingNumber.trim()}`,
    input.additionalNumber?.trim() && `الرقم الإضافي ${input.additionalNumber.trim()}`,
    input.postalCode.trim() && `الرمز البريدي ${input.postalCode.trim()}`,
    input.shortAddressCode?.trim() && `الرمز المختصر ${input.shortAddressCode.trim().toUpperCase()}`,
  ].filter(Boolean);
  return segments.join("، ");
}
