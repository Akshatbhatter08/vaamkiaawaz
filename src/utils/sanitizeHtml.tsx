import React, { useState, useEffect } from 'react';

// Feature flag to quickly toggle sanitization during debugging
export const SANITIZATION_ENABLED = true;

/**
 * Intelligent whitespace normalizer.
 * Replaces problematic invisible characters and converts Non-Breaking Spaces
 * to Standard Spaces. Because we use `white-space: pre-wrap` in CSS, 
 * Standard Spaces will retain their exact width and sequential spacing 
 * (preserving intentional indents), but will safely wrap at the end of lines!
 */
const normalizeText = (text: string): string => {
  return text
    .replace(/\u00A0/g, ' ')  // Convert Non-Breaking Space to Standard Space
    .replace(/\u200B/g, '')   // Strip Zero Width Space
    .replace(/\u00AD/g, '')   // Strip Soft Hyphen
    .replace(/\uFEFF/g, '');  // Strip BOM
};

/**
 * Recursive DOM traversal to sanitize ONLY text nodes.
 * This guarantees that <span>, <p>, style attributes, and colors
 * are completely preserved.
 */
const appendStyle = (element: HTMLElement, style: string) => {
  const trimmed = style.trim();
  if (!trimmed) return;
  const existing = element.getAttribute("style")?.trim();
  element.setAttribute("style", existing ? `${existing}; ${trimmed}` : trimmed);
};

/**
 * Restores TipTap resize-image layout on the published page.
 * Saved HTML stores layout in containerstyle/wrapperstyle on <img>, but only
 * the editor node-view applies those as wrapper elements at edit time.
 */
const normalizeArticleImages = (doc: Document) => {
  doc.querySelectorAll("img").forEach((img) => {
    const image = img as HTMLImageElement;
    const containerStyle = (image.getAttribute("containerstyle") || "").trim();
    const wrapperStyle = (image.getAttribute("wrapperstyle") || "").trim();
    const widthAttr = image.getAttribute("width");

    if (!containerStyle && !wrapperStyle && !widthAttr) return;
    if (image.closest("[data-article-img-layout]")) return;

    const widthFromContainer = containerStyle.match(/width:\s*([^;]+)/i)?.[1]?.trim();
    if (widthFromContainer) {
      image.style.width = widthFromContainer;
    } else if (widthAttr) {
      image.style.width = widthAttr.includes("%") ? widthAttr : `${widthAttr}px`;
    }
    image.style.height = "auto";
    image.style.maxWidth = "100%";

    const figure = image.closest("figure");

    if (wrapperStyle) {
      if (figure) {
        appendStyle(figure as HTMLElement, wrapperStyle);
      } else {
        const wrapper = doc.createElement("div");
        wrapper.setAttribute("data-article-img-layout", "wrapper");
        wrapper.setAttribute("style", wrapperStyle);
        image.parentNode?.insertBefore(wrapper, image);
        wrapper.appendChild(image);
      }
    }

    if (containerStyle) {
      const container = doc.createElement("div");
      container.setAttribute("data-article-img-layout", "container");
      container.setAttribute("style", containerStyle);
      image.parentNode?.insertBefore(container, image);
      container.appendChild(image);
    }
  });
};

const sanitizeNode = (node: Node, debug: boolean = false) => {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.nodeValue) {
      const original = node.nodeValue;
      const normalized = normalizeText(original);
      
      if (debug && original !== normalized) {
        const nbspCount = (original.match(/\u00A0/g) || []).length;
        if (nbspCount > 0) {
          console.log(`[Sanitizer] Fixed ${nbspCount} non-breaking spaces in text node.`);
        }
      }
      
      node.nodeValue = normalized;
    }
  } else {
    node.childNodes.forEach(child => sanitizeNode(child, debug));
  }
};

/**
 * DOMParser-based HTML Sanitizer.
 * Works ONLY in the browser.
 */
export const sanitizeHtmlClient = (html: string, debug: boolean = false): string => {
  if (typeof window === 'undefined' || !html || !SANITIZATION_ENABLED) return html;
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    sanitizeNode(doc.body, debug);
    normalizeArticleImages(doc);
    
    // Trim trailing empty paragraphs and line breaks (common Quill artifact)
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
          break; // Stop trimming once we hit actual content
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
    console.error('[Sanitizer] Parsing error:', e);
    return html;
  }
};

/**
 * React Hook for safe isomorphic sanitization.
 * Prevents hydration mismatches by returning the raw HTML during SSR,
 * and swapping to the DOM-sanitized HTML post-hydration.
 */
export const useSanitizedHtml = (rawHtml: string, debug: boolean = false) => {
  const [html, setHtml] = useState(rawHtml);

  useEffect(() => {
    if (rawHtml && SANITIZATION_ENABLED) {
      setHtml(sanitizeHtmlClient(rawHtml, debug));
    } else {
      setHtml(rawHtml);
    }
  }, [rawHtml, debug]);

  return html;
};

/**
 * Convenient wrapper component for rendering sanitized HTML.
 */
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
