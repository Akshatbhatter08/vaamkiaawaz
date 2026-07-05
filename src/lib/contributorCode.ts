const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateContributorCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `VKA-${suffix}`;
}

export function isContributorCode(value: string): boolean {
  return /^VKA-[A-Z0-9]{4,8}$/.test(value.trim());
}
