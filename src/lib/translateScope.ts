const SCOPE_KEY = "vaamki-translate-scope";
const SITE_LANG_KEY = "vaamki-site-googtrans";
const RELOAD_ONCE_KEY = "vaamki-translate-home-reload";

export type TranslateScope = "article" | "site";

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getTranslateScope(): TranslateScope | null {
  const value = safeStorage()?.getItem(SCOPE_KEY);
  return value === "article" || value === "site" ? value : null;
}

export function setTranslateScope(scope: TranslateScope) {
  safeStorage()?.setItem(SCOPE_KEY, scope);
}

export function clearTranslateScope() {
  safeStorage()?.removeItem(SCOPE_KEY);
}

export function getGoogTransCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )googtrans=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isDefaultHindiGoogTrans(value: string): boolean {
  if (!value) return true;
  return value === "/auto/hi" || value === "/hi/hi" || value.endsWith("/hi");
}

export function rememberSiteGoogTrans() {
  if (typeof document === "undefined") return;
  const value = getGoogTransCookie();
  const storage = safeStorage();
  if (!storage) return;
  if (!value || isDefaultHindiGoogTrans(value)) {
    storage.removeItem(SITE_LANG_KEY);
    return;
  }
  storage.setItem(SITE_LANG_KEY, value);
}

export function getRememberedSiteGoogTrans(): string | null {
  return safeStorage()?.getItem(SITE_LANG_KEY) ?? null;
}

export function clearGoogTransCookies() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const hostname = window.location.hostname;
  const domains = ["", hostname, `.${hostname}`];
  const hostParts = hostname.split(".");
  if (hostParts.length > 2) {
    domains.push(`.${hostParts.slice(-2).join(".")}`);
  }
  for (const domain of domains) {
    const domainPart = domain ? `;domain=${domain}` : "";
    document.cookie = `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainPart}`;
    document.cookie = `googtrans=/hi/hi;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainPart}`;
  }
}

function isPageVisiblyTranslated(): boolean {
  if (typeof document === "undefined") return false;
  const html = document.documentElement;
  if (html.classList.contains("translated-ltr") || html.classList.contains("translated-rtl")) {
    return true;
  }
  if (document.body?.classList.contains("translated-ltr") || document.body?.classList.contains("translated-rtl")) {
    return true;
  }
  // Google Translate top banner / skiptranslate chrome
  if (document.querySelector(".goog-te-banner-frame, .skiptranslate iframe, #goog-gt-tt")) {
    return true;
  }
  return false;
}

/**
 * Best-effort in-place reset. Soft SPA navigations often ignore this — prefer
 * leaveArticleTranslateAndGoHome() which does a hard navigation.
 */
export function restoreGoogleTranslate(preferredGoogTrans?: string | null): boolean {
  if (typeof document === "undefined") return false;

  clearGoogTransCookies();

  const target = preferredGoogTrans && preferredGoogTrans.length > 0 ? preferredGoogTrans : null;
  if (target) {
    document.cookie = `googtrans=${target};path=/`;
  }

  document.documentElement.classList.remove("translated-ltr", "translated-rtl");
  document.body?.classList.remove("translated-ltr", "translated-rtl");

  // Hide leftover GT banner chrome when possible
  document.querySelectorAll<HTMLElement>(".goog-te-banner-frame, .skiptranslate").forEach((el) => {
    if (el.id === "google_translate_element" || el.contains(document.getElementById("google_translate_element"))) {
      return;
    }
    if (el.classList.contains("goog-te-banner-frame") || el.tagName === "IFRAME") {
      el.style.display = "none";
    }
  });

  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;

  const nextValue = target
    ? target.split("/").filter(Boolean).pop() || ""
    : "";
  const optionExists =
    !nextValue || Array.from(combo.options).some((opt) => opt.value === nextValue);

  combo.value = optionExists ? nextValue : "";
  combo.dispatchEvent(new Event("change"));
  return true;
}

export function endArticleOnlyTranslation() {
  if (getTranslateScope() !== "article") return;
  const siteLang = getRememberedSiteGoogTrans();
  restoreGoogleTranslate(siteLang);
  clearTranslateScope();
}

/**
 * Call before navigating home from the article page when article-only translate
 * was used. Clears googtrans and hard-loads home so GT cannot keep the old language.
 */
export function leaveArticleTranslateAndGoHome(href = "/"): boolean {
  const scope = getTranslateScope();
  const googtrans = getGoogTransCookie();
  const articleBleed =
    scope === "article" || (scope !== "site" && !!googtrans && !isDefaultHindiGoogTrans(googtrans));

  if (!articleBleed && !isPageVisiblyTranslated()) {
    return false;
  }

  if (scope === "site") {
    return false;
  }

  const siteLang = getRememberedSiteGoogTrans();
  clearGoogTransCookies();
  clearTranslateScope();

  if (siteLang && !isDefaultHindiGoogTrans(siteLang)) {
    document.cookie = `googtrans=${siteLang};path=/`;
  }

  // Hard navigation — required to drop GT's in-memory translation of the SPA shell
  window.location.assign(href);
  return true;
}

/** Homepage mount safety net after soft navigations. */
export function ensureHomepageTranslateState() {
  if (typeof window === "undefined") return;

  const storage = safeStorage();
  const scope = getTranslateScope();

  if (scope === "site") {
    storage?.removeItem(RELOAD_ONCE_KEY);
    return;
  }

  const googtrans = getGoogTransCookie();
  const bleed =
    scope === "article" ||
    isPageVisiblyTranslated() ||
    (!!googtrans && !isDefaultHindiGoogTrans(googtrans));

  if (!bleed) {
    storage?.removeItem(RELOAD_ONCE_KEY);
    return;
  }

  const siteLang = getRememberedSiteGoogTrans();
  clearGoogTransCookies();
  if (scope === "article") {
    clearTranslateScope();
  }

  if (siteLang && !isDefaultHindiGoogTrans(siteLang)) {
    document.cookie = `googtrans=${siteLang};path=/`;
    setTranslateScope("site");
    if (isPageVisiblyTranslated() && storage && !storage.getItem(RELOAD_ONCE_KEY)) {
      storage.setItem(RELOAD_ONCE_KEY, "1");
      window.location.reload();
    }
    return;
  }

  // Default Hindi: hard reload once so GT banner/state is fully cleared
  if (storage?.getItem(RELOAD_ONCE_KEY) === "1") {
    storage.removeItem(RELOAD_ONCE_KEY);
    restoreGoogleTranslate(null);
    return;
  }

  if (isPageVisiblyTranslated() || (googtrans && !isDefaultHindiGoogTrans(googtrans))) {
    storage?.setItem(RELOAD_ONCE_KEY, "1");
    restoreGoogleTranslate(null);
    window.location.reload();
  }
}
