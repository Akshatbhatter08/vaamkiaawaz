import React, { useState, useEffect } from 'react';
import { sanitizeTipTapHtml } from '@/lib/tiptapSanitize';

// Feature flag to quickly toggle XSS sanitization during debugging
export const SANITIZATION_ENABLED = true;

/**
 * Normalizes invisible / non-breaking whitespace in text nodes only.
 * This is NOT XSS protection — use sanitizeTipTapHtml / ArticleRichText for that.
 */
const normalizeText = (text: string): string => {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/\u200B/g, '')
    .replace(/\u00AD/g, '')
    .replace(/\uFEFF/g, '');
};

const normalizeWhitespaceNode = (node: Node, debug: boolean = false) => {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue) {
      const original = node.nodeValue;
      const normalized = normalizeText(original);

      if (debug && original !== normalized) {
        const nbspCount = (original.match(/\u00A0/g) || []).length;
        if (nbspCount > 0) {
          console.log(`[WhitespaceNormalizer] Fixed ${nbspCount} non-breaking spaces in text node.`);
        }
      }

      node.nodeValue = normalized;
    }
  } else {
    node.childNodes.forEach(child => normalizeWhitespaceNode(child, debug));
  }
};

/**
 * Client-only whitespace normalizer (preserves tags). Not an XSS sanitizer.
 * @deprecated Prefer normalizeHtmlWhitespaceClient name; kept as alias for older imports.
 */
export const normalizeHtmlWhitespaceClient = (html: string, debug: boolean = false): string => {
  if (typeof window === 'undefined' || !html) return html;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    normalizeWhitespaceNode(doc.body, debug);

    const children = Array.from(doc.body.childNodes);
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const textContent = el.textContent?.trim() || '';
        const hasMedia = el.querySelector('img, iframe, video, audio, hr');
        if (textContent === '' && !hasMedia) {
          el.remove();
        } else {
          break;
        }
      } else if (child.nodeType === Node.TEXT_NODE) {
        if (!child.nodeValue?.trim()) {
          child.remove();
        } else {
          break;
        }
      }
    }

    return doc.body.innerHTML;
  } catch (e) {
    console.error('[WhitespaceNormalizer] Parsing error:', e);
    return html;
  }
};

/** @deprecated Misleading name — use normalizeHtmlWhitespaceClient. */
export const sanitizeHtmlClient = normalizeHtmlWhitespaceClient;

/**
 * XSS-safe TipTap HTML for article rendering (server allowlist + whitespace normalize).
 */
export const sanitizeArticleHtml = (rawHtml: string, debug: boolean = false): string => {
  if (!rawHtml || !SANITIZATION_ENABLED) return rawHtml || '';
  const cleaned = sanitizeTipTapHtml(rawHtml);
  if (typeof window === 'undefined') return cleaned;
  return normalizeHtmlWhitespaceClient(cleaned, debug);
};

export const useSanitizedHtml = (rawHtml: string, debug: boolean = false) => {
  const [html, setHtml] = useState(() =>
    SANITIZATION_ENABLED ? sanitizeTipTapHtml(rawHtml || '') : rawHtml,
  );

  useEffect(() => {
    if (rawHtml && SANITIZATION_ENABLED) {
      setHtml(sanitizeArticleHtml(rawHtml, debug));
    } else {
      setHtml(rawHtml);
    }
  }, [rawHtml, debug]);

  return html;
};

export const SanitizedHtml = ({ html, className, style, debug = false }: { html: string, className?: string, style?: React.CSSProperties, debug?: boolean }) => {
  const sanitized = useSanitizedHtml(html, debug);
  return (
    <div
      className={className}
      style={style}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

export const ARTICLE_RICH_TEXT_CLASS = "article-body ql-editor prose max-w-none";

export const ARTICLE_RICH_TEXT_STYLE: React.CSSProperties = {
  padding: 0,
  maxWidth: "100%",
  overflowX: "clip",
  whiteSpace: "pre-wrap",
};

export const ArticleRichText = ({
  html,
  className,
  style,
  debug = false,
}: {
  html: string;
  className?: string;
  style?: React.CSSProperties;
  debug?: boolean;
}) => (
  <SanitizedHtml
    html={html}
    className={className ? `${ARTICLE_RICH_TEXT_CLASS} ${className}` : ARTICLE_RICH_TEXT_CLASS}
    style={{ ...ARTICLE_RICH_TEXT_STYLE, ...style }}
    debug={debug}
  />
);
