export function extractFirstImageFromHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

export function resolvePostImage(
  postImage: string | null | undefined,
  content?: string | null,
): string | null {
  const trimmed = postImage?.trim();
  if (trimmed) return trimmed;
  return extractFirstImageFromHtml(content);
}
