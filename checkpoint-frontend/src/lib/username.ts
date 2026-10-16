export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

const FULL = /^(?=.{3,20}$)[A-Za-z0-9]+([._][A-Za-z0-9]+)*$/;
const ALLOWED_CHARS = /^[A-Za-z0-9._]+$/;
const RESERVED = new Set([
  "admin", "administrator", "root", "system", "support", "help", "checkpoint",
  "moderator", "staff", "null", "undefined", "me", "api", "login", "register",
]);

export const USERNAME_RULES = [
  "3 to 20 characters",
  "Letters, numbers, dots (.) and underscores (_) only",
  "No spaces; dots and underscores must sit between letters or numbers",
  "Not case-sensitive: Sam and sam count as the same name",
];

export function validateUsername(value: string): string | null {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.`;
  }
  if (!ALLOWED_CHARS.test(value)) {
    return "Only letters, numbers, dots and underscores are allowed. No spaces.";
  }
  if (!FULL.test(value)) {
    return "Dots and underscores must sit between letters or numbers (not at the start, the end, or doubled).";
  }
  if (RESERVED.has(value.toLowerCase())) return "That username is reserved.";
  return null;
}
