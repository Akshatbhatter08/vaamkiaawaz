const devanagariToLatin: Record<string, string> = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ee",
  "उ": "u",
  "ऊ": "oo",
  "ऋ": "ri",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
  "ा": "aa",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "ृ": "ri",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "ng",
  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "ny",
  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",
  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",
  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",
  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "va",
  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",
  "ं": "n",
  "ँ": "n",
  "ः": "h",
  "्": "",
};

export const transliterate = (text: string): string =>
  text
    .split("")
    .map((char) => devanagariToLatin[char] ?? char)
    .join("")
    .toLowerCase();

export const normalizeForSearch = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeRomanized = (text: string): string =>
  text
    .toLowerCase()
    .replace(/w/g, "v")
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/va\b/g, "v")
    .replace(/\s+/g, " ")
    .trim();

export const stripLatinVowels = (text: string): string => text.replace(/[aeiou]/g, "");

const compactSkeleton = (text: string): string =>
  stripLatinVowels(normalizeRomanized(transliterate(text))).replace(/\s+/g, "");

export const matchesSearch = (fields: string[], query: string): boolean => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return true;

  const q = normalizeForSearch(trimmedQuery);
  const fieldText = fields.join(" ");

  const qLatin = normalizeRomanized(transliterate(trimmedQuery));
  const qRoman = qLatin;
  const qSkeleton = compactSkeleton(trimmedQuery);

  const raw = normalizeForSearch(fieldText);
  const latin = normalizeRomanized(transliterate(fieldText));
  const roman = latin;
  const skeleton = compactSkeleton(fieldText);

  const qCompact = qRoman.replace(/\s+/g, "");
  const romanCompact = roman.replace(/\s+/g, "");

  return (
    raw.includes(q) ||
    latin.includes(q) ||
    latin.includes(qLatin) ||
    roman.includes(qRoman) ||
    romanCompact.includes(qCompact) ||
    skeleton.includes(qSkeleton)
  );
};

export const MIN_SEARCH_LENGTH = 2;
