import { createHash, timingSafeEqual } from "crypto";
import sanitizeHtml from "sanitize-html";

/** Max stored article HTML length (chars). */
export const MAX_BLOG_CONTENT_LENGTH = 500_000;
export const MAX_BLOG_EXCERPT_LENGTH = 20_000;
export const MAX_BLOG_TITLE_LENGTH = 500;

const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "youtu.be",
]);

const VIMEO_HOSTS = new Set(["player.vimeo.com", "vimeo.com", "www.vimeo.com"]);

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value, "https://vaamkiaawaz.local");
    if (url.protocol === "http:" || url.protocol === "https:") return true;
    if (url.protocol === "mailto:" || url.protocol === "tel:") return true;
    return false;
  } catch {
    return false;
  }
}

function isAllowedIframeSrc(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (YOUTUBE_HOSTS.has(host)) return true;
    if (VIMEO_HOSTS.has(host)) return true;
    return false;
  } catch {
    return false;
  }
}

function isAllowedImageSrc(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/api/media/") || value.startsWith("data:image/")) return true;
  if (value.startsWith("/")) return true; // relative site paths
  return isSafeHttpUrl(value) && !/^javascript:/i.test(value);
}

/**
 * TipTap-safe HTML allowlist for blog content.
 * Strips scripts, event handlers, javascript: URLs, and non-YouTube/Vimeo iframes.
 */
export function sanitizeTipTapHtml(dirty: string): string {
  if (!dirty) return "";

  return sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "hr",
      "div",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "del",
      "blockquote",
      "pre",
      "code",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "iframe",
      "figure",
      "figcaption",
      "sub",
      "sup",
      "mark",
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel", "title", "class", "style"],
      img: ["src", "alt", "title", "width", "height", "class", "style"],
      iframe: [
        "src",
        "width",
        "height",
        "frameborder",
        "allow",
        "allowfullscreen",
        "class",
        "style",
        "title",
        "referrerpolicy",
      ],
      "*": ["class", "style", "data-*", "id", "dir", "lang"],
      p: ["class", "style", "dir", "align"],
      div: ["class", "style", "dir"],
      span: ["class", "style", "color", "face", "size"],
      h1: ["class", "style", "align"],
      h2: ["class", "style", "align"],
      h3: ["class", "style", "align"],
      h4: ["class", "style", "align"],
      h5: ["class", "style", "align"],
      h6: ["class", "style", "align"],
      li: ["class", "style"],
      ul: ["class", "style"],
      ol: ["class", "style", "start"],
      blockquote: ["class", "style"],
      mark: ["class", "style"],
    },
    allowedStyles: {
      "*": {
        color: [/^.*$/],
        "background-color": [/^.*$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-size": [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
        "font-family": [/^.*$/],
        "font-weight": [/^.*$/],
        "line-height": [/^.*$/],
        "text-decoration": [/^.*$/],
        width: [/^\d+(?:\.\d+)?(?:px|%|em|rem|auto)?$/],
        height: [/^\d+(?:\.\d+)?(?:px|%|em|rem|auto)?$/],
        "max-width": [/^\d+(?:\.\d+)?(?:px|%|em|rem)?$/],
        margin: [/^.*$/],
        "margin-left": [/^.*$/],
        "margin-right": [/^.*$/],
        "margin-top": [/^.*$/],
        "margin-bottom": [/^.*$/],
        padding: [/^.*$/],
        display: [/^block$/, /^inline$/, /^inline-block$/, /^flex$/],
        float: [/^left$/, /^right$/, /^none$/],
      },
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        if (!href || /^javascript:/i.test(href) || href.trim().toLowerCase().startsWith("data:")) {
          const { href: _omit, ...rest } = attribs;
          return { tagName, attribs: rest };
        }
        if (!isSafeHttpUrl(href) && !href.startsWith("#") && !href.startsWith("/")) {
          const { href: _omit, ...rest } = attribs;
          return { tagName, attribs: rest };
        }
        const next = { ...attribs };
        if (next.target === "_blank") {
          next.rel = "noopener noreferrer";
        }
        return { tagName, attribs: next };
      },
      img: (tagName, attribs) => {
        const src = attribs.src || "";
        if (!isAllowedImageSrc(src)) {
          return { tagName: "span", attribs: {} };
        }
        return { tagName, attribs };
      },
      iframe: (tagName, attribs) => {
        const src = attribs.src || "";
        if (!isAllowedIframeSrc(src)) {
          return { tagName: "span", attribs: {} };
        }
        return {
          tagName,
          attribs: {
            ...attribs,
            src,
            frameborder: attribs.frameborder || "0",
            allowfullscreen: "true",
            referrerpolicy: "strict-origin-when-cross-origin",
          },
        };
      },
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "script" || frame.tag === "object" || frame.tag === "embed" || frame.tag === "form") {
        return true;
      }
      return false;
    },
  });
}

/** Safer cleanup for short HTML snippets (excerpts). */
export function sanitizeExcerptHtml(dirty: string): string {
  if (!dirty) return "";
  return sanitizeHtml(dirty, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "span"],
    allowedAttributes: {
      span: ["class", "style"],
      p: ["class", "style"],
    },
    allowedStyles: {
      "*": {
        color: [/^.*$/],
        "font-weight": [/^.*$/],
      },
    },
    allowProtocolRelative: false,
  });
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Basic password rules: min 8 chars, letter + digit. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
