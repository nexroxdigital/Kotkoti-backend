// ---------------------------------------------
// Mapping: Country Name → Country Code
// ---------------------------------------------
export const countryNameToCode: Record<string, string> = {
  Bangladesh: "BD",
  India: "IN",
  Pakistan: "PK",
  "United States": "US",
  USA: "US",
  America: "US",
  UK: "GB",
  "United Kingdom": "GB",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  Italy: "IT",
  Spain: "ES",
  China: "CN",
  Japan: "JP",
  Korea: "KR",
  "South Korea": "KR",
  "Saudi Arabia": "SA",
  Saudi: "SA",
  UAE: "AE",
  Russia: "RU",
  Brazil: "BR",
  Mexico: "MX",
  Turkey: "TR",
  Indonesia: "ID",
  Malaysia: "MY",
  Nepal: "NP",
  SriLanka: "LK",
  "Sri Lanka": "LK",
  Philippines: "PH",
  Thailand: "TH",
  Egypt: "EG",
  SouthAfrica: "ZA",
  "South Africa": "ZA",
  // add more as needed
};

// ---------------------------------------------
// Normalize user input ("BD", "bd", "Bangladesh")
// → Return uppercase 2-letter ISO code
// ---------------------------------------------
export function normalizeCountry(value?: string | null): string | null {
  if (!value) return null;

  const v = value.trim();

  // Already code (ex: BD, us, In)
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();

  // Full name → convert to code
  const found = countryNameToCode[v] ?? countryNameToCode[capitalize(v)];
  if (found) return found.toUpperCase();

  return null; // Unknown
}

// Helper: Capitalize first letter
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ---------------------------------------------
// Convert ISO code → Emoji Flag
//
// Example: "BD" → 🇧🇩
// ---------------------------------------------
export function countryCodeToFlag(code: string | null): string | null {
  if (!code) return null;

  return code
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
}
