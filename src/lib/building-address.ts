import {
  formatSaudiNationalAddressLine,
  isNationalAddressComplete,
  readNationalAddressFromForm,
} from "@/lib/saudi-address";

export function buildingAddressFromForm(formData: FormData) {
  const na = readNationalAddressFromForm(formData);
  if (!isNationalAddressComplete(na)) return null;
  const address = formatSaudiNationalAddressLine(na);
  return { ...na, address, city: na.city };
}
