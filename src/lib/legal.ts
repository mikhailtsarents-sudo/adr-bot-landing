export const legalContact = {
  businessName: "ADR Bot / [Name einsetzen]",
  ownerName: "[Vollständiger Name einsetzen]",
  street: "[Straße und Hausnummer einsetzen]",
  postalCode: "[PLZ einsetzen]",
  city: "[Ort einsetzen]",
  country: "Deutschland",
  email: "[E-Mail einsetzen]",
  phone: "[Telefon optional einsetzen]",
  responsiblePerson: "[Verantwortliche Person einsetzen]",
  lastUpdated: "2026-04-08",
};

export function hasValue(value: string) {
  return !value.includes("[");
}
