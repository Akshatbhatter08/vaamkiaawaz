export type PenNameDisplayMode = "alongside" | "only";

export type PenNameSettings = {
  penNameEnabled: boolean;
  penName: string;
  penNameDisplayMode: PenNameDisplayMode;
};

export function parsePenNameFromPermissions(
  permissions: Record<string, unknown> | null | undefined,
): PenNameSettings {
  return {
    penNameEnabled: permissions?.penNameEnabled === true,
    penName: typeof permissions?.penName === "string" ? permissions.penName.trim() : "",
    penNameDisplayMode: permissions?.penNameDisplayMode === "only" ? "only" : "alongside",
  };
}

export function formatAuthorDisplayName(authorName: string, settings: PenNameSettings): string {
  const base = authorName.trim();
  if (!settings.penNameEnabled) {
    return base;
  }
  const pen = settings.penName.trim();
  if (!pen) {
    return base;
  }
  if (settings.penNameDisplayMode === "only") {
    return pen;
  }
  if (!base) {
    return pen;
  }
  return `${base} '${pen}'`;
}

export function resolveAuthorListName(
  permissions: Record<string, unknown>,
  masterFallbackName = "",
): string {
  const authorName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
  const base = authorName || masterFallbackName.trim();
  return formatAuthorDisplayName(base, parsePenNameFromPermissions(permissions));
}

export function postAuthorMatchesUser(
  permissions: Record<string, unknown>,
  postAuthor: string,
  masterFallbackName = "",
): boolean {
  const displayName = resolveAuthorListName(permissions, masterFallbackName);
  if (!displayName) {
    return false;
  }
  const authorName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
  const base = authorName || masterFallbackName.trim();
  const pen = parsePenNameFromPermissions(permissions).penName.trim();
  const normalizedPost = postAuthor.trim().toLowerCase();
  return (
    normalizedPost === displayName.toLowerCase() ||
    (base.length > 0 && normalizedPost === base.toLowerCase()) ||
    (pen.length > 0 && normalizedPost === pen.toLowerCase())
  );
}
