import { NextResponse } from "next/server";

const LEFT_KEYWORDS = [
  "communist",
  "socialist",
  "marx",
  "lenin",
  "labour",
  "labor",
  "union",
  "strike",
  "revolution",
  "soviet",
  "worker",
  "left",
  "progressive",
  "independence",
  "freedom",
  "civil rights",
  "protest",
  "movement",
  "भारतीय",
  "कम्युनिस्ट",
  "साम्यवाद",
  "मजदूर",
  "श्रमिक",
  "आंदोलन",
  "हड़ताल",
  "स्वतंत्रता",
  "न्याय",
  "समानता",
];

type WikiEvent = {
  year: number;
  text: string;
  pages?: { titles?: { normalized?: string } }[];
};

function scoreEvent(text: string): number {
  const lower = text.toLowerCase();
  return LEFT_KEYWORDS.reduce((score, keyword) => {
    return lower.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

export async function GET() {
  try {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
      { next: { revalidate: 3600 } },
    );

    if (!res.ok) {
      return NextResponse.json({
        title: "आज का इतिहास",
        date: now.toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
        description: "इस तिथि का ऐतिहासिक विवरण अभी उपलब्ध नहीं है।",
        year: null,
        source: "Wikipedia",
      });
    }

    const data = (await res.json()) as { events?: WikiEvent[] };
    const events = data.events ?? [];

    const ranked = [...events]
      .map((event) => ({ event, score: scoreEvent(event.text) }))
      .sort((a, b) => b.score - a.score || b.event.year - a.event.year);

    const picked = ranked.find((item) => item.score > 0)?.event ?? events[0];

    if (!picked) {
      return NextResponse.json({
        title: "आज का इतिहास",
        date: now.toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
        description: "इस तिथि पर कोई प्रमुख ऐतिहासिक घटना नहीं मिली।",
        year: null,
        source: "Wikipedia",
      });
    }

    const wikiTitle = picked.pages?.[0]?.titles?.normalized;
    const wikiUrl = wikiTitle
      ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replace(/ /g, "_"))}`
      : null;

    return NextResponse.json({
      title: "आज का इतिहास",
      date: now.toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" }),
      year: picked.year,
      description: picked.text.replace(/<[^>]*>/g, ""),
      wikiUrl,
      source: "Wikipedia",
    });
  } catch {
    return NextResponse.json(
      { error: "ऐतिहासिक घटना लोड नहीं हो सकी।" },
      { status: 500 },
    );
  }
}
