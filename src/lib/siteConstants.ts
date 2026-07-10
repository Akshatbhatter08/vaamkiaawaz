export const SITE_TAGLINE_LINES = [
  "अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ,",
  "न्याय, समानता और प्रगति में हैं विश्वास तो — उठो ! बोलो ! बदलो !",
] as const;

export const SITE_TAGLINE = SITE_TAGLINE_LINES.join(" ");

export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@VaamKiAawaz";
export const LIVE_COVERAGE_URL = "https://www.youtube.com/@VaamKiAawaz/live";

export const formatBilingualDate = () => {
  const now = new Date();
  const hindi = now.toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
  const english = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
  return `${hindi} | ${english}`;
};

export function formatUploaderDisplay(
  uploaderName: string | null | undefined,
  author?: string,
): string {
  if (!uploaderName) return author || "—";
  if (uploaderName === "अज्ञात") return author || "—";
  return uploaderName;
}
