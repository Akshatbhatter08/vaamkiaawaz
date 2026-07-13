import { randomInt } from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function parseUserPermissions(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }
  return input as Record<string, unknown>;
}

export function getContributorCodeFromPermissions(
  permissions: Record<string, unknown>,
): string {
  const code = typeof permissions.contributorCode === "string" ? permissions.contributorCode.trim() : "";
  return code;
}

export function generateContributorCode(): string {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[randomInt(0, CODE_CHARS.length)];
  }
  return `VKA-${suffix}`;
}

export function isContributorCode(value: string): boolean {
  return /^VKA-[A-Z0-9]{4,8}$/.test(value.trim());
}
