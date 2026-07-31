"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  Home,
  Menu,
  Moon,
  Play,
  Search,
  Share2,
  Sun,
  User,
  Volume2,
  Wrench,
  X,
} from "lucide-react";
import { getCategoryClass, formatViews, getPostReadTime, speakHindiText, subscribeSpeechState } from "@/utils/designUtils";
import { focusToObjectPosition, resolveImageFocus } from "@/lib/imageCrop";
import { affinityWeight, readAffinity, weightedShuffle } from "@/lib/feedAffinity";
import { SITE_TAGLINE, SITE_TAGLINE_LINES } from "@/lib/siteConstants";
import type { StruggleTrackerEntry } from "@/lib/struggleTrackerShared";
import type { NewsPost, PlatformResource } from "./ClientPage";

type AbhiyanEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  details: string;
  imageUrl?: string;
};

type MovementRow = StruggleTrackerEntry;

export type MobileHomeProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onChangeFontSize: (delta: number) => void;
  onOpenMenu: () => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
  onOpenAuth: () => void;

  breakingStories: NewsPost[];
  slogans: string;

  heroStories: NewsPost[];
  /* Article pool the फीड tab ranks client-side (already-fetched posts, no extra request). */
  feedPool: NewsPost[];
  latestPosts: NewsPost[];
  canLoadMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;

  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;

  explainerPosts: NewsPost[];
  groundPosts: NewsPost[];
  tracker: MovementRow[];
  featuredVichar: NewsPost[];
  topReadPosts: NewsPost[];

  resources: PlatformResource[];
  resourceFilter: "all" | "link" | "pdf";
  onResourceFilterChange: (filter: "all" | "link" | "pdf") => void;
  onOpenResource: (resource: PlatformResource) => void;

  newsletterName: string;
  newsletterPhone: string;
  newsletterEmail: string;
  onNewsletterNameChange: (value: string) => void;
  onNewsletterPhoneChange: (value: string) => void;
  onNewsletterEmailChange: (value: string) => void;
  onNewsletterSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  newsletterMessage: string;

  events: AbhiyanEvent[];
  onOpenEvent: (event: AbhiyanEvent) => void;
  onOpenArchive: () => void;
  formatDateWithDay: (date: string) => string;

  onNavTab: (value: string) => void;

  getPreviewImage: (post: NewsPost) => string | null | undefined;
  getPostTimeLabel: (post: NewsPost) => string;
  getPostClicks: (post: NewsPost) => number;
  onPostClick: (postId: string) => void;

  isLoggedIn: boolean;
  savedPostIds: string[];
  savedPosts: NewsPost[];
  savedLoading: boolean;
  onToggleSavedPost: (postId: string) => void;
  onLoadSavedPosts: () => void;

  followedAuthorIds: string[];
  followedFeedPosts: NewsPost[];
  followedFeedLoading: boolean;
  onLoadFollowedFeedPosts: () => Promise<NewsPost[]>;

  /* Publishing/resource controls are portaled into the admin panel below by ClientPage; these
     flags only decide whether the panel and its portal targets exist at all. */
  canPublishBlog: boolean;
  isMaster: boolean;
  addNewsSlotRef: (element: HTMLDivElement | null) => void;
  resourceSlotRef: (element: HTMLDivElement | null) => void;
};

/* Opening फीड pushes its own history entry so the phone's native back gesture from an article
   returns to the feed rather than to the homepage that stays mounted underneath it. The hash is
   what survives the round trip through /post/[id], where this component unmounts entirely. */
const FEED_HASH = "#feed";
/* The ranked order and swipe offset the feed had when the reader tapped into an article, so the
   restored feed comes back on the same card instead of a freshly re-ranked first card. */
const FEED_STATE_KEY = "vka-feed-state";

type FeedTab = "forYou" | "following";

const feedTabSwitcherStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 24,
  flex: 1,
};

const feedTabBtnStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "Inter, sans-serif",
  fontSize: 14,
  fontWeight: active ? 700 : 500,
  color: active ? "var(--foreground)" : "var(--muted)",
  background: "transparent",
  border: "none",
  padding: "4px 0",
  cursor: "pointer",
  borderBottom: active ? "2px solid var(--foreground)" : "2px solid transparent",
  transition: "color 0.15s, border-color 0.15s",
});

const stripHtml = (html?: string) =>
  (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--gold)",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

/* The सहेजें sheet's layout is declared here rather than left to globals.css alone: it has to
   overlay the homepage the moment the tab is tapped, even if the stylesheet chunk in the browser
   predates these class names — otherwise the sheet mounts unstyled after the footer, off-screen. */
/* The sheet reaches bottom: 0 and reserves the tab bar's strip as its own padding instead of
   stopping short above it. The bar is ~68px tall once env(safe-area-inset-bottom) is 0 (Android
   gesture nav), so a sheet that stopped short left a strip of the homepage showing between the
   sheet and the bar. The bar keeps z-index 90 and still paints on top. */
const TABBAR_RESERVE = "calc(68px + env(safe-area-inset-bottom, 0px))";

const HERO_AUTO_MS = 5500;

const savedPanelStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  paddingBottom: TABBAR_RESERVE,
  zIndex: 89,
  background: "var(--ink)",
  display: "flex",
  flexDirection: "column",
};

const savedHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "12px 14px",
  borderBottom: "1px solid var(--divider)",
};

const savedCloseStyle: React.CSSProperties = {
  display: "flex",
  background: "transparent",
  border: "1px solid var(--divider)",
  color: "var(--text-primary)",
  padding: 4,
};

const savedBodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "12px 14px",
};

const savedRemoveStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  marginTop: 5,
  background: "transparent",
  border: "1px solid var(--divider)",
  padding: "5px 10px",
  fontFamily: '"Noto Sans Devanagari", sans-serif',
  fontSize: 11,
  color: "var(--gold)",
};

