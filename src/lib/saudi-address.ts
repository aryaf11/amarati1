/** تنسيق العنوان الوطني السعودي في سطر عرض واحد. */
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
  return [
    input.region.trim(),
    input.city.trim(),
    input.district.trim() && `حي ${input.district.trim()}`,
    input.streetName.trim(),
    input.buildingNumber.trim() && `مبنى ${input.buildingNumber.trim()}`,
    input.additionalNumber?.trim() && `إضافي ${input.additionalNumber.trim()}`,
    input.postalCode.trim() && `الرمز البريدي ${input.postalCode.trim()}`,
    input.shortAddressCode?.trim() &&
      `الرمز المختصر ${input.shortAddressCode.trim().toUpperCase()}`,
  ]
    .filter(Boolean)
    .join("، ");
}

export function readNationalAddressFromForm(formData: FormData) {
  return {
    region: String(formData.get("region") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    district: String(formData.get("district") ?? "").trim(),
    streetName: String(formData.get("streetName") ?? "").trim(),
    buildingNumber: String(formData.get("buildingNumber") ?? "").trim(),
    additionalNumber: String(formData.get("additionalNumber") ?? "").trim() || null,
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    shortAddressCode: String(formData.get("shortAddressCode") ?? "").trim() || null,
  };
}

export function isNationalAddressComplete(a: ReturnType<typeof readNationalAddressFromForm>) {
  return (
    a.region.length >= 2 &&
    a.city.length >= 2 &&
    a.district.length >= 1 &&
    a.streetName.length >= 2 &&
    a.buildingNumber.length >= 1 &&
    /^\d{5}$/.test(a.postalCode)
  );
}
