/**
 * VaamKiAawaz Design System Utilities
 * Shared functions used across all pages
 */

/**
 * Format view/click counts without currency symbols
 * Fixes the ₹ symbol bug from toLocaleString('hi-IN')
 */
export function formatViews(n: number | string): string {
  const num = parseInt(String(n));
  if (isNaN(num)) return '0';
  if (num >= 10000) return Math.floor(num / 1000) + 'k';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

/**
 * Hindi relative time — precise version
 * Replaces vague "कुछ मिनट पहले" with exact counts
 */
export function hindiRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'अभी';
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'अभी';
  if (diffMins < 60) return `${diffMins} मिनट पहले`;
  if (diffHours < 24) return `${diffHours} घंटे पहले`;
  if (diffDays === 1) return 'कल';
  if (diffDays < 7) return `${diffDays} दिन पहले`;
  return date.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Map CMS category slugs/names to CSS class names
 */
export function getCategoryClass(slug: string): string {
  const map: Record<string, string> = {
    'jansangharsh': 'cat-jansangharsh',
    'jan-sangharsh': 'cat-jansangharsh',
    'jan sangharsh': 'cat-jansangharsh',
    'जन संघर्ष': 'cat-jansangharsh',
    'जन-संघर्ष': 'cat-jansangharsh',
    'rashtriya': 'cat-rashtriya',
    'national': 'cat-rashtriya',
    'राष्ट्रीय': 'cat-rashtriya',
    'rajya': 'cat-rajya',
    'state': 'cat-rajya',
    'राज्य': 'cat-rajya',
    'blog': 'cat-blog',
    'ब्लॉग': 'cat-blog',
    'vichar': 'cat-vichar',
    'opinion': 'cat-vichar',
    'विचार': 'cat-vichar',
    'संपादकीय': 'cat-vichar',
    'atithi': 'cat-atithi',
    'अतिथि': 'cat-atithi',
    'अतिथि लेखन': 'cat-atithi',
    'mazdoor': 'cat-mazdoor',
    'labour': 'cat-mazdoor',
    'मज़दूर': 'cat-mazdoor',
    'मज़दूर-किसान': 'cat-mazdoor',
    'shiksha': 'cat-shiksha',
    'education': 'cat-shiksha',
    'शिक्षा': 'cat-shiksha',
    'छात्र-युवा': 'cat-shiksha',
    'mahila': 'cat-mahila',
    'women': 'cat-mahila',
    'महिला': 'cat-mahila',
    'महिला मुद्दे': 'cat-mahila',
    'आधी आबादी': 'cat-mahila',
    'andolan': 'cat-andolan',
    'आंदोलन': 'cat-andolan',
    'rajniti': 'cat-rajniti',
    'politics': 'cat-rajniti',
    'राजनीति': 'cat-rajniti',
    'साहित्य-संस्कृति': 'cat-vichar',
    'पर्यावरण': 'cat-rashtriya',
    'अंतर्राष्ट्रीय': 'cat-rajya',
    'इतिहास-विमर्श': 'cat-vichar',
    'कला-संस्कृति': 'cat-vichar',
    'विविध': 'cat-default',
  };
  const key = slug?.trim();
  // Direct match
  if (key && map[key]) return map[key];
  // Case-insensitive match
  const lowerKey = key?.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lowerKey) return v;
  }
  return 'cat-default';
}

/**
 * Estimate reading time from HTML content
 */
export function readingTime(html: string): number {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Clean HTML: strip zero-width chars and normalize spaces
 */
export function cleanHtml(html: string | undefined | null): string {
  if (!html) return '';
  return html
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00A0/g, ' ');
}

/**
 * Format date for display
 */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Get today's date in Hindi
 */
export function getTodayHindi(): string {
  return new Date().toLocaleDateString('hi-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Speak Hindi text using the best available browser voice
 */
// Warm up the voice list early. Chrome populates voices asynchronously, so we
// prime getVoices() and cache via the voiceschanged event. This way the list is
// ready by the time the user clicks, and we can speak synchronously in the
// click handler (Chrome ignores speak() calls made outside a user gesture).
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && window.speechSynthesis) {
  const refreshVoices = () => {
    const v = window.speechSynthesis.getVoices();
    if (v.length) cachedVoices = v;
  };
  refreshVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

// Split into short, sentence-sized chunks. Chrome silently fails to speak (or
// cuts off after ~15s on) long single utterances, while Firefox handles them.
// Queuing many short utterances avoids this entirely.
function chunkForSpeech(text: string): string[] {
  const pieces = text.match(/[^।.!?\n]+[।.!?\n]*/g) || [text];
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if ((current + piece).length > 180 && current) {
      chunks.push(current.trim());
      current = piece;
    } else {
      current += piece;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

let lastSpokenText = "";
let keepAlive: ReturnType<typeof setInterval> | null = null;
function stopKeepAlive() {
  if (keepAlive) {
    clearInterval(keepAlive);
    keepAlive = null;
  }
}

export function speakHindiText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;

  // Recover the engine if a previous run left it paused/stuck (Chrome quirk)
  if (synth.paused) synth.resume();

  // Toggle off if the same text is already being spoken
  if (synth.speaking || synth.pending) {
    stopKeepAlive();
    synth.cancel();
    if (lastSpokenText === text) {
      lastSpokenText = "";
      return;
    }
  }

  lastSpokenText = text;

  const voices = cachedVoices.length ? cachedVoices : synth.getVoices();
  const hindiVoices = voices.filter(v => v.lang.toLowerCase().includes("hi"));

  const preferredVoices = ["swara", "madhur", "lekha", "hemant", "kalpana", "google"];
  const pickByName = (list: SpeechSynthesisVoice[]) => {
    for (const pref of preferredVoices) {
      const found = list.find(v => v.name.toLowerCase().includes(pref));
      if (found) return found;
    }
    return undefined;
  };
  // Prefer locally-installed voices: Chrome can silently fail on network
  // ("online"/Google) voices when they're unavailable.
  const localHindi = hindiVoices.filter(v => v.localService);
  const selectedVoice =
    pickByName(localHindi) ||
    localHindi[0] ||
    pickByName(hindiVoices) ||
    hindiVoices[0];

  const chunks = chunkForSpeech(text.slice(0, 8000));
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "hi-IN";
    u.rate = 0.85;
    if (selectedVoice) u.voice = selectedVoice;
    if (i === chunks.length - 1) {
      u.onend = stopKeepAlive;
      u.onerror = stopKeepAlive;
    }
    // Speak synchronously within the user gesture — deferring (setTimeout /
    // voiceschanged) silently fails in Chrome.
    synth.speak(u);
  });

  // Keep-alive: defeats Chrome's bug where speech halts after ~15s.
  stopKeepAlive();
  keepAlive = setInterval(() => {
    if (!synth.speaking) {
      stopKeepAlive();
      return;
    }
    synth.pause();
    synth.resume();
  }, 9000);
}