const badgeStyle: React.CSSProperties = {
  background: "var(--crimson)",
  color: "#fff",
  fontFamily: "Inter, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  padding: "3px 8px",
  letterSpacing: "0.05em",
  flexShrink: 0,
};

const feedPanelStyle: React.CSSProperties = {
  ...savedPanelStyle,
};

/* Vertical twin of .home-mobile__hero-track. Declared inline for the same reason the सहेजें
   sheet is: the overlay has to be laid out correctly the moment the tab is tapped. The slides
   themselves keep .home-mobile__hero-slide, whose `flex: 0 0 100%` resolves against the
   column axis here, so one card fills the panel. */
const feedTrackStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
  scrollSnapType: "y mandatory",
};

/* The hero slide card, shared by the homepage hero stack and the फीड tab. Markup, classes and
   handlers are unchanged from the original inline hero slide. */
function HeroSlide({
  story,
  image,
  isSaved,
  onToggleSavedPost,
  onPostClick,
  onShare,
  getPostTimeLabel,
  getPostClicks,
}: {
  story: NewsPost;
  image: string | null | undefined;
  isSaved: boolean;
  onToggleSavedPost: (postId: string) => void;
  onPostClick: (postId: string) => void;
  onShare: (post: NewsPost) => void;
  getPostTimeLabel: (post: NewsPost) => string;
  getPostClicks: (post: NewsPost) => number;
}) {
  return (
    <article className="home-mobile__hero-slide">
      {image ? (
        <img
          src={image}
          alt={story.title}
          className="home-mobile__hero-image"
          style={{ objectPosition: focusToObjectPosition(resolveImageFocus(story, "hero")) }}
        />
      ) : (
        <div className="home-mobile__hero-image home-mobile__hero-image--empty" />
      )}
      <div className="home-mobile__hero-scrim" />

      <div className="home-mobile__hero-copy">
        <span className={`cat-pill ${getCategoryClass(story.category)}`}>{story.category}</span>
        <Link href={`/post/${story.id}`} onClick={() => onPostClick(story.id)} style={{ textDecoration: "none" }}>
          <h2 className="home-mobile__hero-title">{story.title}</h2>
        </Link>
        <p className="home-mobile__hero-excerpt">{stripHtml(story.excerpt)}</p>
        <div className="home-mobile__hero-meta">
          {story.authorImage ? (
            <img src={story.authorImage} alt="" className="avatar-circle home-mobile__hero-avatar" />
          ) : (
            <span className="avatar-circle home-mobile__hero-avatar home-mobile__hero-avatar--empty" />
          )}
          <span>
            {story.author} · {getPostTimeLabel(story)} · {getPostReadTime(story)} मिनट पाठ
          </span>
        </div>
        <Link
          href={`/post/${story.id}`}
          onClick={() => onPostClick(story.id)}
          className="btn-primary home-mobile__hero-cta"
        >
          पूरा पढ़ें →
        </Link>
      </div>

      <div className="home-mobile__hero-rail">
        {/* The mockup shows a like control here, but reactions are stored per
            article and are not part of the homepage payload, so this slot
            surfaces the real reader count instead of an unbacked like button. */}
        <span className="home-mobile__hero-rail-item">
          <Eye size={19} />
          <span>{formatViews(getPostClicks(story))}</span>
        </span>
        <button
          type="button"
          className={`home-mobile__hero-rail-item${isSaved ? " is-saved" : ""}`}
          aria-pressed={isSaved}
          onClick={() => onToggleSavedPost(story.id)}
        >
          {isSaved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
          <span>{isSaved ? "सहेजा" : "सहेजें"}</span>
        </button>
        <button type="button" className="home-mobile__hero-rail-item" onClick={() => onShare(story)}>
          <Share2 size={19} />
          <span>शेयर</span>
        </button>
        <button
          type="button"
          className="home-mobile__hero-rail-item"
          onClick={() => speakHindiText(`${story.title}। ${stripHtml(story.excerpt)}`)}
        >
          <Volume2 size={19} />
          <span>सुनें</span>
        </button>
      </div>
    </article>
  );
}

export function MobileHome(props: MobileHomeProps) {
  const {
    theme,
    onToggleTheme,
    onChangeFontSize,
    onOpenMenu,
    onToggleMenu,
    isMenuOpen,
    onOpenAuth,
    breakingStories,
    slogans,
    heroStories,
    feedPool,
    latestPosts,
    canLoadMore,
    loadingMore,
    onLoadMore,
    categories,
    selectedCategory,
    onSelectCategory,
    explainerPosts,
    groundPosts,
    tracker,
    featuredVichar,
    topReadPosts,
    resources,
    resourceFilter,
    onResourceFilterChange,
    onOpenResource,
    newsletterName,
    newsletterPhone,
    newsletterEmail,
    onNewsletterNameChange,
    onNewsletterPhoneChange,
    onNewsletterEmailChange,
    onNewsletterSubmit,
    newsletterMessage,
    events,
    onOpenEvent,
    onOpenArchive,
    formatDateWithDay,
    onNavTab,
    getPreviewImage,
    getPostTimeLabel,
    getPostClicks,
    onPostClick,
    isLoggedIn,
    savedPostIds,
    savedPosts,
    savedLoading,
    onToggleSavedPost,
    onLoadSavedPosts,
    followedAuthorIds,
    followedFeedPosts,
    followedFeedLoading,
    onLoadFollowedFeedPosts,
    canPublishBlog,
    isMaster,
    addNewsSlotRef,
    resourceSlotRef,
  } = props;

  const heroTrackRef = useRef<HTMLDivElement | null>(null);
  const heroAutoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroTouchingRef = useRef(false);
  const heroSpeechActiveRef = useRef(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("forYou");
  const [feedItems, setFeedItems] = useState<NewsPost[]>([]);
  const feedTrackRef = useRef<HTMLDivElement | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const feedHistoryRef = useRef(false);
  const feedRestoreScrollRef = useRef<number | null>(null);
  const feedRestoredRef = useRef(false);

  const isSaved = useCallback((postId: string) => savedPostIds.includes(postId), [savedPostIds]);

  /* Ranks the pool by the visitor's device-local category affinity. With no affinity yet
     (first ever open) the pool order is kept as-is, i.e. the homepage's recency order. */
  const rankFeed = useCallback(() => {
    const pool = feedPool.slice(0, 50);
    const affinity = readAffinity();
    if (pool.length === 0 || Object.keys(affinity).length === 0) return pool;
    return weightedShuffle(pool, (post) => affinityWeight(affinity, post.category));
  }, [feedPool]);

  const rankFollowedFeed = useCallback(() => {
    const pool = followedFeedPosts.slice(0, 50);
    if (pool.length === 0) return pool;
    return [...pool].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [followedFeedPosts]);

  const activateFeedTab = useCallback(
    async (tab: FeedTab) => {
      if (tab === "following") {
        if (!isLoggedIn) {
          onOpenAuth();
          return;
        }
        if (followedAuthorIds.length === 0) {
          setFeedTab("following");
          setFeedItems([]);
          return;
        }
        setFeedTab("following");
        const posts = followedFeedPosts.length > 0 ? followedFeedPosts : await onLoadFollowedFeedPosts();
        if (posts.length === 0) {
          setFeedItems([]);
          return;
        }
        const sorted = [...posts].sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
        setFeedItems(sorted);
        feedRestoreScrollRef.current = 0;
        return;
      }
      setFeedTab("forYou");
      setFeedItems(rankFeed());
      feedRestoreScrollRef.current = 0;
    },
    [
      followedAuthorIds.length,
      followedFeedPosts,
      isLoggedIn,
      onLoadFollowedFeedPosts,
      onOpenAuth,
      rankFeed,
      rankFollowedFeed,
    ],
  );

  /* `items`/`scrollTop` are only passed when restoring a feed the reader had already swiped
     through; a plain tap on the फीड tab re-ranks and starts at the top as before. */
  const openFeed = useCallback(
    (items?: NewsPost[], scrollTop = 0) => {
      setIsFeedOpen(true);
      setFeedTab("forYou");
      setFeedItems(items && items.length > 0 ? items : rankFeed());
      feedRestoreScrollRef.current = scrollTop;
      if (typeof window !== "undefined" && !feedHistoryRef.current) {
        /* Spread the existing state so the router's own entry data survives the push. */
        window.history.pushState({ ...window.history.state, vkaFeed: true }, "", FEED_HASH);
        feedHistoryRef.current = true;
      }
    },
    [rankFeed],
  );

  /* Closing through the UI has to unwind the pushed entry too, otherwise the back gesture from
     the homepage would land on a stale #feed. Only entries this component pushed are popped;
     a #feed URL opened cold (no marker in the state) just has its hash stripped in place. */
  const closeFeed = useCallback(() => {
    if (feedHistoryRef.current && typeof window !== "undefined") {
      feedHistoryRef.current = false;
      if (window.history.state?.vkaFeed) {
        window.history.back();
      } else {
        window.history.replaceState(window.history.state, "", window.location.pathname);
      }
    }
    setIsFeedOpen(false);
  }, []);

  const openSaved = useCallback(() => {
    if (!isLoggedIn) {
      onOpenAuth();
      return;
    }
    closeFeed();
    setIsSavedOpen(true);
    onLoadSavedPosts();
  }, [isLoggedIn, onOpenAuth, onLoadSavedPosts, closeFeed]);

  useEffect(() => {
    const handlePopState = () => {
      const atFeed = window.location.hash === FEED_HASH;
      feedHistoryRef.current = atFeed;
      if (!atFeed) setIsFeedOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /* Back from an article remounts this component at /#feed, so the feed is reopened here rather
     than by the popstate listener above. Waits for feedPool, which the parent fills from the
     already-fetched homepage posts. */
  useEffect(() => {
    if (feedRestoredRef.current) return;
    if (typeof window === "undefined" || window.location.hash !== FEED_HASH) {
      feedRestoredRef.current = true;
      return;
    }
    if (feedPool.length === 0) return;
    feedRestoredRef.current = true;
    feedHistoryRef.current = true;

    let saved: { ids?: unknown; scrollTop?: unknown } | null = null;
    try {
      saved = JSON.parse(window.sessionStorage.getItem(FEED_STATE_KEY) || "null");
    } catch {
      saved = null;
    }
    const byId = new Map(feedPool.map((post) => [post.id, post]));
    const restored = Array.isArray(saved?.ids)
      ? (saved.ids as unknown[])
          .map((id) => (typeof id === "string" ? byId.get(id) : undefined))
          .filter((post): post is NewsPost => Boolean(post))
      : [];
    openFeed(restored, typeof saved?.scrollTop === "number" ? saved.scrollTop : 0);
  }, [feedPool, openFeed]);

  /* The track only exists once the panel has rendered, so the swipe offset is applied here. */
  useEffect(() => {
    if (!isFeedOpen) return;
    const target = feedRestoreScrollRef.current;
    if (target === null) return;
    feedRestoreScrollRef.current = null;
    const track = feedTrackRef.current;
    if (track) track.scrollTop = target;
  }, [isFeedOpen, feedItems]);

  const persistFeedState = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        FEED_STATE_KEY,
        JSON.stringify({
          ids: feedItems.map((item) => item.id),
          scrollTop: feedTrackRef.current?.scrollTop ?? 0,
        }),
      );
    } catch {
      /* private mode / quota — the feed just reopens re-ranked from the top */
    }
  }, [feedItems]);

  const handleFeedPostClick = useCallback(
    (postId: string) => {
      persistFeedState();
      onPostClick(postId);
    },
    [onPostClick, persistFeedState],
  );

  /* Endless by recycling the same client-held pool: as the reader nears the end another
     re-ranked batch is appended (re-reading affinity, so saves/clicks made inside the feed
     count), rotated if needed so the seam never repeats the same article back-to-back. */
  const handleFeedScroll = useCallback(() => {
    const track = feedTrackRef.current;
    if (!track || track.clientHeight === 0) return;
    const index = Math.round(track.scrollTop / track.clientHeight);
    if (index < feedItems.length - 3) return;
    setFeedItems((prev) => {
      if (prev.length === 0 || prev.length > 400) return prev;
      const next = feedTab === "following" ? rankFollowedFeed() : rankFeed();
      if (next.length > 1 && next[0].id === prev[prev.length - 1].id) {
        [next[0], next[1]] = [next[1], next[0]];
      }
      return [...prev, ...next];
    });
  }, [feedItems.length, feedTab, rankFeed, rankFollowedFeed]);

  const showsAdminPanel = canPublishBlog || isMaster;

  const clearHeroAutoTimer = useCallback(() => {
    if (heroAutoTimerRef.current) {
      clearInterval(heroAutoTimerRef.current);
      heroAutoTimerRef.current = null;
    }
  }, []);

  const scheduleHeroAutoAdvance = useCallback(() => {
    clearHeroAutoTimer();
    if (heroStories.length <= 1) return;
    heroAutoTimerRef.current = setInterval(() => {
      if (heroTouchingRef.current || heroSpeechActiveRef.current) return;
      const track = heroTrackRef.current;
      if (!track || track.clientWidth === 0) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      const next = (current + 1) % heroStories.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, HERO_AUTO_MS);
  }, [clearHeroAutoTimer, heroStories.length]);

  useEffect(() => {
    scheduleHeroAutoAdvance();
    return clearHeroAutoTimer;
  }, [scheduleHeroAutoAdvance, clearHeroAutoTimer]);

  // Swipe position is read off the native scroll-snap container rather than a
  // gesture library, so the stack still works with keyboard and screen readers.
  const handleHeroScroll = useCallback(() => {
    const track = heroTrackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    setHeroIndex((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    if (heroTouchingRef.current || heroSpeechActiveRef.current) return;
    scheduleHeroAutoAdvance();
  }, [heroIndex, scheduleHeroAutoAdvance]);

  useEffect(() => {
    return subscribeSpeechState((speaking) => {
      heroSpeechActiveRef.current = speaking;
      if (speaking) {
        clearHeroAutoTimer();
      } else if (!heroTouchingRef.current) {
        scheduleHeroAutoAdvance();
      }
    });
  }, [clearHeroAutoTimer, scheduleHeroAutoAdvance]);

  const handleHeroTouchStart = useCallback(() => {
    heroTouchingRef.current = true;
    clearHeroAutoTimer();
  }, [clearHeroAutoTimer]);

  const handleHeroTouchEnd = useCallback(() => {
    heroTouchingRef.current = false;
    if (!heroSpeechActiveRef.current) {
      scheduleHeroAutoAdvance();
    }
  }, [scheduleHeroAutoAdvance]);

  const sharePost = useCallback((post: NewsPost) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(url);
  }, []);

  const heroCount = heroStories.length;
  const [firstLatest, ...restLatest] = latestPosts;

  return (
    <div className="home-mobile" role="presentation">
      {/* 1 — Top header bar */}
      <header className="home-mobile__header">
        <Link href="/" className="home-mobile__brand" style={{ textDecoration: "none" }}>
          <img
            src="/vaamki-logo.png"
            alt="वाम की आवाज़ लोगो"
            onError={(event) => {
              event.currentTarget.src = "/vercel.svg";
            }}
            className="home-mobile__logo"
          />
          <span>
            <span className="home-mobile__brand-name">वाम की आवाज़</span>
            <span className="home-mobile__brand-tagline">{SITE_TAGLINE_LINES[0]}</span>
          </span>
        </Link>
        <div className="home-mobile__header-actions">
          <span className="home-mobile__fontsize">
            <button type="button" onClick={() => onChangeFontSize(-1)} aria-label="फ़ॉन्ट छोटा करें">
              अ−
            </button>
            <button type="button" onClick={() => onChangeFontSize(1)} aria-label="फ़ॉन्ट बड़ा करें">
              अ+
            </button>
          </span>
          <button
            type="button"
            onClick={onToggleTheme}
            className="home-mobile__icon-btn"
            aria-label={theme === "light" ? "डार्क मोड" : "लाइट मोड"}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            className="home-mobile__icon-btn home-mobile__icon-btn--plain"
            aria-label="मेनू खोलें"
          >
            <Menu size={19} />
          </button>
        </div>
      </header>

      <div className="home-mobile__scaled">
      {/* 2 — Breaking news ticker */}
      {breakingStories.length > 0 && (
        <div className="home-mobile__breaking">
          <span className="home-mobile__breaking-tag">ब्रेकिंग</span>
          <div className="home-mobile__breaking-viewport">
            <div className="ticker-track home-mobile__breaking-track">
              {[...breakingStories, ...breakingStories].map((story, index) => (
                <span key={`m-ticker-${story.id}-${index}`}>
                  <Link href={`/post/${story.id}`} onClick={() => onPostClick(story.id)} style={{ color: "#fff", textDecoration: "none" }}>
                    {story.title}
                  </Link>
                  <span style={{ color: "var(--gold)", fontWeight: 700, margin: "0 12px" }}>॥</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2b — Admin tools. Only the admin controls themselves come to the phone (portaled in by
          ClientPage); the desktop layout that used to hold them stays hidden for everyone. */}
      {showsAdminPanel && (
        <section className="home-mobile__admin">
          <button
            type="button"
            className="home-mobile__admin-toggle"
            onClick={() => setIsAdminOpen((prev) => !prev)}
            aria-expanded={isAdminOpen}
          >
            <Wrench size={15} />
            <span>एडमिन टूल्स</span>
            {isAdminOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {/* Kept mounted while collapsed so the portal targets never disappear. */}
          <div className={`home-mobile__admin-body${isAdminOpen ? " is-open" : ""}`}>
            {canPublishBlog && (
              <>
                <div className="home-mobile__admin-heading">नई खबर जोड़ें</div>
                <div ref={addNewsSlotRef} />
              </>
            )}
            {isMaster && (
              <>
                <div className="home-mobile__admin-heading">संसाधन</div>
                <div ref={resourceSlotRef} />
              </>
            )}
          </div>
        </section>
      )}

      {/* 3 — Full-bleed swipeable hero over the priority stories */}
      {heroCount > 0 && (
        <section className="home-mobile__hero" aria-label="प्रमुख खबरें">
          <div className="home-mobile__hero-slogans">
            <div className="resistance-track home-mobile__hero-slogan-track">
              ✊ {slogans}✊ {slogans}
            </div>
          </div>

          <div
            className="home-mobile__hero-track no-visible-scrollbar"
            ref={heroTrackRef}
            onScroll={handleHeroScroll}
            onTouchStart={handleHeroTouchStart}
            onTouchEnd={handleHeroTouchEnd}
            onTouchCancel={handleHeroTouchEnd}
          >
            {heroStories.map((story) => (
              <HeroSlide
                key={`m-hero-${story.id}`}
                story={story}
                image={getPreviewImage(story)}
                isSaved={isSaved(story.id)}
                onToggleSavedPost={onToggleSavedPost}
                onPostClick={onPostClick}
                onShare={sharePost}
                getPostTimeLabel={getPostTimeLabel}
                getPostClicks={getPostClicks}
              />
            ))}
          </div>

          {heroCount > 1 && (
            <div className="home-mobile__hero-dots" aria-hidden="true">
              {heroStories.map((story, index) => (
                <span
                  key={`m-hero-dot-${story.id}`}
                  className={index === heroIndex ? "is-active" : undefined}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            className="home-mobile__hero-more"
            onClick={() => document.getElementById("m-latest")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <span className="home-mobile__hero-progress">
              <span style={{ width: `${((heroIndex + 1) / heroCount) * 100}%` }} />
            </span>
            <ChevronUp size={14} />
            <span className="home-mobile__hero-more-label">और खबरें</span>
          </button>
        </section>
      )}

      {/* 4 — Category filter chips (reuses the existing category filter state) */}
      <div className="home-mobile__chips no-visible-scrollbar">
        {categories.map((category) => (
          <button
            key={`m-chip-${category}`}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`home-mobile__chip${selectedCategory === category ? " is-active" : ""}`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 5 — ताज़ा खबरें */}
      <section className="home-mobile__section" id="m-latest">
        <div className="home-mobile__section-head home-mobile__section-head--underline">
          <span style={sectionLabelStyle}>ताज़ा खबरें</span>
          <button type="button" className="home-mobile__section-link" onClick={() => onSelectCategory("सभी")}>
            सभी देखें →
          </button>
        </div>

        {/* The empty state must mean "this category/search has nothing", so it waits for the
            backend query to settle and only speaks when the hero came back empty too. */}
        {latestPosts.length === 0 ? (
          <p className="home-mobile__empty">
            {loadingMore ? "लोड हो रहा है..." : heroCount > 0 ? "और खबरें नहीं हैं।" : "कोई परिणाम नहीं मिला।"}
          </p>
        ) : (
          <>
            {firstLatest && (
              <Link
                href={`/post/${firstLatest.id}`}
                onClick={() => onPostClick(firstLatest.id)}
                className="home-mobile__lead-card"
              >
                <span className="home-mobile__lead-media">
                  {getPreviewImage(firstLatest) && (
                    <img
                      src={getPreviewImage(firstLatest)!}
                      alt={firstLatest.title}
                      style={{ objectPosition: focusToObjectPosition(resolveImageFocus(firstLatest, "card")) }}
                    />
                  )}
                  <span className={`cat-pill ${getCategoryClass(firstLatest.category)} home-mobile__lead-tag`}>
                    {firstLatest.category}
                  </span>
                </span>
                <span className="home-mobile__lead-body">
                  <span className="home-mobile__lead-title">{firstLatest.title}</span>
                  <span className="home-mobile__lead-excerpt">{stripHtml(firstLatest.excerpt)}</span>
                  <span className="home-mobile__lead-foot">
                    <span className="home-mobile__byline">
                      {firstLatest.authorImage ? (
                        <img src={firstLatest.authorImage} alt="" className="avatar-circle" />
                      ) : (
                        <span className="avatar-circle home-mobile__byline-dot" />
                      )}
                      {firstLatest.author} · {getPostTimeLabel(firstLatest)} · {getPostClicks(firstLatest)} क्लिक
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="यह लेख सुनें"
                      className="home-mobile__listen"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        speakHindiText(firstLatest.title);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          speakHindiText(firstLatest.title);
                        }
                      }}
                    >
                      <Volume2 size={14} />
                    </span>
                  </span>
                  <span className="home-mobile__read-more">पूरा लेख पढ़ें →</span>
                </span>
              </Link>
            )}

            {restLatest.map((story) => (
              <Link
                key={`m-latest-${story.id}`}
                href={`/post/${story.id}`}
                onClick={() => onPostClick(story.id)}
                className="home-mobile__row-card"
              >
                <span className="home-mobile__row-media">
                  {getPreviewImage(story) && (
                    <img
                      src={getPreviewImage(story)!}
                      alt={story.title}
                      style={{ objectPosition: focusToObjectPosition(resolveImageFocus(story, "card")) }}
                    />
                  )}
                </span>
                <span className="home-mobile__row-body">
                  <span className={`cat-pill ${getCategoryClass(story.category)}`}>{story.category}</span>
                  <span className="home-mobile__row-title">{story.title}</span>
                  <span className="home-mobile__row-meta">
                    {story.author} · {getPostTimeLabel(story)} · {getPostClicks(story)} क्लिक
                  </span>
                  <span className="home-mobile__read-more">पूरा लेख पढ़ें →</span>
                </span>
              </Link>
            ))}

            {canLoadMore && (
              <div className="home-mobile__loadmore-wrap">
                <button type="button" className="home-mobile__loadmore" onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? "लोड हो रहा है..." : "और खबरें लोड करें"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 6 — 3 मिनट में समझें */}
      {explainerPosts.length > 0 && (
        <section className="home-mobile__section home-mobile__section--divided">
          <div className="home-mobile__section-head">
            <span style={badgeStyle}>3 मिनट</span>
            <span style={sectionLabelStyle}>समझें सिर्फ 3 मिनट में</span>
            <span className="home-mobile__rule" />
          </div>
          <div className="home-mobile__hscroll no-visible-scrollbar">
            {explainerPosts.map((post, index) => (
              <Link
                key={`m-explainer-${post.id}`}
                href={`/post/${post.id}`}
                onClick={() => onPostClick(post.id)}
                className="home-mobile__explainer-card"
              >
                <span className="home-mobile__explainer-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="home-mobile__explainer-title">{post.title}</span>
                <span className="home-mobile__explainer-cta">पढ़ना शुरू करें →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 7 — ग्राउंड रिपोर्ट (intentionally cream against the dark page) */}
      {groundPosts.length > 0 && (
        <section className="home-mobile__ground">
          <div className="home-mobile__section-head">
            <span style={{ ...sectionLabelStyle, color: "var(--crimson)" }}>ग्राउंड रिपोर्ट</span>
            <span className="home-mobile__rule" />
          </div>
          {groundPosts.map((post) => (
            <Link
              key={`m-ground-${post.id}`}
              href={`/post/${post.id}`}
              onClick={() => onPostClick(post.id)}
              className="home-mobile__ground-card"
            >
              <span className="home-mobile__ground-media">
                {getPreviewImage(post) && (
                  <img
                    src={getPreviewImage(post)!}
                    alt={post.title}
                    style={{ objectPosition: focusToObjectPosition(resolveImageFocus(post, "ground")) }}
                  />
                )}
              </span>
              <span className="home-mobile__ground-body">
                <span className={`cat-pill ${getCategoryClass(post.category)}`}>{post.category}</span>
                <span className="home-mobile__ground-title">{post.title}</span>
                <span className="home-mobile__ground-excerpt">{stripHtml(post.excerpt)}</span>
                <span className="home-mobile__ground-meta">
                  {post.author} · {getPostTimeLabel(post)} · {getPostClicks(post)} क्लिक
                </span>
              </span>
            </Link>
          ))}
        </section>
      )}

      {/* 8 — LIVE सक्रिय संघर्ष ट्रैकर */}
      {tracker.length > 0 && (
      <section className="home-mobile__section home-mobile__section--divided">
        <div className="home-mobile__section-head">
          <span style={badgeStyle}>LIVE</span>
          <span style={sectionLabelStyle}>सक्रिय संघर्ष ट्रैकर</span>
          <span className="home-mobile__rule" />
        </div>
        <div className="home-mobile__tracker">
          {tracker.map((row) => (
            <div className="home-mobile__tracker-row" key={`m-tracker-${row.id}`}>
              <div>
                <div className="home-mobile__tracker-name">{row.name}</div>
                <div className="home-mobile__tracker-where">
                  {row.location} · {row.startDate} से
                </div>
                <div className="home-mobile__tracker-desc">{row.description}</div>
              </div>
              <span
                className={
                  row.status === "active" ? "badge-active" : row.status === "strike" ? "badge-strike" : "badge-success"
                }
              >
                {row.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* प्रमुख विचार */}
      <section className="home-mobile__section home-mobile__section--divided">
        <div className="home-mobile__section-head home-mobile__section-head--underline">
          <span style={sectionLabelStyle}>प्रमुख विचार</span>
        </div>
        {featuredVichar.length === 0 ? (
          <p className="home-mobile__empty">कोई प्रमुख विचार चयनित नहीं है।</p>
        ) : (
          featuredVichar.map((post) => (
            <Link
              key={`m-vichar-${post.id}`}
              href={`/post/${post.id}`}
              onClick={() => onPostClick(post.id)}
              className="home-mobile__vichar-item"
            >
              {post.title}
            </Link>
          ))
        )}
      </section>

      {/* 9 — सबसे ज्यादा पढ़ी गईं */}
      {topReadPosts.length > 0 && (
        <section className="home-mobile__section home-mobile__section--divided">
          <div className="home-mobile__section-head home-mobile__section-head--underline">
            <span style={sectionLabelStyle}>सबसे ज्यादा पढ़ी गईं</span>
          </div>
          <div className="home-mobile__scroll-list">
            {topReadPosts.map((post, index) => (
              <Link
                key={`m-topread-${post.id}`}
                href={`/post/${post.id}`}
                onClick={() => onPostClick(post.id)}
                className="home-mobile__rank-row"
              >
                <span className="home-mobile__rank-number">{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="home-mobile__rank-title">{post.title}</span>
                  <span className="home-mobile__rank-meta">{getPostClicks(post)} क्लिक</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 10 — संसाधन */}
      <section className="home-mobile__section home-mobile__section--raised" id="m-resources">
        <div className="home-mobile__section-head">
          <span style={sectionLabelStyle}>संसाधन</span>
        </div>
        <div className="home-mobile__tabs">
          {([
            { key: "all", label: "सभी" },
            { key: "link", label: "लिंक" },
            { key: "pdf", label: "लाइब्रेरी" },
          ] as const).map((tab) => (
            <button
              key={`m-res-${tab.key}`}
              type="button"
              onClick={() => onResourceFilterChange(tab.key)}
              className={`home-mobile__chip${resourceFilter === tab.key ? " is-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {resources.length === 0 ? (
          <p className="home-mobile__empty">कोई संसाधन नहीं</p>
        ) : (
          <div className="home-mobile__scroll-list">
            {resources.map((resource) => (
              <button
                key={`m-resource-${resource.id}`}
                type="button"
                className="home-mobile__resource"
                onClick={() => onOpenResource(resource)}
              >
                {resource.title} {resource.type === "pdf" ? "(PDF)" : "(Link)"}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 11 — न्यूज़लेटर */}
      <section className="home-mobile__newsletter" id="m-newsletter">
        <div className="home-mobile__newsletter-title">न्यूज़लेटर</div>
        <p className="home-mobile__newsletter-copy">
          रोज़ शाम 7 बजे दिनभर की प्रमुख खबरें और विश्लेषण सीधे आपके ईमेल पर।
        </p>
        <form onSubmit={onNewsletterSubmit}>
          <input
            type="text"
            value={newsletterName}
            onChange={(event) => onNewsletterNameChange(event.target.value)}
            placeholder="आपका नाम"
          />
          <input
            type="tel"
            value={newsletterPhone}
            onChange={(event) => onNewsletterPhoneChange(event.target.value)}
            placeholder="फ़ोन नंबर"
          />
          <input
            type="email"
            value={newsletterEmail}
            onChange={(event) => onNewsletterEmailChange(event.target.value)}
            placeholder="आपका ईमेल"
          />
          <button type="submit" className="home-mobile__newsletter-cta">
            सदस्य बनें
          </button>
        </form>
        {newsletterMessage && <p className="home-mobile__newsletter-msg">{newsletterMessage}</p>}
      </section>

      {/* 12 — अभियान कैलेंडर */}
      <section className="home-mobile__section home-mobile__section--divided" id="m-abhiyan-calendar">
        <div className="home-mobile__section-head">
          <span style={sectionLabelStyle}>अभियान कैलेंडर</span>
          <span className="home-mobile__rule" />
          <button type="button" className="home-mobile__section-link" onClick={onOpenArchive}>
            आर्काइव →
          </button>
        </div>
        {events.length === 0 ? (
          <p className="home-mobile__empty">कोई आगामी ईवेंट नहीं</p>
        ) : (
          events.map((event) => (
            <button
              key={`m-event-${event.id}`}
              type="button"
              className="home-mobile__event"
              onClick={() => onOpenEvent(event)}
            >
              <span className="home-mobile__event-title">{event.title}</span>
              <span className="home-mobile__event-meta">
                {event.date ? `${formatDateWithDay(event.date)} • ${event.time}` : "तय होना बाकी है"}
                {event.location ? ` | ${event.location}` : ""}
              </span>
            </button>
          ))
        )}
      </section>

      {/* 13 — Footer */}
      <footer className="home-mobile__footer">
        <div className="home-mobile__footer-brand">
          <img
            src="/vaamki-logo.png"
            alt="वाम की आवाज़ लोगो"
            onError={(event) => {
              event.currentTarget.src = "/vercel.svg";
            }}
          />
          <span>वाम की आवाज़</span>
        </div>
        <p className="home-mobile__footer-tagline">{SITE_TAGLINE}</p>
        <div className="home-mobile__footer-social">
          <a href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" aria-label="Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
            </svg>
          </a>
          <a href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
              <path d="M23 12s0-3.4-.43-5.03a2.6 2.6 0 0 0-1.84-1.84C19.1 4.7 12 4.7 12 4.7s-7.1 0-8.73.43a2.6 2.6 0 0 0-1.84 1.84C1 8.6 1 12 1 12s0 3.4.43 5.03c.24.9.94 1.6 1.84 1.84 1.63.43 8.73.43 8.73.43s7.1 0 8.73-.43a2.6 2.6 0 0 0 1.84-1.84C23 15.4 23 12 23 12ZM9.75 15.27V8.73L15.5 12l-5.75 3.27Z" />
            </svg>
          </a>
          <a href="https://www.x.com/VaamKiAawaz" target="_blank" rel="noreferrer" aria-label="X">
            <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
              <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/VaamKiAawaz" target="_blank" rel="noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
              <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23a3.8 3.8 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 5.19a4.65 4.65 0 1 0 0 9.3 4.65 4.65 0 0 0 0-9.3Zm0 7.67a3.02 3.02 0 1 1 0-6.04 3.02 3.02 0 0 1 0 6.04Zm5.92-7.85a1.09 1.09 0 1 1-2.17 0 1.09 1.09 0 0 1 2.17 0Z" />
            </svg>
          </a>
        </div>
        <div className="home-mobile__footer-links">
          <div>
            <div className="home-mobile__footer-heading">मुख्य पन्ने</div>
            {[
              { label: "होम", value: "home" },
              { label: "ताज़ा खबरें", value: "latest" },
              { label: "आलेख", value: "add-news" },
              { label: "संसाधन", value: "resources" },
              { label: "न्यूज़लेटर", value: "newsletter" },
            ].map((link) => (
              <button key={`m-foot-${link.value}`} type="button" onClick={() => onNavTab(link.value)}>
                {link.label}
              </button>
            ))}
          </div>
          <div>
            <div className="home-mobile__footer-heading">जानकारी</div>
            {[
              { label: "हमारे बारे में", href: "/about-us" },
              { label: "संपादकीय नीति", href: "/editorial-policy" },
              { label: "सुधार नीति", href: "/corrections-policy" },
              { label: "गोपनीयता नीति", href: "/privacy-policy" },
              { label: "संपर्क करें", href: "/contact-us" },
            ].map((link) => (
              <Link key={`m-foot-${link.href}`} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="home-mobile__footer-copy">© 2026 वाम की आवाज़ — जन संघर्ष का डिजिटल पुरालेख</div>
      </footer>
      </div>

      {/* 14 — Bottom tab bar */}
      <nav className="home-mobile__tabbar" aria-label="मुख्य नेविगेशन">
        <button
          type="button"
          className={isSavedOpen || isFeedOpen ? undefined : "is-active"}
          onClick={() => {
            setIsSavedOpen(false);
            closeFeed();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Home size={24} />
          <span>होम</span>
        </button>
        <button
          type="button"
          className={isFeedOpen ? "is-active" : undefined}
          onClick={() => {
            setIsSavedOpen(false);
            openFeed();
          }}
        >
          <Play size={24} />
          <span>फीड</span>
        </button>
        {/* No dedicated search route exists; open the drawer that holds the search field.
            The drawer is portaled to document.body at z-index 100 (above the tab bar). */}
        <button
          type="button"
          className={isMenuOpen ? "is-active" : undefined}
          onClick={() => {
            if (isFeedOpen || isSavedOpen) {
              closeFeed();
              setIsSavedOpen(false);
              onOpenMenu();
              return;
            }
            onToggleMenu();
          }}
        >
          <Search size={24} />
          <span>खोजें</span>
        </button>
        <button
          type="button"
          className={isSavedOpen ? "is-active" : undefined}
          onClick={openSaved}
        >
          <Bookmark size={24} />
          <span>सहेजें</span>
        </button>
        {/* No profile route exists; reuse the existing auth entry point. */}
        <button type="button" onClick={onOpenAuth}>
          <User size={24} />
          <span>प्रोफ़ाइल</span>
        </button>
      </nav>

      {/* सहेजें — the logged-in account's saved articles, in ताज़ा खबरें card styling. */}
      {isSavedOpen && (
        <div className="home-mobile__saved" role="dialog" aria-label="सहेजे गए लेख" style={savedPanelStyle}>
          <div className="home-mobile__saved-head" style={savedHeadStyle}>
            <span style={sectionLabelStyle}>सहेजे गए लेख</span>
            <button
              type="button"
              onClick={() => setIsSavedOpen(false)}
              aria-label="बंद करें"
              style={savedCloseStyle}
            >
              <X size={18} />
            </button>
          </div>
          <div className="home-mobile__saved-body" style={savedBodyStyle}>
            {savedLoading && savedPosts.length === 0 ? (
              <p className="home-mobile__empty">लोड हो रहा है...</p>
            ) : savedPostIds.length === 0 ? (
              <p className="home-mobile__empty">आपने अभी कोई लेख नहीं सहेजा है।</p>
            ) : savedPosts.filter((post) => savedPostIds.includes(post.id)).length === 0 ? (
              <p className="home-mobile__empty">सहेजे गए लेख लोड नहीं हो सके। फिर कोशिश करें।</p>
            ) : (
              savedPosts
                .filter((post) => savedPostIds.includes(post.id))
                .map((post) => (
                  <div className="home-mobile__saved-item" key={`m-saved-${post.id}`}>
                    <Link
                      href={`/post/${post.id}`}
                      onClick={() => onPostClick(post.id)}
                      className="home-mobile__row-card"
                    >
                      <span className="home-mobile__row-media">
                        {getPreviewImage(post) && (
                          <img
                            src={getPreviewImage(post)!}
                            alt={post.title}
                            style={{ objectPosition: focusToObjectPosition(resolveImageFocus(post, "card")) }}
                          />
                        )}
                      </span>
                      <span className="home-mobile__row-body">
                        <span className={`cat-pill ${getCategoryClass(post.category)}`}>{post.category}</span>
                        <span className="home-mobile__row-title">{post.title}</span>
                        <span className="home-mobile__row-meta">
                          {post.author} · {getPostTimeLabel(post)} · {getPostClicks(post)} क्लिक
                        </span>
                        <span className="home-mobile__read-more">पूरा लेख पढ़ें →</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="home-mobile__saved-remove"
                      onClick={() => onToggleSavedPost(post.id)}
                      style={savedRemoveStyle}
                    >
                      <BookmarkCheck size={14} />
                      <span>हटाएं</span>
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* फीड — the same hero slide card, ranked by device-local category affinity, swiped
          vertically. Opens and closes exactly like the सहेजें sheet, so the homepage stays
          mounted behind it and keeps its scroll position. */}
      {isFeedOpen && (
        <div className="home-mobile__feed" role="dialog" aria-label="फीड" style={feedPanelStyle}>
          <div style={savedHeadStyle}>
            <div style={feedTabSwitcherStyle}>
              <button
                type="button"
                style={feedTabBtnStyle(feedTab === "forYou")}
                onClick={() => void activateFeedTab("forYou")}
              >
                आपके लिए
              </button>
              <button
                type="button"
                style={feedTabBtnStyle(feedTab === "following")}
                onClick={() => void activateFeedTab("following")}
              >
                फॉलो किए गए
              </button>
            </div>
            <button
              type="button"
              onClick={closeFeed}
              aria-label="बंद करें"
              style={savedCloseStyle}
            >
              <X size={18} />
            </button>
          </div>
          {feedTab === "following" && !isLoggedIn ? (
            <div style={savedBodyStyle}>
              <p className="home-mobile__empty">फॉलो किए गए लेखक देखने के लिए लॉग इन करें।</p>
            </div>
          ) : feedTab === "following" && followedAuthorIds.length === 0 ? (
            <div style={savedBodyStyle}>
              <p className="home-mobile__empty">आप अभी किसी लेखक को फॉलो नहीं करते।</p>
            </div>
          ) : feedTab === "following" && followedFeedLoading && feedItems.length === 0 ? (
            <div style={savedBodyStyle}>
              <p className="home-mobile__empty">लोड हो रहा है...</p>
            </div>
          ) : feedItems.length === 0 ? (
            <div style={savedBodyStyle}>
              <p className="home-mobile__empty">फीड तैयार हो रही है...</p>
            </div>
          ) : (
            <div
              className="no-visible-scrollbar"
              ref={feedTrackRef}
              onScroll={handleFeedScroll}
              style={feedTrackStyle}
            >
              {feedItems.map((story, index) => (
                <HeroSlide
                  key={`m-feed-${index}-${story.id}`}
                  story={story}
                  image={getPreviewImage(story)}
                  isSaved={isSaved(story.id)}
                  onToggleSavedPost={onToggleSavedPost}
                  onPostClick={handleFeedPostClick}
                  onShare={sharePost}
                  getPostTimeLabel={getPostTimeLabel}
                  getPostClicks={getPostClicks}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="home-mobile__toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
