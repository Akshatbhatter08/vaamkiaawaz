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
  return `${base} '${pen}'`;
}

export function postAuthorMatchesUser(
  permissions: Record<string, unknown>,
  postAuthor: string,
): boolean {
  const authorName = typeof permissions.authorName === "string" ? permissions.authorName.trim() : "";
  if (!authorName) {
    return false;
  }
  const penSettings = parsePenNameFromPermissions(permissions);
  const displayName = formatAuthorDisplayName(authorName, penSettings);
  const normalizedPost = postAuthor.trim().toLowerCase();
  return (
    normalizedPost === authorName.toLowerCase() ||
    normalizedPost === displayName.toLowerCase()
  );
}
