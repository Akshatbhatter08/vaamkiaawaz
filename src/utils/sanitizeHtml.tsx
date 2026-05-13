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
