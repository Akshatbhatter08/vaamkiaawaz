"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { LogIn, LogOut, Menu, ShieldCheck, X, Share2, Languages, Link as LinkIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";
import { TiptapEditor } from "@/components/TiptapEditor";
import { ArticleRichText } from "@/utils/sanitizeHtml";
import { getCategoryClass, formatViews, readingTime } from "@/utils/designUtils";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleCard } from "@/components/ArticleCard";
import { ImageCropModal } from "@/components/ImageCropModal";
import { focusToObjectPosition, compressImageFile } from "@/lib/imageCrop";
import { resolvePostImage } from "@/lib/postImage";
import { uploadDataUrl, uploadMediaFile } from "@/lib/uploadClient";
import { formatAuthorDisplayName, parsePenNameFromPermissions, resolveAuthorListName, type PenNameDisplayMode } from "@/lib/penName";
import { formatBilingualDate, formatUploaderDisplay, LIVE_COVERAGE_URL, SITE_TAGLINE, SITE_TAGLINE_LINES } from "@/lib/siteConstants";
import { GoToTopButton } from "@/components/GoToTopButton";
import "react-quill-new/dist/quill.snow.css";

const cleanHtml = (html: string | undefined | null) => {
  if (!html) return "";
  // Strip zero-width chars and replace non-breaking spaces with normal spaces
  return html
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ");
};

export type NewsPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  postImage?: string | null;
  imageFocus?: string | null;
  authorImage?: string | null;
  time: string;
  createdAt?: string;
  clickCount?: number;
  uploaderName?: string | null;
  source?: "static" | "blog";
};

export type PlatformResource = {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  fileData?: string | null;
  createdAt: string;
};

type ApiBlogPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  postImage: string | null;
  imageFocus?: string | null;
  authorImage: string | null;
  clickCount: number;
  uploaderName?: string | null;
  createdAt: string;
};

type ApiAuthUser = {
  id: string;
  email: string;
  role: "MASTER_ADMIN" | "ADMIN" | "CONTRIBUTOR";
  active?: boolean;
  permissions?: Record<string, unknown> | null;
};

type AuthorProfile = {
  name: string;
  image: string | null;
};

type Role = "master" | "admin" | "contributor";

type PermissionKey =
  | "manageHomepage"
  | "publishBlog"
  | "manageCategories"
  | "manageNewsletter"
  | "manageUsers";

type Permissions = Record<PermissionKey, boolean>;

type UserAccount = {
  id: string;
  role: Role;
  email: string;
  // password: string;
  active: boolean;
  permissions: Permissions;
  authorName: string;
  authorImage: string | null;
  penNameEnabled: boolean;
  penName: string;
  penNameDisplayMode: PenNameDisplayMode;
};

const MASTER_AUTHOR_NAME = "केशव कुमार भट्टड़ ";
const THEME_STORAGE_KEY = "vaamki-aawaz-theme";
const POST_CLICKS_STORAGE_KEY = "vaamki-aawaz-post-clicks";
const MANAGED_CATEGORIES_STORAGE_KEY = "vaamki-aawaz-managed-categories";
const HIDDEN_CATEGORIES_STORAGE_KEY = "vaamki-aawaz-hidden-categories";
const DEFAULT_CATEGORIES = ["साहित्य-संस्कृति", "अतिथि लेखन"] as const;
const CATEGORY_LABEL_MAP: Record<string, string> = {
  "महिला मुद्दे": "आधी आबादी",
};
const normalizeCategoryLabel = (value: string) => {
  const normalizedValue = value.trim();
  return CATEGORY_LABEL_MAP[normalizedValue] ?? normalizedValue;
};

const noPermissions = (): Permissions => ({
  manageHomepage: false,
  publishBlog: false,
  manageCategories: false,
  manageNewsletter: false,
  manageUsers: false,
});

const normalizeAuthorName = (value: string) => value.trim().toLowerCase();

const parsePermissionFlags = (permissions: Record<string, unknown> | null | undefined): Permissions => ({
  manageHomepage: permissions?.manageHomepage === true,
  publishBlog: permissions?.publishBlog === true,
  manageCategories: permissions?.manageCategories === true,
  manageNewsletter: permissions?.manageNewsletter === true,
  manageUsers: permissions?.manageUsers === true,
});

const parseAuthorProfileFromPermissions = (permissions: Record<string, unknown> | null | undefined) => {
  const rawName = typeof permissions?.authorName === "string" ? permissions.authorName.trim() : "";
  const rawImage = typeof permissions?.authorImage === "string" ? permissions.authorImage.trim() : "";
  const penSettings = parsePenNameFromPermissions(permissions);
  return {
    authorName: rawName,
    authorImage: rawImage || null,
    penNameEnabled: penSettings.penNameEnabled,
    penName: penSettings.penName,
    penNameDisplayMode: penSettings.penNameDisplayMode,
  };
};

const mapApiUserToAccount = (user: ApiAuthUser): UserAccount => {
  let permissionsObject: Record<string, unknown> | null = null;
  try {
    permissionsObject = typeof user.permissions === "string"
      ? JSON.parse(user.permissions)
      : (user.permissions ?? null) as Record<string, unknown> | null;
  } catch { permissionsObject = null; }
  const authorProfile = parseAuthorProfileFromPermissions(permissionsObject);
  return {
    id: user.id,
    role: user.role === "MASTER_ADMIN" ? "master" : user.role === "ADMIN" ? "admin" : "contributor",
    email: user.email,
    // password: "",
    active: user.active ?? true,
    permissions: parsePermissionFlags(permissionsObject),
    authorName: authorProfile.authorName,
    authorImage: authorProfile.authorImage,
    penNameEnabled: authorProfile.penNameEnabled,
    penName: authorProfile.penName,
    penNameDisplayMode: authorProfile.penNameDisplayMode,
  };
};

const permissionLabels: { key: PermissionKey; label: string }[] = [
  { key: "manageHomepage", label: "होमपेज नियंत्रण" },
  { key: "publishBlog", label: "ब्लॉग प्रकाशित करना" },
  { key: "manageCategories", label: "कैटेगरी नियंत्रण" },
  { key: "manageNewsletter", label: "न्यूज़लेटर नियंत्रण" },
  { key: "manageUsers", label: "यूज़र मैनेजमेंट" },
];

const opinionPieces: string[] = [];

const formatDate = formatBilingualDate;

type MovementStatus = "active" | "strike" | "success";
const movementTracker: {
  name: string;
  location: string;
  startDate: string;
  description: string;
  status: MovementStatus;
  statusLabel: string;
}[] = [
  { name: "किसान आंदोलन", location: "दिल्ली सीमा", startDate: "नवंबर 2024", description: "न्यूनतम समर्थन मूल्य की कानूनी गारंटी की मांग जारी।", status: "active", statusLabel: "सक्रिय" },
  { name: "आशा कर्मी हड़ताल", location: "महाराष्ट्र", startDate: "जनवरी 2026", description: "वेतन और स्थायीकरण को लेकर राज्यव्यापी हड़ताल।", status: "strike", statusLabel: "हड़ताल" },
  { name: "मनरेगा मज़दूर मोर्चा", location: "झारखंड", startDate: "मार्च 2026", description: "बकाया भुगतान और कार्यदिवस बढ़ाने की माँग।", status: "active", statusLabel: "सक्रिय" },
  { name: "शिक्षक भर्ती संघर्ष", location: "उत्तर प्रदेश", startDate: "दिसंबर 2025", description: "लंबित नियुक्तियों पर अदालती फैसले के बाद आंशिक जीत।", status: "success", statusLabel: "आंशिक जीत" },
];

const resistanceSlogans =
  "इंकलाब ज़िंदाबाद \u00A0\u00A0✊\u00A0\u00A0 मेहनतकश एक हों \u00A0\u00A0✊\u00A0\u00A0 न्याय, समानता, प्रगति \u00A0\u00A0✊\u00A0\u00A0 उठो ! बोलो ! बदलो ! \u00A0\u00A0✊\u00A0\u00A0 जन संघर्ष जारी है \u00A0\u00A0✊\u00A0\u00A0 हम न रुकेंगे, न झुकेंगे \u00A0\u00A0✊\u00A0\u00A0 संविधान बचाओ \u00A0\u00A0✊\u00A0\u00A0 लोकतंत्र हमारा अधिकार है \u00A0\u00A0✊\u00A0\u00A0 विकल्प की आवाज़ \u00A0\u00A0✊\u00A0\u00A0 ";

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

const transliterate = (text: string) =>
  text
    .split("")
    .map((char) => devanagariToLatin[char] ?? char)
    .join("")
    .toLowerCase();

const normalizeForSearch = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeRomanized = (text: string) =>
  text
    .toLowerCase()
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/\s+/g, " ")
    .trim();

const stripLatinVowels = (text: string) => text.replace(/[aeiou]/g, "");

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const inferDateKeyFromTime = (timeLabel: string) => {
  const now = new Date();
  if (timeLabel.includes("कल")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }
  const minuteMatch = timeLabel.match(/(\d+)\s*मिनट/);
  if (minuteMatch) {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - Number(minuteMatch[1]));
    return toDateKey(d);
  }
  const hourMatch = timeLabel.match(/(\d+)\s*घंट/);
  if (hourMatch) {
    const d = new Date(now);
    d.setHours(d.getHours() - Number(hourMatch[1]));
    return toDateKey(d);
  }
  const dayMatch = timeLabel.match(/(\d+)\s*दिन/);
  if (dayMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - Number(dayMatch[1]));
    return toDateKey(d);
  }
  return toDateKey(now);
};

const formatRelativeTime = (isoDate: string) => {
  const parsed = new Date(isoDate).getTime();
  if (Number.isNaN(parsed)) {
    return "अभी";
  }
  const diffMs = Date.now() - parsed;
  if (diffMs <= 20 * 1000) {
    return "अभी";
  }
  if (diffMs < 60 * 1000) {
    return "कुछ पल पहले";
  }
  if (diffMs < 60 * 60 * 1000) {
    return "कुछ मिनट पहले";
  }
  if (diffMs < 24 * 60 * 60 * 1000) {
    return "कुछ घंटे पहले";
  }
  return new Date(parsed).toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const mapApiBlogToNewsPost = (post: ApiBlogPost): NewsPost => ({
  id: post.id,
  category: normalizeCategoryLabel(post.category),
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  postImage: post.postImage,
  imageFocus: post.imageFocus ?? null,
  authorImage: post.authorImage,
  time: formatRelativeTime(post.createdAt),
  createdAt: post.createdAt,
  clickCount: post.clickCount,
  uploaderName: post.uploaderName,
  source: "blog",
});

const getPostCreatedAtMs = (post: NewsPost) => {
  if (post.createdAt) {
    const parsed = new Date(post.createdAt).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const getPostSortTimestamp = (post: NewsPost) => {
  const createdAtMs = getPostCreatedAtMs(post);
  if (createdAtMs > 0) {
    return createdAtMs;
  }
  const now = Date.now();
  if (post.time.includes("अभी")) {
    return now - 30 * 1000;
  }
  if (post.time.includes("कुछ पल")) {
    return now - 60 * 1000;
  }
  if (post.time.includes("आज")) {
    return now - 60 * 60 * 1000;
  }
  if (post.time.includes("कल")) {
    return now - 24 * 60 * 60 * 1000;
  }
  const minuteMatch = post.time.match(/(\d+)\s*मिनट/);
  if (minuteMatch) {
    return now - Number(minuteMatch[1]) * 60 * 1000;
  }
  const hourMatch = post.time.match(/(\d+)\s*घंट/);
  if (hourMatch) {
    return now - Number(hourMatch[1]) * 60 * 60 * 1000;
  }
  const dayMatch = post.time.match(/(\d+)\s*दिन/);
  if (dayMatch) {
    return now - Number(dayMatch[1]) * 24 * 60 * 60 * 1000;
  }
  return 0;
};

const normalizeCategoryName = (value: string) => value.trim().toLowerCase();

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 1 0 20 14.5z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
  </svg>
);

// const FacebookIcon = () => (
//   <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
//     <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z" />
//   </svg>
// );

const FacebookIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.25) translate(0 -5)">
      <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z" />
    </g>
  </svg>
);

// const YoutubeIcon = () => (
//   <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
//     <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1L10 15.1z" />
//   </svg>
// );

const YoutubeIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.1) translate(0 -2)">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1L10 15.1z" />
    </g>
  </svg>
);

const TwitterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <g transform="scale(1.03) translate(0 -2)">
      <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.3L6.5 22H3.4l7.3-8.3L1 2h6.2l4.3 5.7L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
    </g>
  </svg>
);

const InstagramIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <g transform="scale(1.03) translate(0 -2)">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </g>
  </svg>
);

export default function ClientPage({ 
  initialBlogs, 
  initialTopBlogs = [],
  initialEvents = [],
  initialResources = [],
  initialFeaturedVicharIds = [],
}: { 
  initialBlogs: NewsPost[], 
  initialTopBlogs?: NewsPost[],
  initialEvents?: any[],
  initialResources?: any[],
  initialFeaturedVicharIds?: string[],
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isScrolledHeader, setIsScrolledHeader] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isParichayVisible, setIsParichayVisible] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("सभी");
  const [selectedAuthor, setSelectedAuthor] = useState("");
  const [selectedNewsDate, setSelectedNewsDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newsVisibleCount, setNewsVisibleCount] = useState(24);
  const [blogVisibleCount, setBlogVisibleCount] = useState(24);
  const [blogs, setBlogs] = useState<NewsPost[]>(initialBlogs);
  const [topBlogs, setTopBlogs] = useState<NewsPost[]>(initialTopBlogs);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [managedCategories, setManagedCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showTranslate, setShowTranslate] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("home");
  const [resourceFilter, setResourceFilter] = useState<"all" | "link" | "pdf">("all");
  const [featuredVicharIds, setFeaturedVicharIds] = useState<string[]>(initialFeaturedVicharIds);
  const [historicEventModalOpen, setHistoricEventModalOpen] = useState(false);
  const [historicEventData, setHistoricEventData] = useState<{
    title: string;
    date: string;
    year: number | null;
    description: string;
    wikiUrl?: string | null;
  } | null>(null);
  const [historicEventLoading, setHistoricEventLoading] = useState(false);
  const [todayKaryakramOpen, setTodayKaryakramOpen] = useState(false);
  const translateRef = useRef<HTMLDivElement | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as { users: ApiAuthUser[] };
        setUsers(data.users.map(mapApiUserToAccount));
      }
    } catch (err) {}
  };
  const fetchAuthors = async () => {
    try {
      const response = await fetch("/api/authors", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch authors");
      }
      const data = (await response.json()) as { authors?: AuthorProfile[] };
      if (!Array.isArray(data.authors)) {
        throw new Error("Invalid author payload");
      }
      const sanitizedAuthors = data.authors
        .map((author) => ({
          name: author.name.trim(),
          image: author.image && author.image.trim() ? author.image.trim() : null,
        }))
        .filter((author) => author.name.length > 0);
      setAvailableAuthors(sanitizedAuthors);
    } catch {
      setAvailableAuthors([]);
    }
  };
  const [sessionEmail, setSessionEmail] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [newAdminForm, setNewAdminForm] = useState({
    email: "",
    password: "",
    permissions: noPermissions(),
    authorName: "",
    authorImage: "",
  });
  const [newContributorForm, setNewContributorForm] = useState({
    email: "",
    password: "",
    authorName: "",
    authorImage: "",
  });
  const [masterAuthorForm, setMasterAuthorForm] = useState({
    authorName: MASTER_AUTHOR_NAME,
    authorImage: "",
    penNameEnabled: false,
    penName: "",
    penNameDisplayMode: "alongside" as PenNameDisplayMode,
  });
  const [selfPenNameForm, setSelfPenNameForm] = useState({
    penNameEnabled: false,
    penName: "",
    penNameDisplayMode: "alongside" as PenNameDisplayMode,
  });
  const [availableAuthors, setAvailableAuthors] = useState<AuthorProfile[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterPhone, setNewsletterPhone] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [otpModalState, setOtpModalState] = useState<{
    isOpen: boolean;
    email: string;
    context: "newsletter" | "admin" | "contributor";
    payload?: any;
    isLoading?: boolean;
    error?: string;
  }>({ isOpen: false, email: "", context: "newsletter" });
  const [otpCode, setOtpCode] = useState("");

  type AbhiyanEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    details: string;
    imageUrl?: string;
  };
  const [events, setEvents] = useState<AbhiyanEvent[]>(initialEvents);
  const [activeEvent, setActiveEvent] = useState<AbhiyanEvent | null>(null);
  const [newEventForm, setNewEventForm] = useState({ title: '', date: '', time: '', location: '', details: '', imageUrl: '' });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventArchiveModalOpen, setEventArchiveModalOpen] = useState(false);
  const [archiveDate, setArchiveDate] = useState("");

  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return 'तय होना बाकी है';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    return `${days[d.getDay()]}, ${d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  };

  const [resources, setResources] = useState<PlatformResource[]>(initialResources);
  const [newResourceForm, setNewResourceForm] = useState({ title: '', type: 'link', url: '', fileData: '' });
  const [activeResource, setActiveResource] = useState<PlatformResource | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  const [blogMessage, setBlogMessage] = useState("");
  const [blogSyncMessage, setBlogSyncMessage] = useState("");
  const [postClicks, setPostClicks] = useState<Record<string, number>>({});
  const router = useRouter();
  const [previewPost, setPreviewPost] = useState<NewsPost | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledToAnchor = useRef(false);
  const clickedPostIds = useRef(new Set<string>());

  const handlePostClick = (postId: string) => {
    if (!clickedPostIds.current.has(postId)) {
      clickedPostIds.current.add(postId);
      setBlogs((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, clickCount: (item.clickCount ?? 0) + 1 } : item
        )
      );
    }
  };

  const [formState, setFormState] = useState({
    title: "",
    author: "",
    category: "ब्लॉग",
    excerpt: "",
    content: "",
    postImage: "",
    imageFocus: "",
    authorImage: "",
  });

  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("vaamkiaawaz_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.content || parsed.excerpt || parsed.title) {
          setFormState((prev) => ({
            ...prev,
            ...parsed,
            postImage: typeof parsed.postImage === "string" ? parsed.postImage : "",
            imageFocus: typeof parsed.imageFocus === "string" ? parsed.imageFocus : "",
            authorImage: typeof parsed.authorImage === "string" ? parsed.authorImage : "",
          }));
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("vaamkiaawaz_draft", JSON.stringify(formState));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formState]);


  useEffect(() => {
    const placeholder = document.getElementById("translate_placeholder");
    const translateEl = document.getElementById("google_translate_element");
    if (placeholder && translateEl) {
      placeholder.appendChild(translateEl);
    }
    return () => {
      const container = document.getElementById("google_translate_container");
      if (container && translateEl) {
        container.appendChild(translateEl);
      }
    };
  }, []);

  useEffect(() => {
    if (!showTranslate) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !translateRef.current) return;
      if (!translateRef.current.contains(target)) {
        setShowTranslate(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [showTranslate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (!tab) return;
    if (tab === "parichay") {
      setIsParichayVisible(true);
      setActiveNavTab("parichay");
      return;
    }
    if (tab === "abhiyan-archive") {
      setEventArchiveModalOpen(true);
      return;
    }
    if (tab === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setActiveNavTab("home");
      return;
    }
    setActiveNavTab(tab);
    const timer = window.setTimeout(() => scrollToSection(tab), 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("openLoginModal") === "true") {
      sessionStorage.removeItem("openLoginModal");
      setIsAuthModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    // Check for ?event=... in URL instantly on load
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("event");
      if (eventId && events.length > 0) {
        const targetEvent = events.find((e: any) => e.id === eventId);
        if (targetEvent && !activeEvent) {
          setActiveEvent(targetEvent);
        }
      }
    }
    
    // Resources are now passed as props, no need to fetch client-side
    
    fetchUsers();
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          const currentUser = mapApiUserToAccount(data.user as ApiAuthUser);
          setSessionEmail(currentUser.email);
          setUsers((prev) => {
            const withoutCurrent = prev.filter((item) => item.email.toLowerCase() !== currentUser.email.toLowerCase());
            return [currentUser, ...withoutCurrent];
          });
        }
      })
      .catch(() => {});

    const savedPostClicks = localStorage.getItem(POST_CLICKS_STORAGE_KEY);
    if (savedPostClicks) {
      const parsedClicks = JSON.parse(savedPostClicks) as Record<string, number>;
      if (parsedClicks && typeof parsedClicks === "object") {
        setPostClicks(parsedClicks);
      }
    }
    
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (data.categories) {
            const managed: string[] = [...DEFAULT_CATEGORIES];
            const hidden: string[] = [];
            data.categories.forEach((cat: any) => {
              if (cat.isHidden) {
                hidden.push(cat.name);
              } else {
                managed.push(cat.name);
              }
            });
            setManagedCategories(Array.from(new Set(managed)));
            setHiddenCategories(Array.from(new Set(hidden)));
          }
        }
      } catch (err) {}
    };
    loadCategories();
  }, []);

  useEffect(() => {
    void fetchAuthors();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(POST_CLICKS_STORAGE_KEY, JSON.stringify(postClicks));
  }, [postClicks]);

  useEffect(() => {
    localStorage.setItem(MANAGED_CATEGORIES_STORAGE_KEY, JSON.stringify(managedCategories));
  }, [managedCategories]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_CATEGORIES_STORAGE_KEY, JSON.stringify(hiddenCategories));
  }, [hiddenCategories]);

  useEffect(() => {
    let ticking = false;
    let lastCompact = "";

    const update = () => {
      const isScrolled = window.scrollY > 12;
      const compact = isScrolled ? "1" : "0";
      
      if (lastCompact !== compact) {
        lastCompact = compact;
        if (stickyHeaderRef.current) {
          stickyHeaderRef.current.style.setProperty("--compact-progress", compact);
        }
      }
      
      setIsScrolledHeader((prev) => (prev === isScrolled ? prev : isScrolled));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);



  useEffect(() => {
    if (!isCategoryMenuOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (categoryMenuRef.current?.contains(target)) {
        return;
      }
      setIsCategoryMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isCategoryMenuOpen]);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const response = await fetch("/api/blogs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = (await response.json()) as { posts: ApiBlogPost[], topPosts?: ApiBlogPost[] };
        if (Array.isArray(data.posts)) {
          setBlogs(data.posts.map(mapApiBlogToNewsPost));
          if (Array.isArray(data.topPosts)) {
            setTopBlogs(data.topPosts.map(mapApiBlogToNewsPost));
          }
          setBlogSyncMessage("");
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? `सर्वर से लाइव पोस्ट लोड नहीं हो सकीं (${error.message}). इस डिवाइस पर फिलहाल कैश की गई पोस्ट दिखाई जा रही हैं।`
            : "सर्वर से लाइव पोस्ट लोड नहीं हो सकीं। इस डिवाइस पर फिलहाल कैश की गई पोस्ट दिखाई जा रही हैं।";
        setBlogSyncMessage(message);
      }
    };
    void loadBlogs();
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => user.email.toLowerCase() === sessionEmail.toLowerCase()),
    [sessionEmail, users],
  );

  useEffect(() => {
    if (!currentUser || currentUser.role !== "master") {
      return;
    }
    setMasterAuthorForm({
      authorName: currentUser.authorName.trim() || MASTER_AUTHOR_NAME,
      authorImage: currentUser.authorImage?.trim() || "",
      penNameEnabled: currentUser.penNameEnabled,
      penName: currentUser.penName,
      penNameDisplayMode: currentUser.penNameDisplayMode,
    });
  }, [currentUser]);

  const canPublishBlog = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === "master") {
      return true;
    }
    if (currentUser.role === "admin") {
      return currentUser.permissions.publishBlog;
    }
    return currentUser.active;
  }, [currentUser]);

  const currentUserAuthorListName = useMemo(() => {
    if (!currentUser || !canPublishBlog) {
      return "";
    }
    return resolveAuthorListName(
      {
        authorName: currentUser.authorName,
        penNameEnabled: currentUser.penNameEnabled,
        penName: currentUser.penName,
        penNameDisplayMode: currentUser.penNameDisplayMode,
      },
      currentUser.role === "master" ? MASTER_AUTHOR_NAME : "",
    );
  }, [currentUser, canPublishBlog]);

  useEffect(() => {
    if (availableAuthors.length === 0) {
      return;
    }

    const ownAuthor = currentUserAuthorListName
      ? availableAuthors.find(
          (author) => normalizeAuthorName(author.name) === normalizeAuthorName(currentUserAuthorListName),
        )
      : undefined;

    if (!formState.author) {
      const selected = ownAuthor ?? availableAuthors[0];
      setFormState((prev) => ({
        ...prev,
        author: selected.name,
        authorImage: selected.image ?? "",
      }));
      return;
    }

    const matchedAuthor = availableAuthors.find(
      (author) => normalizeAuthorName(author.name) === normalizeAuthorName(formState.author),
    );
    if (!matchedAuthor && ownAuthor) {
      setFormState((prev) => ({
        ...prev,
        author: ownAuthor.name,
        authorImage: ownAuthor.image ?? "",
      }));
      return;
    }
    if (matchedAuthor && formState.authorImage !== (matchedAuthor.image ?? "")) {
      setFormState((prev) => ({ ...prev, authorImage: matchedAuthor.image ?? "" }));
    }
  }, [availableAuthors, formState.author, formState.authorImage, currentUserAuthorListName]);

  useEffect(() => {
    if (!currentUser || currentUser.role === "master") {
      return;
    }
    if (!canPublishBlog) {
      return;
    }
    setSelfPenNameForm({
      penNameEnabled: currentUser.penNameEnabled,
      penName: currentUser.penName,
      penNameDisplayMode: currentUser.penNameDisplayMode,
    });
  }, [currentUser, canPublishBlog]);

  const canManageUsers = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === "master") {
      return true;
    }
    return currentUser.role === "admin" && currentUser.permissions.manageUsers;
  }, [currentUser]);

  const canManageCategories = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === "master") {
      return true;
    }
    return currentUser.role === "admin" && currentUser.permissions.manageCategories;
  }, [currentUser]);
  const canRemoveArticle = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === "master") {
      return true;
    }
    return currentUser.role === "admin" && currentUser.permissions.publishBlog && currentUser.permissions.manageHomepage;
  }, [currentUser]);

  const isMaster = currentUser?.role === "master";

  const filteredNews = useMemo(() => {
    const q = normalizeForSearch(searchTerm);
    const qLatin = transliterate(q);
    const qRoman = normalizeRomanized(qLatin);
    const qSkeleton = stripLatinVowels(qRoman);
    const source = [...blogs];
    const searched = !q
      ? source
      : source.filter((post) => {
          const raw = normalizeForSearch([post.title, post.excerpt, post.category, post.author].join(" "));
          const latin = transliterate(raw);
          const roman = normalizeRomanized(latin);
          const skeleton = stripLatinVowels(roman);
          return (
            raw.includes(q) ||
            latin.includes(q) ||
            latin.includes(qLatin) ||
            roman.includes(qRoman) ||
            skeleton.includes(qSkeleton)
          );
        });
    const categoryFiltered =
      selectedCategory === "सभी" ? searched : searched.filter((post) => post.category === selectedCategory);
    const authorFiltered = selectedAuthor
      ? categoryFiltered.filter((post) => normalizeCategoryName(post.author) === normalizeCategoryName(selectedAuthor))
      : categoryFiltered;
    const dateFiltered = selectedNewsDate
      ? authorFiltered.filter((post) => {
          if (post.createdAt) {
            const parsed = new Date(post.createdAt);
            if (!Number.isNaN(parsed.getTime())) {
              return toDateKey(parsed) === selectedNewsDate;
            }
          }
          return inferDateKeyFromTime(post.time) === selectedNewsDate;
        })
      : authorFiltered;
    return [...dateFiltered].sort((a, b) => getPostSortTimestamp(b) - getPostSortTimestamp(a));
  }, [blogs, searchTerm, selectedAuthor, selectedCategory, selectedNewsDate]);

  const featuredForDisplay = useMemo(() => filteredNews.slice(0, 3), [filteredNews]);
  const feedPosts = useMemo(() => filteredNews, [filteredNews]);
  const visibleFeedPosts = useMemo(
    () => feedPosts.slice(0, newsVisibleCount),
    [feedPosts, newsVisibleCount],
  );

  const threeMinutePosts = useMemo(
    () =>
      filteredNews
        .filter((post) => readingTime(post.content || post.excerpt || "") <= 3)
        .slice(0, 10),
    [filteredNews],
  );

  const pramukhVicharPosts = useMemo(() => {
    if (featuredVicharIds.length === 0) return [];
    const byId = new Map(filteredNews.map((post) => [post.id, post]));
    return featuredVicharIds.map((id) => byId.get(id)).filter((post): post is NewsPost => Boolean(post));
  }, [featuredVicharIds, filteredNews]);

  const filteredResources = useMemo(() => {
    if (resourceFilter === "all") return resources;
    return resources.filter((res) => res.type === resourceFilter);
  }, [resources, resourceFilter]);

  const todayEvents = useMemo(() => {
    const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return events.filter((ev) => ev.date === todayStr);
  }, [events]);

  const topReadPosts = useMemo(() => {
    // Merge blogs and topBlogs to ensure globally top clicked articles are considered
    const allPosts = new Map<string, NewsPost>();
    blogs.forEach((post) => allPosts.set(post.id, post));
    topBlogs.forEach((post) => allPosts.set(post.id, post));

    return Array.from(allPosts.values())
      .sort((a, b) => {
        const clicksA = a.source === "blog" ? (a.clickCount ?? 0) : (postClicks[a.id] ?? 0);
        const clicksB = b.source === "blog" ? (b.clickCount ?? 0) : (postClicks[b.id] ?? 0);
        return clicksB - clicksA;
      })
      .slice(0, 4);
  }, [blogs, topBlogs, postClicks]);

  const filteredEvents = useMemo(() => {
    // Get today's date in YYYY-MM-DD for IST
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return events
      .filter((ev) => ev.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [events]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((post) => {
      set.add(normalizeCategoryLabel(post.category));
    });
    DEFAULT_CATEGORIES.forEach((category) => {
      set.add(category);
    });
    managedCategories.forEach((category) => {
      set.add(normalizeCategoryLabel(category));
    });
    const hidden = new Set(hiddenCategories.map(normalizeCategoryName));
    const sorted = Array.from(set).filter((category) => !hidden.has(normalizeCategoryName(category)));
    return ["सभी", ...sorted];
  }, [blogs, managedCategories, hiddenCategories]);

  useEffect(() => {
    if (!allCategories.includes(selectedCategory)) {
      setSelectedCategory("सभी");
    }
  }, [allCategories, selectedCategory]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash && !hasScrolledToAnchor.current) {
      if (blogs.length > 0 || events.length > 0 || resources.length > 0) {
        const hash = window.location.hash.substring(1);
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
            window.history.replaceState(null, '', window.location.pathname);
          }, 300);
          hasScrolledToAnchor.current = true;
        }
      }
    }
  }, [blogs, events, resources]);

  const filteredBlogs = useMemo(() => {
    const q = normalizeForSearch(searchTerm);
    const qLatin = transliterate(q);
    const qRoman = normalizeRomanized(qLatin);
    const qSkeleton = stripLatinVowels(qRoman);
    const searched = !q
      ? blogs
      : blogs.filter((post) => {
          const raw = normalizeForSearch([post.title, post.excerpt, post.category, post.author].join(" "));
          const latin = transliterate(raw);
          const roman = normalizeRomanized(latin);
          const skeleton = stripLatinVowels(roman);
          return (
            raw.includes(q) ||
            latin.includes(q) ||
            latin.includes(qLatin) ||
            roman.includes(qRoman) ||
            skeleton.includes(qSkeleton)
          );
        });
    const categoryFiltered =
      selectedCategory === "सभी" ? searched : searched.filter((post) => post.category === selectedCategory);
    const authorFiltered = selectedAuthor
      ? categoryFiltered.filter((post) => normalizeCategoryName(post.author) === normalizeCategoryName(selectedAuthor))
      : categoryFiltered;
    return [...authorFiltered].sort((a, b) => getPostCreatedAtMs(b) - getPostCreatedAtMs(a));
  }, [blogs, searchTerm, selectedAuthor, selectedCategory]);
  const visibleBlogs = useMemo(() => filteredBlogs.slice(0, blogVisibleCount), [filteredBlogs, blogVisibleCount]);
  const adminAccounts = useMemo(() => users.filter((user) => user.role === "admin"), [users]);
  const contributorAccounts = useMemo(() => users.filter((user) => user.role === "contributor"), [users]);
  const authorProfilesByName = useMemo(() => {
    return availableAuthors.reduce<Map<string, AuthorProfile>>((acc, author) => {
      acc.set(normalizeAuthorName(author.name), author);
      return acc;
    }, new Map());
  }, [availableAuthors]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginMessage(data.error || "गलत ईमेल या पासवर्ड।");
        return;
      }
      const loggedInUser = mapApiUserToAccount(data.user as ApiAuthUser);
      setSessionEmail(loggedInUser.email);
      setUsers((prev) => {
        const withoutCurrent = prev.filter((item) => item.email.toLowerCase() !== loggedInUser.email.toLowerCase());
        return [loggedInUser, ...withoutCurrent];
      });
      setLoginMessage(`स्वागत है ${loggedInUser.email}`);
      setLoginForm({ email: "", password: "" });
      void fetchUsers();
    } catch (err) {
      setLoginMessage("लॉगिन विफल।");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSessionEmail("");
    setLoginMessage("सफलतापूर्वक लॉगआउट किया गया।");
  };

  const executeAddAdmin = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminForm.email.trim(),
          password: newAdminForm.password.trim(),
          role: "ADMIN",
          permissions: newAdminForm.permissions,
          authorName: newAdminForm.authorName.trim(),
          authorImage: newAdminForm.permissions.publishBlog ? newAdminForm.authorImage.trim() : undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMessage(data.error || "त्रुटि");
        return;
      }
      setAdminMessage("नया एडमिन जोड़ा गया।");
      setNewAdminForm({ email: "", password: "", permissions: noPermissions(), authorName: "", authorImage: "" });
      void fetchUsers();
      void fetchAuthors();
    } catch (err) {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleAddAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageUsers) return;

    const emailInput = newAdminForm.email.trim();
    if (!newAdminForm.password.trim()) {
      setAdminMessage("एडमिन के लिए पासवर्ड आवश्यक है।");
      return;
    }
    if (!newAdminForm.authorName.trim()) {
      setAdminMessage("एडमिन के लिए नाम आवश्यक है।");
      return;
    }
    if (newAdminForm.permissions.publishBlog && (!newAdminForm.authorName.trim() || !newAdminForm.authorImage.trim())) {
      setAdminMessage("ब्लॉग प्रकाशित करना परमिशन वाले एडमिन के लिए लेखक नाम और फोटो आवश्यक हैं।");
      return;
    }

    if (!emailInput) {
      if (currentUser?.role !== "master") {
        setAdminMessage("ईमेल के बिना यूजर बनाने की अनुमति केवल मास्टर एडमिन को है।");
        return;
      }
      setAdminMessage("एडमिन जनरेट किया जा रहा है...");
      try {
        const usernameEmailFallback = newAdminForm.authorName.trim();
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameEmailFallback,
            password: newAdminForm.password.trim(),
            role: "ADMIN",
            permissions: newAdminForm.permissions,
            authorName: newAdminForm.authorName.trim(),
            authorImage: newAdminForm.permissions.publishBlog ? newAdminForm.authorImage.trim() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "एडमिन जनरेट करने में विफल");
        
        setNewAdminForm({ email: "", password: "", permissions: noPermissions(), authorName: "", authorImage: "" });
        setAdminMessage("एडमिन सफलतापूर्वक जोड़ा गया!");
        void fetchUsers();
        void fetchAuthors();
      } catch (err: any) {
        setAdminMessage(err.message);
      }
      return;
    }

    setAdminMessage("सत्यापन OTP भेजा जा रहा है...");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminForm.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP भेजने में विफल");
      
      setOtpModalState({ isOpen: true, email: newAdminForm.email.trim(), context: "admin" });
      setAdminMessage("");
    } catch (err: any) {
      setAdminMessage(err.message);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!canManageUsers) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${adminId}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAdminMessage(data.error || "एडमिन हटाया नहीं जा सका।");
        return;
      }
      setAdminMessage("एडमिन हटाया गया।");
      void fetchUsers();
      void fetchAuthors();
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleAdminPermissionToggle = async (adminId: string, key: PermissionKey) => {
    if (!isMaster) {
      return;
    }
    const targetAdmin = users.find((user) => user.id === adminId && user.role === "admin");
    if (!targetAdmin) {
      return;
    }
    const nextPermissions = {
      ...targetAdmin.permissions,
      [key]: !targetAdmin.permissions[key],
    };
    try {
      const res = await fetch(`/api/users/${adminId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: nextPermissions }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAdminMessage(data.error || "परमिशन अपडेट नहीं हो सकी।");
        return;
      }
      setAdminMessage("एडमिन परमिशन अपडेट हो गई।");
      void fetchUsers();
      void fetchAuthors();
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const executeAddContributor = async () => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newContributorForm.email.trim(),
          password: newContributorForm.password.trim(),
          role: "CONTRIBUTOR",
          authorName: newContributorForm.authorName.trim(),
          authorImage: newContributorForm.authorImage.trim(),
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMessage(data.error || "त्रुटि");
        return;
      }
      setAdminMessage("अधिकृत योगदानकर्ता जोड़ा गया।");
      setNewContributorForm({ email: "", password: "", authorName: "", authorImage: "" });
      void fetchUsers();
      void fetchAuthors();
    } catch (err) {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleAddContributor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageUsers) return;

    const emailInput = newContributorForm.email.trim();
    if (!newContributorForm.password.trim()) {
      setAdminMessage("योगदानकर्ता के लिए पासवर्ड आवश्यक है।");
      return;
    }
    if (!newContributorForm.authorName.trim() || !newContributorForm.authorImage.trim()) {
      setAdminMessage("योगदानकर्ता के लिए लेखक नाम और फोटो आवश्यक है।");
      return;
    }

    if (!emailInput) {
      if (currentUser?.role !== "master") {
        setAdminMessage("ईमेल के बिना यूजर बनाने की अनुमति केवल मास्टर एडमिन को है।");
        return;
      }
      setAdminMessage("योगदानकर्ता जनरेट किया जा रहा है...");
      try {
        const usernameEmailFallback = newContributorForm.authorName.trim();
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: usernameEmailFallback,
            password: newContributorForm.password.trim(),
            role: "CONTRIBUTOR",
            authorName: newContributorForm.authorName.trim(),
            authorImage: newContributorForm.authorImage.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "योगदानकर्ता जनरेट करने में विफल");
        
        setNewContributorForm({ email: "", password: "", authorName: "", authorImage: "" });
        setAdminMessage("योगदानकर्ता सफलतापूर्वक जोड़ा गया!");
        void fetchUsers();
        void fetchAuthors();
      } catch (err: any) {
        setAdminMessage(err.message);
      }
      return;
    }

    setAdminMessage("सत्यापन OTP भेजा जा रहा है...");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newContributorForm.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP भेजने में विफल");
      
      setOtpModalState({ isOpen: true, email: newContributorForm.email.trim(), context: "contributor" });
      setAdminMessage("");
    } catch (err: any) {
      setAdminMessage(err.message);
    }
  };

  const handleToggleContributor = async (contributorId: string) => {
    if (!isMaster) {
      return;
    }
    const contributor = users.find((user) => user.id === contributorId && user.role === "contributor");
    if (!contributor) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${contributorId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !contributor.active }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAdminMessage(data.error || "योगदानकर्ता स्थिति अपडेट नहीं हो सकी।");
        return;
      }
      setAdminMessage("योगदानकर्ता स्थिति अपडेट हो गई।");
      void fetchUsers();
      void fetchAuthors();
      const meRes = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (meRes.ok) {
        const meData = (await meRes.json()) as { user?: ApiAuthUser };
        if (meData.user) {
          const refreshed = mapApiUserToAccount(meData.user);
          setSessionEmail(refreshed.email);
          setUsers((prev) => {
            const withoutCurrent = prev.filter((item) => item.email.toLowerCase() !== refreshed.email.toLowerCase());
            return [refreshed, ...withoutCurrent];
          });
        }
      }
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleRemoveContributor = async (contributorId: string) => {
    if (!canManageUsers) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${contributorId}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setAdminMessage(data.error || "योगदानकर्ता हटाया नहीं जा सका।");
        return;
      }
      setAdminMessage("योगदानकर्ता हटाया गया।");
      void fetchUsers();
      void fetchAuthors();
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMaster) return;
    try {
      const url = editingEventId ? `/api/events/${editingEventId}` : "/api/events";
      const method = editingEventId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventForm)
      });
      if (res.ok) {
        const loadRes = await fetch("/api/events");
        const data = await loadRes.json();
        if (data.events) {
          const sorted = data.events.sort((a: any, b: any) => {
            const dA = (a.date && a.time) ? new Date(`${a.date}T${a.time}`).getTime() : Infinity;
            const dB = (b.date && b.time) ? new Date(`${b.date}T${b.time}`).getTime() : Infinity;
            return dA - dB;
          });
          setEvents(sorted);
        }
        setNewEventForm({ title: '', date: '', time: '', location: '', details: '', imageUrl: '' });
        setEditingEventId(null);
      }
    } catch {}
  };

  const handleRemoveEvent = async (id: string) => {
    if (!isMaster) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter(ev => ev.id !== id));
      }
    } catch {}
  };

  const [resourceMessage, setResourceMessage] = useState("");
  const [isResourceLoading, setIsResourceLoading] = useState(false);

  const handlePdfUploadTarget = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setResourceMessage("कृपया केवल PDF अपलोड करें।");
      return;
    }
    if (file.size > 3.5 * 1024 * 1024) {
      setResourceMessage("फ़ाइल 3.5MB से कम होनी चाहिए।");
      return;
    }
    try {
      const uploadedUrl = await uploadMediaFile(file, "resources", file.name);
      setNewResourceForm((prev) => ({ ...prev, fileData: "", type: "pdf", url: uploadedUrl }));
      setResourceMessage("");
    } catch {
      setResourceMessage("PDF अपलोड नहीं हो सका।");
    }
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMaster) return;
    setIsResourceLoading(true);
    setResourceMessage("");
    try {
      const url = editingResourceId ? `/api/resources/${editingResourceId}` : "/api/resources";
      const method = editingResourceId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResourceForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (editingResourceId) {
          setResources(prev => prev.map(r => r.id === editingResourceId ? data.resource : r));
        } else {
          setResources(prev => [data.resource, ...prev]);
        }
        setNewResourceForm({ title: '', type: 'link', url: '', fileData: '' });
        setEditingResourceId(null);
        setResourceMessage(editingResourceId ? "संसाधन सफलतापूर्वक अपडेट किया गया!" : "संसाधन सफलतापूर्वक जोड़ा गया!");
      } else {
        setResourceMessage(data.error || "संसाधन जोड़ने में त्रुटि");
      }
    } catch {
      setResourceMessage("नेटवर्क त्रुटि");
    } finally {
      setIsResourceLoading(false);
    }
  };

  const handleRemoveResource = async (id: string) => {
    if (!isMaster) return;
    try {
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (res.ok) {
        setResources((prev) => prev.filter(r => r.id !== id));
      }
    } catch {}
  };

  const handleSaveMasterAuthorProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "master") {
      return;
    }
    const authorName = masterAuthorForm.authorName.trim();
    const authorImage = masterAuthorForm.authorImage.trim();
    if (!authorName) {
      setAdminMessage("मास्टर एडमिन के लिए लेखक नाम आवश्यक है।");
      return;
    }
    if (!authorImage) {
      setAdminMessage("मास्टर एडमिन के लिए लेखक फोटो आवश्यक है।");
      return;
    }
    if (masterAuthorForm.penNameEnabled && !masterAuthorForm.penName.trim()) {
      setAdminMessage("पेन नेम सक्षम होने पर नाम आवश्यक है।");
      return;
    }
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName,
          authorImage,
          penNameEnabled: masterAuthorForm.penNameEnabled,
          penName: masterAuthorForm.penName.trim(),
          penNameDisplayMode: masterAuthorForm.penNameDisplayMode,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setAdminMessage(data.error || "मास्टर लेखक प्रोफ़ाइल अपडेट नहीं हो सकी।");
        return;
      }
      setAdminMessage("मास्टर एडमिन लेखक प्रोफ़ाइल अपडेट हो गई।");
      void fetchUsers();
      void fetchAuthors();
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleSaveSelfPenName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentUser || currentUser.role === "master" || !canPublishBlog) {
      return;
    }
    if (selfPenNameForm.penNameEnabled && !selfPenNameForm.penName.trim()) {
      setAdminMessage("पेन नेम सक्षम होने पर नाम आवश्यक है।");
      return;
    }
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penNameEnabled: selfPenNameForm.penNameEnabled,
          penName: selfPenNameForm.penName.trim(),
          penNameDisplayMode: selfPenNameForm.penNameDisplayMode,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setAdminMessage(data.error || "पेन नेम सेटिंग अपडेट नहीं हो सकी।");
        return;
      }
      setAdminMessage("पेन नेम सेटिंग सेव हो गई।");
      void fetchUsers();
      void fetchAuthors();
    } catch {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };

  const handleAddCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageCategories) {
      return;
    }
    const name = newCategoryName.trim();
    if (!name) {
      setAdminMessage("कैटेगरी नाम आवश्यक है।");
      return;
    }
    
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isHidden: false }),
      });
      if (!res.ok) throw new Error("Failed");
      
      setManagedCategories((prev) => {
        const lowerName = normalizeCategoryName(name);
        if (prev.some((item) => normalizeCategoryName(item) === lowerName)) {
          return prev;
        }
        return [...prev, name];
      });
      setHiddenCategories((prev) => prev.filter((item) => normalizeCategoryName(item) !== normalizeCategoryName(name)));
      setNewCategoryName("");
      setAdminMessage("कैटेगरी जोड़ दी गई।");
    } catch {
      setAdminMessage("कैटेगरी जोड़ने में त्रुटि।");
    }
  };

  const handleRemoveCategory = async (category: string) => {
    if (!canManageCategories) {
      return;
    }
    if (normalizeCategoryName(category) === normalizeCategoryName("ब्लॉग")) {
      setAdminMessage("ब्लॉग कैटेगरी हटाई नहीं जा सकती।");
      return;
    }
    
    if (!window.confirm("क्या आप वाकई इस कैटेगरी को हटाना चाहते हैं?")) {
      return;
    }
    
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category, isHidden: true }),
      });
      if (!res.ok) throw new Error("Failed");
      
      setManagedCategories((prev) => prev.filter((item) => normalizeCategoryName(item) !== normalizeCategoryName(category)));
      setHiddenCategories((prev) => {
        const categoryKey = normalizeCategoryName(category);
        if (prev.some((item) => normalizeCategoryName(item) === categoryKey)) {
          return prev;
        }
        return [...prev, category];
      });
      if (selectedCategory === category) {
        setSelectedCategory("सभी");
      }
      if (formState.category === category) {
        setFormState((prev) => ({ ...prev, category: "ब्लॉग" }));
      }
      setAdminMessage("कैटेगरी हटा दी गई।");
    } catch {
      setAdminMessage("कैटेगरी हटाने में त्रुटि।");
    }
  };

  const executeNewsletterSubscription = () => {
    setNewsletterMessage("धन्यवाद! आप सफलतापूर्वक न्यूज़लेटर से जुड़ गए हैं।");
    setNewsletterEmail("");
    setNewsletterName("");
    setNewsletterPhone("");
  };

  const handleNewsletter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterName.trim() || !newsletterPhone.trim() || !newsletterEmail.trim()) {
      setNewsletterMessage("कृपया नाम, फ़ोन नंबर और वैध ईमेल दर्ज करें।");
      return;
    }
    setNewsletterMessage("सत्यापन OTP भेजा जा रहा है...");
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP भेजने में विफल");
      
      setOtpModalState({ isOpen: true, email: newsletterEmail.trim(), context: "newsletter" });
      setNewsletterMessage("");
    } catch (err: any) {
      setNewsletterMessage(err.message);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpModalState((prev) => ({ ...prev, isLoading: true, error: "" }));
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpModalState.email, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "अमान्य OTP");
      
      if (otpModalState.context === "newsletter") {
        executeNewsletterSubscription();
      } else if (otpModalState.context === "admin") {
        await executeAddAdmin();
      } else if (otpModalState.context === "contributor") {
        await executeAddContributor();
      }
      
      setOtpModalState({ isOpen: false, email: "", context: "newsletter" });
      setOtpCode("");
    } catch (error: any) {
      setOtpModalState((prev) => ({ ...prev, isLoading: false, error: error.message }));
    }
  };

  const handlePreviewBlog = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublishBlog) {
      setBlogMessage("नई पोस्ट केवल अधिकृत एडमिन या अधिकृत योगदानकर्ता ही जोड़ सकते हैं।");
      return;
    }
    if (!formState.title || !formState.author || !formState.excerpt || !formState.content) {
      setBlogMessage("शीर्षक, लेखक, सारांश और पूरा लेख भरना आवश्यक है।");
      return;
    }
    const selectedAuthorProfile = authorProfilesByName.get(normalizeAuthorName(formState.author));
    if (!selectedAuthorProfile) {
      setBlogMessage("कृपया सूची से मान्य लेखक चुनें।");
      return;
    }
    
    const targetCategory = formState.category;
    const resolvedPostImage = resolvePostImage(formState.postImage, formState.content);
    const tempPost: NewsPost = {
      id: "preview-id",
      title: formState.title.trim(),
      excerpt: formState.excerpt.trim(),
      content: formState.content.trim(),
      category: targetCategory,
      author: formState.author.trim(),
      postImage: resolvedPostImage,
      imageFocus: formState.imageFocus || null,
      authorImage: selectedAuthorProfile.image?.trim() ?? "",
      time: "अभी-अभी",
      createdAt: new Date().toISOString(),
      clickCount: 0,
      source: "blog",
      uploaderName: currentUser?.authorName || currentUser?.email || "",
    };
    
    setPreviewPost(tempPost);
    setBlogMessage(""); // clear any existing message
  };

  const publishBlog = async () => {
    if (!canPublishBlog) {
      setBlogMessage("नई पोस्ट केवल अधिकृत एडमिन या अधिकृत योगदानकर्ता ही जोड़ सकते हैं।");
      return;
    }
    if (!formState.title || !formState.author || !formState.excerpt || !formState.content) {
      setBlogMessage("शीर्षक, लेखक, सारांश और पूरा लेख भरना आवश्यक है।");
      return;
    }
    const selectedAuthorProfile = authorProfilesByName.get(normalizeAuthorName(formState.author));
    if (!selectedAuthorProfile) {
      setBlogMessage("कृपया सूची से मान्य लेखक चुनें।");
      return;
    }
    try {
      const targetCategory = formState.category;
      const submittedTitle = formState.title.trim();
      const submittedExcerpt = formState.excerpt.trim();
      const submittedContent = formState.content.trim();
      const submittedAuthor = formState.author.trim();
      const submittedPostImage = (formState.postImage ?? "").trim();
      const response = await fetch("/api/blogs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: targetCategory,
          title: submittedTitle,
          excerpt: submittedExcerpt,
          content: submittedContent,
          author: submittedAuthor,
          postImage: submittedPostImage || undefined,
          imageFocus: (formState.imageFocus ?? "").trim() || undefined,
        }),
      });
      const data = (await response.json()) as { post?: ApiBlogPost; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to publish");
      }
      if (!data.post) {
        throw new Error("पोस्ट सेव नहीं हो सकी।");
      }
      const justPublishedPost: NewsPost = mapApiBlogToNewsPost(data.post);
      setBlogs((prev) => [justPublishedPost, ...prev]);
      setManagedCategories((prev) => {
        const key = normalizeCategoryName(targetCategory);
        if (prev.some((item) => normalizeCategoryName(item) === key)) {
          return prev;
        }
        return [...prev, targetCategory];
      });
      setHiddenCategories((prev) =>
        prev.filter((item) => normalizeCategoryName(item) !== normalizeCategoryName(targetCategory)),
      );
      setPreviewPost(null); // Close the preview modal automatically
      setFormState({
        title: "",
        author: availableAuthors[0]?.name ?? "",
        category: "ब्लॉग",

        excerpt: "",
        content: "",
        postImage: "",
        imageFocus: "",
        authorImage: availableAuthors[0]?.image ?? "",
      });
      setBlogMessage("नई पोस्ट सफलतापूर्वक जोड़ दी गई।");
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "पोस्ट सेव नहीं हो सकी। कृपया दोबारा प्रयास करें।";
      setBlogMessage(message);
    }
  };

  const navTabs = [
    { title: "होम", value: "home" },
    { title: "ताज़ा खबरें", value: "latest" },
    { title: "आलेख", value: "add-news" },
    { title: "ब्लॉग", value: "blogs" },
    { title: "संसाधन", value: "resources" },
    { title: "न्यूज़लेटर", value: "newsletter" },
    { title: "कैटेगरी", value: "categories" },
    { title: "परिचय", value: "parichay" },
  ];

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const readImageAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Image read failed"));
      };
      reader.onerror = () => reject(new Error("Image read failed"));
      reader.readAsDataURL(file);
    });

  const handleImageInputChange = async (event: React.ChangeEvent<HTMLInputElement>, key: "postImage") => {
    const file = event.target.files?.[0];
    if (!file) {
      setFormState((prev) => ({ ...prev, [key]: "", imageFocus: "" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setBlogMessage("कृपया वैध image file चुनें।");
      return;
    }
    try {
      const encoded = await readImageAsDataUrl(file);
      setCropModalSrc(encoded);
    } catch {
      setBlogMessage("फोटो अपलोड नहीं हो सकी।");
    }
    event.target.value = "";
  };

  const handleCropConfirm = async (result: { dataUrl: string; imageFocus: string }) => {
    try {
      const url = await uploadDataUrl(result.dataUrl, "posts", "thumbnail.jpg");
      setFormState((prev) => ({ ...prev, postImage: url, imageFocus: result.imageFocus }));
      setCropModalSrc(null);
    } catch {
      setBlogMessage("थंबनेल सेव नहीं हो सका।");
    }
  };

  const handleCropCancel = () => {
    setCropModalSrc(null);
  };

  const handleUserAuthorImageInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    target: "admin" | "contributor" | "master",
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      if (target === "admin") {
        setNewAdminForm((prev) => ({ ...prev, authorImage: "" }));
      } else if (target === "contributor") {
        setNewContributorForm((prev) => ({ ...prev, authorImage: "" }));
      } else {
        setMasterAuthorForm((prev) => ({ ...prev, authorImage: "" }));
      }
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAdminMessage("कृपया वैध image file चुनें।");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 400, 0.85);
      const url = await uploadMediaFile(compressed, "authors", "avatar.jpg");
      if (target === "admin") {
        setNewAdminForm((prev) => ({ ...prev, authorImage: url }));
      } else if (target === "contributor") {
        setNewContributorForm((prev) => ({ ...prev, authorImage: url }));
      } else {
        setMasterAuthorForm((prev) => ({ ...prev, authorImage: url }));
      }
    } catch {
      setAdminMessage("फोटो अपलोड नहीं हो सकी।");
    }
  };

  const handleAuthorSelectionChange = (name: string) => {
    const matchedAuthor = authorProfilesByName.get(normalizeAuthorName(name));
    setFormState((prev) => ({
      ...prev,
      author: name,
      authorImage: matchedAuthor?.image ?? "",
    }));
  };

  const handleNavTabChange = (value: string) => {
    if (value === "categories") {
      setIsCategoryMenuOpen((prev) => !prev);
      return;
    }
    if (value === "parichay") {
      setIsCategoryMenuOpen(false);
      setIsParichayVisible(true);
      setActiveNavTab(value);
      return;
    }
    if (value === "admin") {
      setIsCategoryMenuOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    setIsCategoryMenuOpen(false);
    setActiveNavTab(value);
    if (value === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (value === "add-news") {
      scrollToSection("add-news");
      return;
    }
    if (value === "blogs") {
      scrollToSection("latest");
      return;
    }
    scrollToSection(value);
  };

  const openHistoricEventModal = async () => {
    setHistoricEventModalOpen(true);
    setHistoricEventLoading(true);
    try {
      const res = await fetch("/api/historic-event");
      const data = await res.json();
      setHistoricEventData(data);
    } catch {
      setHistoricEventData({
        title: "आज का इतिहास",
        date: new Date().toLocaleDateString("hi-IN"),
        year: null,
        description: "ऐतिहासिक घटना लोड नहीं हो सकी।",
      });
    } finally {
      setHistoricEventLoading(false);
    }
  };

  const saveFeaturedVichar = async (postIds: string[]) => {
    try {
      const res = await fetch("/api/site-config", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredVicharPostIds: postIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeaturedVicharIds(data.featuredVicharPostIds ?? postIds);
        setAdminMessage("प्रमुख विचार अपडेट हो गए।");
      }
    } catch {
      setAdminMessage("प्रमुख विचार सेव नहीं हो सके।");
    }
  };

  const handleMobileNavTabClick = (value: string) => {
    if (value === "categories") {
      setIsCategoryMenuOpen((prev) => !prev);
      return;
    }
    setIsCategoryMenuOpen(false);
    setIsMobileNavOpen(false);
    handleNavTabChange(value);
  };

  const roleText = currentUser
    ? currentUser.role === "master"
      ? "मास्टर एडमिन"
      : currentUser.role === "admin"
        ? "एडमिन"
        : "योगदानकर्ता"
    : "";

  const getFullArticle = (post: NewsPost) => {
    const plainExcerpt = (post.excerpt || "").replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim();
    return post.content?.trim() ||
    `${plainExcerpt}\n\nइस विषय पर विस्तृत रिपोर्ट के लिए संपादकीय टीम द्वारा तथ्यात्मक पृष्ठभूमि, जमीनी प्रतिक्रियाएं और नीति-संदर्भ एकत्र किए जा रहे हैं।`;
  };

  const getPostClicks = (post: NewsPost) => {
    if (post.source === "blog") {
      return post.clickCount ?? 0;
    }
    return postClicks[post.id] ?? 0;
  };

  const getPostTimeLabel = (post: NewsPost) => {
    if (!post.createdAt) {
      return post.time;
    }
    const parsed = new Date(post.createdAt).getTime();
    if (Number.isNaN(parsed)) {
      return post.time;
    }
    const nowMs = Date.now();
    const diffMs = nowMs - parsed;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "अभी";
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    if (diffDays === 1) return "कल";
    if (diffDays < 7) return `${diffDays} दिन पहले`;
    return new Date(parsed).toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getPreviewImage = (post: NewsPost) => resolvePostImage(post.postImage, post.content);

  const handlePostOpen = (post: NewsPost) => {
    if (post.source === "blog") {
      setBlogs((prev) =>
        prev.map((item) => (item.id === post.id ? { ...item, clickCount: (item.clickCount ?? 0) + 1 } : item)),
      );
      router.push(`/post/${post.id}`);
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const changeFontSize = (delta: number) => {
    if (typeof document === "undefined") return;
    const current = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const next = Math.min(22, Math.max(13, current + delta));
    document.documentElement.style.fontSize = `${next}px`;
  };

  // Map an existing NewsPost into ArticleCard props
  const articleCardProps = (post: NewsPost, size: "normal" | "large" = "normal") => ({
    title: post.title,
    excerpt: post.excerpt,
    imageUrl: getPreviewImage(post),
    imageFocus: post.imageFocus,
    categoryName: post.category,
    categorySlug: post.category,
    authorName: post.author,
    authorAvatar: post.authorImage,
    timeLabel: getPostTimeLabel(post),
    readTime: readingTime(post.content || post.excerpt || ""),
    views: getPostClicks(post),
    slug: post.id,
    size,
    onCardClick: () => handlePostClick(post.id),
  });


  useEffect(() => {
    if (activeResource && activeResource.type === "pdf" && !activeResource.url && !activeResource.fileData) {
      const loadCompleteResource = async () => {
        try {
          const res = await fetch(`/api/resources/${activeResource.id}`);
          const data = await res.json();
          if (data.resource && (data.resource.url || data.resource.fileData)) {
            setActiveResource(data.resource);
          }
        } catch {}
      };
      loadCompleteResource();
    }
  }, [activeResource]);

  return (
    <>
    <div className={`print:hidden ${theme === "dark" ? "theme-dark" : "theme-light"} news-shell min-h-screen`}>
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div
          className="site-topbar home-topbar hidden min-[450px]:flex flex-wrap items-center justify-between gap-2 border-b border-[var(--divider)] text-xs sm:text-sm"
          style={{ minHeight: "32px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif", paddingTop: 4, paddingBottom: 4 }}
        >
          <span className="home-topbar__date shrink-0 whitespace-nowrap" style={{ fontSize: 11 }}>{formatDate()}</span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div
              className="flex items-center gap-0.5 rounded border px-1"
              style={{ borderColor: "var(--divider)" }}
            >
              <button
                type="button"
                onClick={() => changeFontSize(-1)}
                title="फ़ॉन्ट छोटा करें"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--gold)", background: "transparent", border: "none", padding: "1px 5px", cursor: "pointer" }}
              >
                अ−
              </button>
              <button
                type="button"
                onClick={() => changeFontSize(1)}
                title="फ़ॉन्ट बड़ा करें"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 15, color: "var(--gold)", background: "transparent", border: "none", padding: "1px 5px", cursor: "pointer" }}
              >
                अ+
              </button>
              <span style={{ color: "var(--divider)", fontSize: 10 }}>|</span>
              <button
                type="button"
                onClick={() => changeFontSize(-1)}
                title="Decrease font size"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--gold)", background: "transparent", border: "none", padding: "1px 5px", cursor: "pointer" }}
              >
                A−
              </button>
              <button
                type="button"
                onClick={() => changeFontSize(1)}
                title="Increase font size"
                style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "var(--gold)", background: "transparent", border: "none", padding: "1px 5px", cursor: "pointer" }}
              >
                A+
              </button>
            </div>
            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`} href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <FacebookIcon className="h-4 w-4" />
            </a>

            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`} href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer">
              <YoutubeIcon className="h-4 w-4" />
            </a>

            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`} href="https://www.x.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <TwitterIcon className="h-4 w-4" />
            </a>

            <a href="mailto:vaamkiaawaz@gmail.com" className={`interactive-link hidden px-2 py-1 text-xs md:inline-flex md:text-sm ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`}>
              संपर्क: vaamkiaawaz@gmail.com
            </a>
            <div className="relative flex items-center shrink-0 ml-1 sm:ml-2" ref={translateRef}>
              <button
                type="button"
                onClick={() => setShowTranslate(!showTranslate)}
                className="inline-flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)]"
                title="Translate"
              >
                <Languages className="h-4 w-4" />
              </button>
              <div 
                id="translate_placeholder" 
                className={`absolute right-0 top-full mt-2 bg-white border border-[var(--line)] p-1 rounded-md shadow-lg z-[100] transition-all duration-200 ${showTranslate ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}
              ></div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{currentUser ? `${roleText}` : "लॉगिन"}</span>
            </button>
            <a href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className="btn-primary hidden sm:inline-flex" style={{ padding: "3px 12px", fontSize: 11 }}>
              सदस्यता में
            </a>
          </div>
        </div>

        <div
          ref={stickyHeaderRef}
          className={`sticky top-0 z-50 transition-colors duration-200`}
          style={{ "--compact-progress": 0, background: isScrolledHeader ? 'var(--surface-mid)' : 'transparent', borderBottom: isScrolledHeader ? '1px solid var(--divider)' : 'none' } as CSSProperties}
        >
          <header id="top" className="headline-fade home-header">
            <div className="home-header__slot home-header__slot--left hidden lg:flex">
              <button
                type="button"
                onClick={() => setTodayKaryakramOpen(true)}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                आज के कार्यक्रम
              </button>
              <button
                type="button"
                onClick={() => void openHistoricEventModal()}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                आज का इतिहास
              </button>
            </div>
            <div className="home-header__brand">
              <img
                src="/vaamki-logo.png"
                alt="वाम की आवाज़ लोगो"
                onError={(event) => {
                  event.currentTarget.src = "/vercel.svg";
                }}
                className="home-header__logo shrink-0 object-contain"
                style={{ width: 65, height: 65, border: "1px solid var(--divider)", background: "var(--surface-mid)", padding: 3 }}
              />
              <div className="home-header__titles">
                <div className="home-header__title" style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 30, fontWeight: 700, color: "var(--headline)", lineHeight: 1.1 }}>
                  वाम की आवाज़ (Vaam Ki Aawaz)
                </div>
                <div className="home-header__subtitle">
                  {SITE_TAGLINE_LINES.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="home-header__slot home-header__slot--right hidden lg:flex">
              <a href={LIVE_COVERAGE_URL} target="_blank" rel="noreferrer" className="btn-primary">
                लाइव कवरेज
              </a>
            </div>
          </header>

          <nav
            className="home-nav backdrop-blur-md"
            style={{
              background: isScrolledHeader ? "rgba(15,15,15,0.96)" : "var(--ink)",
              borderBottom: "2px solid var(--crimson)",
              padding: "8px 12px",
            }}
          >
            <div className="home-nav__inner relative flex flex-row items-center justify-between gap-2 px-1 sm:px-0">
              <div className="home-nav__left flex items-center gap-2 flex-1 pr-2">
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                  मेनू
                </button>
                <div className="hidden lg:block lg:flex-1">
                  <Tabs
                    tabs={navTabs}
                    onTabChange={handleNavTabChange}
                    hideContent
                    activeValue={activeNavTab}
                    containerClassName="gap-1"
                    activeTabClassName="bg-[var(--surface-soft)] border border-[var(--line)]"
                    tabClassName="rise-on-hover whitespace-nowrap border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  />
                </div>
              </div>
              {isCategoryMenuOpen && (
                <div
                  ref={categoryMenuRef}
                  className="absolute left-0 top-12 z-30 hidden w-[min(95vw,540px)] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-lg lg:block"
                >
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>कैटेगरी चुनें</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {allCategories.filter((category) => category !== "ब्लॉग").map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setNewsVisibleCount(24);
                          setBlogVisibleCount(24);
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`rise-on-hover rounded-md border px-3 py-2 text-left text-sm ${
                          selectedCategory === category
                            ? "border-[var(--primary)] text-[var(--primary)]"
                            : "border-[var(--line)]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="home-nav__actions ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pr-1 sm:pr-0 lg:w-auto lg:flex-none lg:justify-end">
                <div className="hidden md:block">
                  <GooeyInput
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    placeholder="खोज"
                    enableHindiKeyboard
                    className="w-auto shrink"
                    collapsedWidth={140}
                    expandedWidth={220}
                    expandedOffset={49}
                    // classNames={{
                    //   trigger: theme === "dark"
                    //     ? "bg-[#2A1E1E] border-[#3A2A2A] text-[#F5EDEB]"
                    //     : "bg-[#E8DDD8] border-[#D6C7C0] text-[#6B7280]",

                    //   bubbleSurface: theme === "dark"
                    //     ? "bg-[#7D0F13] border-[#5E0B0E] text-white"
                    //     : "bg-[#E8DDD8] border-[#D6C7C0] text-[#6B7280]",
                        
                    //   input: theme === "dark"
                    //     ? "text-white placeholder:text-white/70"
                    //     : "text-black placeholder:text-black/70"
                    // }}

                    classNames={{
                      trigger: theme === "dark"
                        ? "bg-[#2A1E1E] border-[#3A2A2A] text-[#F5EDEB]"
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#6B7280]",
                
                      bubbleSurface: theme === "dark"
                        ? "bg-[#7D0F13] border-[#5E0B0E] text-white"
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#6B7280]",
                        
                      // Customized placeholder colors to match backgrounds directly
                      input: theme === "dark"
                        ? "text-white"
                        : "text-black placeholder:text-[#6B7280]! placeholder:opacity-100!"
                    }}
                  />
                </div>
                <input
                  type="date"
                  value={selectedNewsDate}
                  onChange={(event) => {
                    setSelectedNewsDate(event.target.value);
                    setNewsVisibleCount(24);
                  }}
                  className="h-10 w-[110px] shrink rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] sm:min-w-[132px]"
                  aria-label="Select date for news filter"
                />
                {selectedNewsDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedNewsDate("")}
                    className="h-10 shrink-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className="rise-on-hover inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  aria-label={theme === "light" ? "Night mode" : "Day mode"}
                >
                  {theme === "light" ? <MoonIcon /> : <SunIcon />}
                </button>
              </div>
            </div>
          </nav>
          <AnimatePresence>
            {isMobileNavOpen && (
              <motion.div
                className="fixed inset-0 z-[130] bg-black/45 lg:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setIsMobileNavOpen(false)}
              >
                <motion.aside
                  className="mr-auto flex h-full w-[82%] max-w-[320px] flex-col overflow-y-auto overscroll-y-auto border-r border-[var(--line)] bg-[var(--surface)] p-4 shadow-xl"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--headline)]">नेविगेशन</p>
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen(false)}
                      className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="mb-4 flex flex-col gap-3 min-[450px]:hidden border-b border-[var(--line)] pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeFontSize(-1)}
                          className="border border-[var(--divider)] px-2 py-0.5 rounded text-[var(--gold)] text-sm font-medium"
                        >
                          अ−
                        </button>
                        <button
                          type="button"
                          onClick={() => changeFontSize(1)}
                          className="border border-[var(--divider)] px-2 py-0.5 rounded text-[var(--gold)] text-sm font-medium"
                        >
                          अ+
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <a href="https://www.facebook.com/VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><FacebookIcon className="h-4 w-4" /></a>
                        <a href="https://www.youtube.com/@VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><YoutubeIcon className="h-4 w-4" /></a>
                        <a href="https://www.x.com/VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><TwitterIcon className="h-4 w-4" /></a>
                      </div>
                    </div>
                    
                    <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--muted)] text-sm hover:text-[var(--primary)] block">
                      संपर्क: vaamkiaawaz@gmail.com
                    </a>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTranslate(!showTranslate)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--primary)]"
                        title="Translate"
                      >
                        <Languages className="h-4 w-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => { setIsMobileNavOpen(false); setIsAuthModalOpen(true); }}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)]"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="truncate">{currentUser ? `${roleText}` : "लॉगिन"}</span>
                      </button>
                      
                      <a href={LIVE_COVERAGE_URL} className="btn-primary text-xs px-3 py-1.5">
                        सदस्यता में
                      </a>
                    </div>
                  </div>

                  <div className="mb-4 lg:hidden">
                    <a href={LIVE_COVERAGE_URL} className="btn-primary flex w-full justify-center">
                      लाइव कवरेज
                    </a>
                  </div>
                  
                  <div className="mb-4">
                    <GooeyInput
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                      placeholder="खोज"
                      enableHindiKeyboard
                      className="w-full"
                      collapsedWidth={200}
                      expandedWidth={280}
                      expandedOffset={0}
                    />
                  </div>
                  <div className="space-y-2">
                    {navTabs.map((tab) => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => handleMobileNavTabClick(tab.value)}
                        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>
                  {isCategoryMenuOpen && (
                    <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">कैटेगरी</p>
                      <div className="grid grid-cols-2 gap-2">
                        {allCategories.filter((category) => category !== "ब्लॉग").map((category) => (
                          <button
                            key={`mobile-${category}`}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category);
                              setNewsVisibleCount(24);
                              setBlogVisibleCount(24);
                              setIsCategoryMenuOpen(false);
                              setIsMobileNavOpen(false);
                              scrollToSection("latest");
                            }}
                            className={`rounded-md border px-3 py-2 text-left text-sm ${
                              selectedCategory === category
                                ? "border-[var(--primary)] text-[var(--primary)]"
                                : "border-[var(--line)] text-[var(--foreground)]"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="home-breaking" style={{ height: 36, background: "var(--crimson)", display: "flex", alignItems: "center", overflow: "hidden", flexShrink: 0 }}>
          <div
            style={{
              background: "var(--crimson-dark)",
              color: "white",
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 12px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              borderRight: "1px solid rgba(255,255,255,0.2)",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.04em",
            }}
          >
            ब्रेकिंग
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-track" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, fontWeight: 700, color: "white" }}>
              {[...filteredNews.slice(0, 8), ...filteredNews.slice(0, 8)].map((story, i) => (
                <span key={`ticker-${story.id}-${i}`}>
                  <Link href={`/post/${story.id}`} onClick={() => handlePostClick(story.id)} style={{ color: "white", textDecoration: "none" }}>
                    {story.title}
                  </Link>
                  <span style={{ color: "var(--gold)", fontWeight: 700, margin: "0 16px" }}>॥</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {featuredForDisplay[0] && (
          <section className="hero-section" style={{ position: "relative", height: 520, overflow: "hidden", background: "var(--ink)", marginTop: 16, marginBottom: 16 }}>
            {getPreviewImage(featuredForDisplay[0]) && (
              <img
                src={getPreviewImage(featuredForDisplay[0])!}
                alt={featuredForDisplay[0].title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: focusToObjectPosition(featuredForDisplay[0].imageFocus), filter: "saturate(0.85) contrast(1.05)" }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.88) 100%)" }} />

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                height: 30,
                background: "rgba(0,0,0,0.58)",
                backdropFilter: "blur(4px)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div className="resistance-track" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em" }}>
                {resistanceSlogans}
                {resistanceSlogans}
              </div>
            </div>

            <div className="hero-overlay" style={{ position: "absolute", bottom: 40, left: 40, right: 16, maxWidth: 620, zIndex: 10 }}>
              <span className={`cat-pill ${getCategoryClass(featuredForDisplay[0].category)}`} style={{ marginBottom: 10, display: "inline-block" }}>
                {featuredForDisplay[0].category}
              </span>
              <Link href={`/post/${featuredForDisplay[0].id}`} onClick={() => handlePostClick(featuredForDisplay[0].id)} style={{ textDecoration: "none" }}>
                <h1
                  className="hero-overlay__title"
                  style={{
                    fontFamily: "'Noto Serif Devanagari', serif",
                    fontSize: "clamp(30px, 5vw, 52px)",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                    color: "white",
                    margin: "8px 0 12px",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {featuredForDisplay[0].title}
                </h1>
              </Link>
              <div
                className="excerpt-html hero-overlay__excerpt"
                style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 16, lineHeight: 1.7, color: "var(--cream-dim)", marginBottom: 16, WebkitLineClamp: 2 }}
                dangerouslySetInnerHTML={{ __html: cleanHtml(featuredForDisplay[0].excerpt) }}
              />
              <div className="hero-overlay__meta" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--gold)", marginBottom: 20 }}>
                {featuredForDisplay[0].authorImage && (
                  <img src={featuredForDisplay[0].authorImage} alt="" className="avatar-circle" style={{ width: 24, height: 24, objectFit: "cover", border: "2px solid var(--crimson)" }} />
                )}
                <span>{featuredForDisplay[0].author}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{getPostTimeLabel(featuredForDisplay[0])}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{readingTime(featuredForDisplay[0].content || featuredForDisplay[0].excerpt || "")} मिनट पाठ</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{formatViews(getPostClicks(featuredForDisplay[0]))} पाठक</span>
              </div>
              <Link href={`/post/${featuredForDisplay[0].id}`} onClick={() => handlePostClick(featuredForDisplay[0].id)} className="btn-primary">
                पूरा पढ़ें →
              </Link>
            </div>

            <div className="hero-side-panel" style={{ position: "absolute", bottom: 0, right: 0, width: 272, background: "rgba(0,0,0,0.90)", borderLeft: "2px solid var(--crimson)", zIndex: 15 }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 700, color: "var(--crimson)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  और खबरें ›
                </span>
              </div>
              {filteredNews.slice(1, 4).map((story) => (
                <Link
                  href={`/post/${story.id}`}
                  key={story.id}
                  onClick={() => handlePostClick(story.id)}
                  style={{ textDecoration: "none", display: "block" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(178,34,34,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className={`cat-pill ${getCategoryClass(story.category)}`}>{story.category}</span>
                    <p
                      style={{
                        fontFamily: "'Noto Serif Devanagari', serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--cream)",
                        lineHeight: 1.4,
                        marginTop: 4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {story.title}
                    </p>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 4, display: "block" }}>
                      {getPostTimeLabel(story)} · {readingTime(story.content || story.excerpt || "")} मिनट पाठ
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <main className="home-main grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="home-main__primary space-y-6 lg:col-span-8">
            <section className="home-priorities" style={{ background: "var(--surface)", padding: "8px 0 16px" }}>
              <SectionHeader title="आज की प्राथमिकताएँ" href="/" linkText="सभी देखें →" />
              <div className="cards-grid-responsive cards-grid-2up">
                {filteredNews.slice(1, 5).map((story) => (
                  <ArticleCard key={story.id} {...articleCardProps(story)} />
                ))}
              </div>
            </section>

            <section id="latest" className="home-latest scroll-m-32 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">ताज़ा खबरें</h3>
                <span className="text-sm text-[var(--muted)]">
                  {selectedCategory !== "सभी" ? `${selectedCategory} • ` : ""}
                  {selectedAuthor ? `${selectedAuthor} • ` : ""}
                  {filteredNews.length} परिणाम
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {visibleFeedPosts.map((story) => (
                  <button
                    type="button"
                    key={story.id}
                    onClick={() => handlePostOpen(story)}
                    className="rise-on-hover rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition-all"
                  >
                    {getPreviewImage(story) && (
                      <div className="thumb-16x9 mb-3 rounded-md">
                        <img
                          src={getPreviewImage(story)!}
                          alt={story.title}
                          className="h-full w-full object-cover"
                          style={{ objectPosition: focusToObjectPosition(story.imageFocus) }}
                        />
                      </div>
                    )}
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                      {story.category}
                    </p>
                    <h4 className="line-clamp-2 mt-2 text-lg font-semibold leading-snug text-[var(--headline)]">{story.title}</h4>
                    <div className="line-clamp-3 mt-2 text-sm text-[var(--muted)] excerpt-html" dangerouslySetInnerHTML={{ __html: cleanHtml(story.excerpt) }} />
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-1.5">
                        {story.authorImage && (
                          <img src={story.authorImage} alt="" className="h-5 w-5 rounded-full border border-[var(--line)] object-cover" />
                        )}
                        <span 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/author/${encodeURIComponent(story.author)}`); }}
                        className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline"
                      >
                        {story.author}
                      </span>
                      </div>
                      <span>• {getPostTimeLabel(story)} • {getPostClicks(story)} क्लिक</span>
                    </div>
                    <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
                  </button>
                ))}
              </div>
              {visibleFeedPosts.length < feedPosts.length && (
                <button
                  onClick={() => setNewsVisibleCount((prev) => prev + 12)}
                  className="rise-on-hover mt-5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
                >
                  More Posts
                </button>
              )}
            </section>

            <section className="home-vichar rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="mb-4 font-serif text-2xl font-bold text-[var(--headline)]">प्रमुख विचार</h3>
              <div className="grid gap-3">
                {pramukhVicharPosts.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">कोई प्रमुख विचार चयनित नहीं है।</p>
                ) : (
                  pramukhVicharPosts.map((post) => (
                    <button
                      type="button"
                      key={post.id}
                      onClick={() => handlePostOpen(post)}
                      className="rise-on-hover interactive-link rounded-md border border-[var(--line)] px-4 py-3 text-left text-base font-medium text-[var(--foreground)]"
                    >
                      {post.title}
                    </button>
                  ))
                )}
              </div>
            </section>
          </section>

          <aside className="home-aside space-y-6 lg:col-span-4 lg:self-start lg:sticky lg:top-[170px] lg:max-h-[calc(100vh-170px)] lg:overflow-y-auto no-visible-scrollbar pb-6">
            <section className="home-topread rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="mb-3 font-serif text-xl font-bold text-[var(--headline)]">सबसे ज्यादा पढ़ी गईं</h3>
              <div className="space-y-3">
                {topReadPosts.map((story, index) => (
                  <button
                    type="button"
                    key={story.id}
                    onClick={() => handlePostOpen(story)}
                    className="rise-on-hover flex w-full text-left gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                  >
                    <span className="text-xl font-bold text-[var(--primary)]">{index + 1}</span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-sm font-semibold leading-5 text-[var(--foreground)] line-clamp-2">{story.title}</span>
                      <span className="text-xs text-[var(--muted)]">{story.source === "blog" ? (story.clickCount ?? 0) : (postClicks[story.id] ?? 0)} क्लिक</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section id="resources" className="home-resources rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-5 shadow-sm">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">संसाधन</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { key: "all", label: "सभी" },
                  { key: "link", label: "लिंक" },
                  { key: "pdf", label: "लाइब्रेरी" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setResourceFilter(filter.key as "all" | "link" | "pdf")}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      resourceFilter === filter.key
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--line)] text-[var(--foreground)]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto text-sm pr-1">
                {filteredResources.length === 0 ? (
                  <p className="text-[var(--muted)]">कोई संसाधन नहीं</p>
                ) : (
                  filteredResources.map(res => (
                    <div onClick={() => setActiveResource(res)} key={res.id} className="cursor-pointer rise-on-hover flex items-center justify-between rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
                      <div>
                        <p className="font-semibold text-[var(--headline)]">{res.title} {res.type === 'pdf' ? '(PDF)' : '(Link)'}</p>
                      </div>
                      {isMaster && (
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingResourceId(res.id);
                              setNewResourceForm({
                                title: res.title,
                                type: res.type,
                                url: res.url || '',
                                fileData: '' // Leave empty so we don't accidentally send a large file unless re-uploaded
                              });
                            }}
                            className="text-blue-500 text-xs rounded border border-blue-500 px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveResource(res.id);
                            }}
                            className="text-red-500 text-xs rounded border border-red-500 px-2 py-1"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {isMaster && (
                <div className="mt-5 border-t border-[var(--line)] pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[var(--headline)]">{editingResourceId ? "संसाधन अपडेट करें" : "संसाधन जोड़ें"}</p>
                    {editingResourceId && (
                      <button type="button" onClick={() => { setEditingResourceId(null); setNewResourceForm({ title: '', type: 'link', url: '', fileData: '' }); }} className="text-xs text-red-500 underline">Cancel Edit</button>
                    )}
                  </div>
                  <form onSubmit={handleAddResource} className="space-y-3">
                    <input
                      type="text"
                      placeholder="शीर्षक"
                      required
                      value={newResourceForm.title}
                      onChange={e => setNewResourceForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    />
                    <select
                      value={newResourceForm.type}
                      onChange={e => setNewResourceForm(prev => ({ ...prev, type: e.target.value, fileData: '', url: '' }))}
                      className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                    >
                      <option value="link">लिंक</option>
                      <option value="pdf">PDF विवरण</option>
                    </select>

                    {newResourceForm.type === 'link' && (
                      <input
                        type="url"
                        placeholder="यूआरएल (URL)"
                        required={newResourceForm.type === 'link'}
                        value={newResourceForm.url}
                        onChange={e => setNewResourceForm(prev => ({ ...prev, url: e.target.value }))}
                        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                      />
                    )}

                    {newResourceForm.type === 'pdf' && (
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          required={newResourceForm.type === 'pdf'}
                          onChange={handlePdfUploadTarget}
                          className="w-full text-xs"
                        />
                        <p className="mt-1 text-[10px] text-[var(--muted)]">अधिकतम साइज़: 3.5MB</p>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isResourceLoading}
                      className="rise-on-hover w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isResourceLoading ? 'प्रोसेसिंग...' : editingResourceId ? 'अपडेट करें' : 'जोड़ें'}
                    </button>
                    {resourceMessage && <p className="text-xs text-[var(--primary)]">{resourceMessage}</p>}
                  </form>
                </div>
              )}
            </section>

            <section id="newsletter" className="home-newsletter rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">न्यूज़लेटर</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                रोज़ शाम 7 बजे दिनभर की प्रमुख खबरें और विश्लेषण सीधे आपके ईमेल पर।
              </p>
              <form onSubmit={handleNewsletter} className="mt-4 space-y-3">
                <input
                  type="text"
                  value={newsletterName}
                  onChange={(event) => setNewsletterName(event.target.value)}
                  placeholder="आपका नाम"
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <input
                  type="tel"
                  value={newsletterPhone}
                  onChange={(event) => setNewsletterPhone(event.target.value)}
                  placeholder="फ़ोन नंबर"
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="आपका ईमेल"
                  className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <button className="rise-on-hover w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                  सदस्य बनें
                </button>
              </form>
              {newsletterMessage && <p className="mt-3 text-sm text-[var(--primary)]">{newsletterMessage}</p>}
            </section>

            <section id="abhiyan-calendar" className="home-calendar scroll-m-32 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-xl font-bold text-[var(--headline)]">अभियान कैलेंडर</h3>
                <button onClick={() => setEventArchiveModalOpen(true)} className="text-xs font-semibold text-[var(--primary)] hover:underline">आर्काइव</button>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                {filteredEvents.length === 0 ? (
                  <p className="text-[var(--muted)]">कोई आगामी ईवेंट नहीं</p>
                ) : (
                  filteredEvents.map(ev => {
                    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const isToday = ev.date === todayStr;
                    return (
                      <div onClick={() => setActiveEvent(ev)} key={ev.id} className={`cursor-pointer rise-on-hover rounded-md border p-3 ${isToday ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]' : 'border-l-4 border-[var(--line)] border-l-[var(--primary)] bg-[var(--surface)]'}`}>
                        {isToday && <span className="mb-2 inline-block rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">आज का कार्यक्रम</span>}
                        <p className={`font-semibold ${isToday ? 'text-[var(--primary)]' : 'text-[var(--headline)]'}`}>{ev.title}</p>
                        <p className="text-[var(--muted)] text-xs mt-0.5">
                          {ev.date ? `${formatDateWithDay(ev.date)} • ${ev.time}` : 'तय होना बाकी है'}
                          {ev.location ? ` | ${ev.location}` : ''}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </main>

        {filteredNews.slice(5, 8).length > 0 && (
          <section className="home-ground" style={{ background: "var(--cream)", padding: "60px 24px", marginTop: 16, marginLeft: -16, marginRight: -16 }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--crimson)", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  ग्राउंड रिपोर्ट
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--crimson)" }} />
              </div>
              {(() => {
                const gr = filteredNews.slice(5, 8);
                return (
                  <div className="ground-report-grid">
                    <Link href={`/post/${gr[0].id}`} onClick={() => handlePostClick(gr[0].id)} style={{ textDecoration: "none", display: "block" }} className="card-lift">
                      <div style={{ border: "1px solid rgba(0,0,0,0.1)", background: "#fff" }}>
                        <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#e7e0d4" }}>
                          {getPreviewImage(gr[0]) && (
                            <img
                              src={getPreviewImage(gr[0])!}
                              alt={gr[0].title}
                              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focusToObjectPosition(gr[0].imageFocus), filter: "saturate(0.9)" }}
                            />
                          )}
                        </div>
                        <div style={{ padding: 20 }}>
                          <span className={`cat-pill ${getCategoryClass(gr[0].category)}`}>{gr[0].category}</span>
                          <h3 style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 24, fontWeight: 600, lineHeight: 1.4, color: "var(--text-cream)", marginTop: 10 }}>{gr[0].title}</h3>
                          <div
                            className="excerpt-html"
                            style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 15, lineHeight: 1.75, color: "rgba(15,15,15,0.65)", marginTop: 8 }}
                            dangerouslySetInnerHTML={{ __html: cleanHtml(gr[0].excerpt) }}
                          />
                          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--crimson-dark)", marginTop: 12 }}>{gr[0].author} · {getPostTimeLabel(gr[0])}</div>
                        </div>
                      </div>
                    </Link>
                    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                      {gr.slice(1, 3).map((article) => (
                        <Link href={`/post/${article.id}`} key={article.id} onClick={() => handlePostClick(article.id)} style={{ textDecoration: "none", display: "block", flex: 1 }} className="card-lift">
                          <div style={{ border: "1px solid rgba(0,0,0,0.1)", height: "100%", background: "#fff" }}>
                            <div style={{ aspectRatio: "16/9", overflow: "hidden", background: "#e7e0d4" }}>
                              {getPreviewImage(article) && (
                                <img
                                  src={getPreviewImage(article)!}
                                  alt={article.title}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: focusToObjectPosition(article.imageFocus), filter: "saturate(0.9)" }}
                                />
                              )}
                            </div>
                            <div style={{ padding: 14 }}>
                              <span className={`cat-pill ${getCategoryClass(article.category)}`}>{article.category}</span>
                              <h3 style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 17, fontWeight: 600, lineHeight: 1.4, color: "var(--text-cream)", marginTop: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{article.title}</h3>
                              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--crimson-dark)", marginTop: 8 }}>
                                <span
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/author/${encodeURIComponent(article.author)}`); }}
                                  style={{ cursor: "pointer", textDecoration: "underline" }}
                                >
                                  {article.author}
                                </span>
                                {" · "}{getPostTimeLabel(article)}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {(threeMinutePosts.length > 0 || filteredNews.length > 1) && (
          <section className="home-explainer-section" style={{ background: "var(--surface)", padding: "60px 0" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <SectionHeader title="समझें सिर्फ 3 मिनट में" badge="3 मिनट" />
            </div>
            <div className="explainer-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              {(threeMinutePosts.length > 0 ? threeMinutePosts : filteredNews.slice(0, 10)).map((item, i) => (
                <Link href={`/post/${item.id}`} key={`ex-${item.id}`} onClick={() => handlePostClick(item.id)} style={{ textDecoration: "none", flexShrink: 0, width: 260, display: "block" }} className="card-lift">
                  <div style={{ background: "var(--surface-mid)", border: "1px solid var(--divider)", padding: 24, height: "100%" }}>
                    <div style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 64, fontWeight: 700, color: "var(--crimson)", lineHeight: 1, marginBottom: 16 }}>{String(i + 1).padStart(2, "0")}</div>
                    <h3 style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 16, fontWeight: 600, lineHeight: 1.5, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h3>
                    <div className="excerpt-html" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: 8, WebkitLineClamp: 3 }} dangerouslySetInnerHTML={{ __html: cleanHtml(item.excerpt) }} />
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--gold)", marginTop: 16, letterSpacing: "0.04em" }}>पढ़ना शुरू करें →</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="home-tracker-section" style={{ background: "var(--surface)", padding: "40px 0" }}>
          <SectionHeader title="सक्रिय संघर्ष ट्रैकर" badge="LIVE" />
          <div style={{ border: "1px solid var(--divider)" }}>
            {movementTracker.map((m, i) => (
              <div
                key={m.name}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < movementTracker.length - 1 ? "1px solid var(--divider)" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{m.name}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--gold)", border: "1px solid var(--divider)", padding: "1px 6px" }}>{m.location}</span>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--text-muted)" }}>{m.startDate} से</span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{m.description}</div>
                </div>
                <span className={m.status === "active" ? "badge-active" : m.status === "strike" ? "badge-strike" : "badge-success"}>{m.statusLabel}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="add-news" className="home-addnews my-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 scroll-m-32">
          <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">नई खबर जोड़ें</h3>
          {!canPublishBlog && (
            <p className="mt-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
              ब्लॉग पोस्ट जोड़ने के लिए एडमिन या एडमिन द्वारा अधिकृत योगदानकर्ता लॉगिन करें।
            </p>
          )}
          {canPublishBlog && (
            <form onSubmit={handlePreviewBlog} className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="हेडलाइन / शीर्षक"
                className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] md:col-span-2"
              />
              <div className="flex items-center gap-3">
                <select
                  value={formState.author}
                  onChange={(event) => handleAuthorSelectionChange(event.target.value)}
                  className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                >
                  <option value="">लेखक चुनें</option>
                  {availableAuthors.map((author) => (
                    <option key={author.name} value={author.name}>
                      {author.name}
                    </option>
                  ))}
                </select>
                {formState.authorImage && (
                  <img src={formState.authorImage} alt="Author" className="h-10 w-10 shrink-0 rounded-full border border-[var(--line)] object-cover" />
                )}
              </div>
              <select
                value={formState.category}
                onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              >
                {allCategories
                  .filter((category) => category !== "सभी")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
              <label className="flex w-full min-w-0 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] md:col-span-2">
                थंबनेल फोटो
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageInputChange(event, "postImage")}
                  className="w-full text-xs"
                />
              </label>
              {(formState.postImage || resolvePostImage(null, formState.content)) && (
                <div className="md:col-span-2 flex gap-3">
                  <img
                    src={resolvePostImage(formState.postImage, formState.content)!}
                    alt="Post preview"
                    className="h-16 w-24 rounded-md object-cover"
                    style={{ objectPosition: focusToObjectPosition(formState.imageFocus) }}
                  />
                </div>
              )}
              <div className="md:col-span-2 min-w-0 bg-[var(--surface)] text-[var(--foreground)] rounded-md border border-[var(--line)]">
                <TiptapEditor
                  value={formState.excerpt}
                  onChange={(val) => setFormState((prev) => ({ ...prev, excerpt: val }))}
                  placeholder="संक्षिप्त सारांश / एब्स्ट्रैक्ट"
                  className="min-h-[200px] rounded-md"
                  hideMediaLinks={true}
                />
              </div>
              <div className="md:col-span-2 min-w-0 bg-[var(--surface)] text-[var(--foreground)] rounded-md border border-[var(--line)]">
                <TiptapEditor
                  value={formState.content}
                  onChange={(content) => setFormState((prev) => ({ ...prev, content }))}
                  placeholder="पूरी विस्तृत खबर / लेख"
                  className="min-h-[500px] rounded-md"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="rise-on-hover rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                  प्रीव्यू देखें
                </button>
              </div>
            </form>
          )}
          {blogMessage && <p className="mt-3 text-sm font-medium text-[var(--primary)]">{blogMessage}</p>}
        </section>


        {previewPost && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              <div className="mb-4 flex items-center rounded-lg bg-[var(--surface-soft)] p-3 text-sm text-[var(--muted)]">
                <span className="font-semibold text-[var(--primary)] flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                  </span>
                  पोस्ट का प्रीव्यू
                </span>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{previewPost.category}</p>
              <h2 className="font-serif text-2xl font-bold leading-tight text-[var(--headline)] sm:text-3xl">
                {previewPost.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <div className="inline-flex items-center gap-2">
                  {previewPost.authorImage && (
                    <img src={previewPost.authorImage} alt={previewPost.author} className="h-6 w-6 rounded-full object-cover" />
                  )}
                  <span className="font-semibold text-[var(--primary)]">{previewPost.author}</span>
                </div>
                <span>•</span>
                <span>{getPostTimeLabel(previewPost)}</span>
                <span>•</span>
                <span>0 क्लिक</span>
              </div>
              <div className="mt-4 border-t border-[var(--line)] pt-4"></div>
              {getPreviewImage(previewPost) && (
                <img
                  src={getPreviewImage(previewPost)!}
                  alt={previewPost.title}
                  className="mt-4 max-h-[320px] w-full rounded-lg object-cover"
                  style={{ objectPosition: focusToObjectPosition(previewPost.imageFocus) }}
                />
              )}
              <div className="mt-5 text-[var(--foreground)] ql-snow" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
                <ArticleRichText html={getFullArticle(previewPost)} debug={true} />
              </div>
              {previewPost.uploaderName && (
                <div className="mt-8 border-t border-[var(--line)] pt-4 text-right">
                  <span className="text-xs text-[var(--muted)]">अपलोडकर्ता: <span className="font-semibold text-[var(--foreground)]">{formatUploaderDisplay(previewPost.uploaderName, previewPost.author)}</span></span>
                </div>
              )}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => setPreviewPost(null)}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-semibold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  वापस जाएं (Edit)
                </button>
                <button
                  type="button"
                  onClick={() => void publishBlog()}
                  className="rounded-md bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:bg-[var(--primary-dark)]"
                >
                  प्रकाशित करें (Publish)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeEvent && (
          <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?event=${activeEvent.id}#abhiyan-calendar`;
                    navigator.clipboard.writeText(link);
                    alert('लिंक कॉपी किया गया!');
                  }}
                  className="rounded-full border border-[var(--line)] p-1.5 text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--foreground)]"
                  title="Copy Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/?event=${activeEvent.id}#abhiyan-calendar`;
                    const text = `${activeEvent.title}\n📅 ${formatDateWithDay(activeEvent.date)} ${activeEvent.time}\n📍 ${activeEvent.location}`;
                    if (navigator.share) {
                      navigator.share({ title: activeEvent.title, text, url: link }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${text}\n${link}`);
                      alert('विवरण और लिंक कॉपी किया गया!');
                    }
                  }}
                  className="rounded-full border border-[var(--line)] p-1.5 text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--foreground)]"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveEvent(null)}
                  className="rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--foreground)]"
                >
                  Close
                </button>
              </div>
              <h3 className="pr-20 font-serif text-2xl font-bold text-[var(--headline)]">{activeEvent.title}</h3>
              <div className="mt-4 flex flex-col gap-2 border-b border-[var(--line)] pb-4 text-sm font-semibold text-[var(--muted)]">
                <span className="flex items-center gap-1"><span className="text-[var(--primary)]">📅</span> {activeEvent.date ? `${formatDateWithDay(activeEvent.date)} • ${activeEvent.time}` : 'तय होना बाकी है'}</span>
                <span className="flex items-center gap-1"><span className="text-[var(--primary)]">📍</span> {activeEvent.location || 'तय होना बाकी है'}</span>
              </div>
              {activeEvent.imageUrl && (
                <div className="mt-4">
                  <img src={activeEvent.imageUrl} alt={activeEvent.title} className="max-h-[300px] w-full rounded-md object-contain border border-[var(--line)] bg-[var(--surface-soft)]" />
                </div>
              )}
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                {activeEvent.details}
              </div>
            </div>
          </div>
        )}

        {eventArchiveModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              <button
                type="button"
                onClick={() => setEventArchiveModalOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--foreground)]"
              >
                Close
              </button>
              <h3 className="pr-14 font-serif text-2xl font-bold text-[var(--headline)]">प्रोग्राम आर्काइव</h3>
              <div className="mt-4 border-b border-[var(--line)] pb-4">
                <label className="mb-2 block text-sm font-semibold text-[var(--muted)]">तिथि चुनें</label>
                <input 
                  type="date" 
                  value={archiveDate} 
                  onChange={(e) => setArchiveDate(e.target.value)} 
                  className="w-full rounded border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" 
                />
              </div>
              <div className="mt-4 space-y-3">
                {!archiveDate ? (
                  <p className="text-sm text-[var(--muted)]">ईवेंट देखने के लिए तिथि चुनें।</p>
                ) : (
                  events.filter(ev => ev.date === archiveDate).length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">इस तिथि पर कोई ईवेंट नहीं मिला।</p>
                  ) : (
                    events.filter(ev => ev.date === archiveDate).map(ev => (
                      <div onClick={() => setActiveEvent(ev)} key={ev.id} className="cursor-pointer rise-on-hover rounded-md border border-l-4 border-[var(--line)] border-l-[var(--primary)] bg-[var(--surface)] p-3">
                        <p className="font-semibold text-[var(--headline)]">{ev.title}</p>
                        <p className="text-[var(--muted)] text-xs mt-0.5">
                          {ev.date ? `${formatDateWithDay(ev.date)} • ${ev.time}` : 'तय होना बाकी है'}
                          {ev.location ? ` | ${ev.location}` : ''}
                        </p>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {isParichayVisible && (
          <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              <button
                type="button"
                onClick={() => setIsParichayVisible(false)}
                className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Close
              </button>
              <h3 className="pr-14 font-serif text-2xl font-bold text-[var(--headline)]">परिचय</h3>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--foreground)]">
                <p>नमस्ते!</p>
                <p>"वाम की आवाज़" (Vaam Ki Aawaz) ®️ में स्वागत है!</p>
                <p>
                  यह न्यूज़ पोर्टल आम आदमी की आवाज़ है - गरीबों, दलितों, पिछड़ों, आदिवासियों, महिलाओं, युवाओं, अल्पसंख्यकों और हर शोषित की बेबाक आवाज़!
                  हम आवाज़ उठाते हैं – क्योंकि बदलाव की शुरुआत आवाज़ से ही होती है! प्रगतिशील विचारों और वैकल्पिक नज़रिए से खबरें, विश्लेषण, विचार और सच सामने लाते हैं हम।
                </p>
                <p>
                  हम लड़ते हैं — जातिवाद, भाषाई सांप्रदायिकता और धार्मिक विभाजन के खिलाफ, नफरत, शोषण, असमानता और अन्याय के खिलाफ — एकता, समानता और इंसानियत की आवाज़!
                </p>
                <div>
                  <p>यहाँ मिलेगा:</p>
                  <p>• सच्ची और निष्पक्ष खबरें</p>
                  <p>• जीवन के असली मुद्दे</p>
                  <p>• जेंडर, जाति, धर्म और आर्थिक असमानता पर गहरी बातचीत</p>
                  <p>• युवाओं और उनके सपनों की आवाज़</p>
                  <p>• देश -विदेश की नीतियों पर सीधी-सटीक बात</p>
                  <p>• वैकल्पिक सोच और दृष्टिकोण - और भी बहुत कुछ</p>
                </div>
                <p>
                  अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ, तो — उठो, बोलो, बदलो! "वाम की आवाज़" (Vaam Ki Aawaz)
                  🎤आपकी आवाज़ है, ✊आपका हथियार है।
                </p>
                <p>न्याय, समानता और प्रगति में हैं विश्वास, तो कमेंट करें, वीडियो शेयर करें, सब्सक्राइब करें 🤝🏻</p>
              </div>
            </div>
          </div>
        )}

        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
            <div className="shadow-input relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 md:p-7">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Close
              </button>
              {!currentUser && (
                <div className="mx-auto w-full max-w-md">
                  <h3 className="text-xl font-bold text-[var(--headline)]">कंट्रोल पैनल लॉगिन</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    लॉगिन के बाद सिस्टम खुद आपकी भूमिका पहचान लेगा: मास्टर, एडमिन या योगदानकर्ता।
                  </p>
                  <form onSubmit={handleLogin} className="my-8 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="auth-email" className="text-sm font-medium text-[var(--headline)]">
                        Email Address / Username
                      </label>
                      <input
                        id="auth-email"
                        type="text"
                        value={loginForm.email}
                        onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="admin@site.com"
                        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="auth-password" className="text-sm font-medium text-[var(--headline)]">
                        Password
                      </label>
                      <input
                        id="auth-password"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                        placeholder="••••••••"
                        className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                      />
                    </div>
                    <button
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] font-medium text-white"
                      type="submit"
                    >
                      लॉगिन करें →
                    </button>
                  </form>
                  {loginMessage && <p className="text-sm text-[var(--primary)]">{loginMessage}</p>}
                </div>
              )}
              {currentUser && (
                <div className="space-y-5">
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--headline)]">
                        <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                        लॉगिन: {currentUser.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold">
                          {roleText}
                        </span>
                        <button
                          onClick={handleLogout}
                          className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          लॉगआउट
                        </button>
                      </div>
                    </div>
                  </div>
                  {isMaster && (
                    <>
                      <section className="rounded-lg border border-[var(--line)] p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-[var(--headline)]">अभियान कैलेंडर नियंत्रण</h4>
                          {editingEventId && <button type="button" onClick={() => { setEditingEventId(null); setNewEventForm({ title: '', date: '', time: '', location: '', details: '', imageUrl: '' }); }} className="text-xs text-red-500 underline">Cancel Edit</button>}
                        </div>
                        <form onSubmit={handleAddEvent} className="mt-4 space-y-3">
                          <input required value={newEventForm.title} onChange={e => setNewEventForm({...newEventForm, title: e.target.value})} placeholder="इवेंट का नाम (Title)" className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={newEventForm.date} onChange={e => setNewEventForm({...newEventForm, date: e.target.value})} className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                            <input type="time" value={newEventForm.time} onChange={e => setNewEventForm({...newEventForm, time: e.target.value})} className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          </div>
                          <input value={newEventForm.location} onChange={e => setNewEventForm({...newEventForm, location: e.target.value})} placeholder="स्थान (Location) (वैकल्पिक)" className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <input type="url" value={newEventForm.imageUrl || ''} onChange={e => setNewEventForm({...newEventForm, imageUrl: e.target.value})} placeholder="इमेज URL (Share Thumbnail) (वैकल्पिक)" className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <textarea required value={newEventForm.details} onChange={e => setNewEventForm({...newEventForm, details: e.target.value})} placeholder="पूरी जानकारी" className="w-full h-20 resize-none rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                            {editingEventId ? "इवेंट अपडेट करें" : "+ नया इवेंट जोड़ें"}
                          </button>
                        </form>
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                          {events.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between rounded border border-[var(--line)] p-2">
                              <div>
                                <p className="text-sm font-semibold">{ev.title}</p>
                                <p className="text-xs text-[var(--muted)]">{ev.date ? `${ev.date} | ${ev.time}` : 'तय होना बाकी है'}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingEventId(ev.id); setNewEventForm({ title: ev.title, date: ev.date, time: ev.time, location: ev.location, details: ev.details, imageUrl: ev.imageUrl || '' }); }} className="text-xs text-blue-500 hover:underline">संपादित करें</button>
                                <button onClick={() => handleRemoveEvent(ev.id)} className="text-xs text-red-500 hover:underline">हटाएं</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-lg border border-[var(--line)] p-4">
                        <h4 className="text-lg font-semibold text-[var(--headline)]">प्रमुख विचार चयन</h4>
                        <p className="mt-1 text-xs text-[var(--muted)]">होमपेज पर दिखने वाले लेख चुनें (केवल शीर्षक दिखेगा)</p>
                        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
                          {blogs.slice(0, 50).map((post) => (
                            <label key={post.id} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={featuredVicharIds.includes(post.id)}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...featuredVicharIds, post.id]
                                    : featuredVicharIds.filter((id) => id !== post.id);
                                  void saveFeaturedVichar(next);
                                }}
                              />
                              <span className="line-clamp-2">{post.title}</span>
                            </label>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-lg border border-[var(--line)] p-4">
                        <h4 className="text-lg font-semibold text-[var(--headline)]">मास्टर एडमिन लेखक प्रोफ़ाइल</h4>
                      <form onSubmit={handleSaveMasterAuthorProfile} className="mt-3 space-y-2">
                        <input
                          value={masterAuthorForm.authorName}
                          onChange={(event) =>
                            setMasterAuthorForm((prev) => ({ ...prev, authorName: event.target.value }))
                          }
                          placeholder="लेखक नाम"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                          लेखक फोटो
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleUserAuthorImageInputChange(event, "master")}
                            className="w-full text-xs"
                          />
                        </label>
                        {masterAuthorForm.authorImage && (
                          <img
                            src={masterAuthorForm.authorImage}
                            alt={masterAuthorForm.authorName || "Master author"}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        )}
                        <label className="flex items-center gap-2 text-sm text-[var(--headline)]">
                          <input
                            type="checkbox"
                            checked={masterAuthorForm.penNameEnabled}
                            onChange={(event) =>
                              setMasterAuthorForm((prev) => ({ ...prev, penNameEnabled: event.target.checked }))
                            }
                          />
                          पेन नेम उपयोग करें
                        </label>
                        {masterAuthorForm.penNameEnabled && (
                          <>
                            <input
                              value={masterAuthorForm.penName}
                              onChange={(event) =>
                                setMasterAuthorForm((prev) => ({ ...prev, penName: event.target.value }))
                              }
                              placeholder="पेन नेम"
                              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                            />
                            <div className="space-y-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted)]">
                              <label className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="master-pen-name-display"
                                  checked={masterAuthorForm.penNameDisplayMode === "alongside"}
                                  onChange={() =>
                                    setMasterAuthorForm((prev) => ({ ...prev, penNameDisplayMode: "alongside" }))
                                  }
                                />
                                <span>असली नाम के साथ दिखाएं (जैसे: {masterAuthorForm.authorName.trim() || "नाम"} &apos;{masterAuthorForm.penName.trim() || "पेन नेम"}&apos;)</span>
                              </label>
                              <label className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="master-pen-name-display"
                                  checked={masterAuthorForm.penNameDisplayMode === "only"}
                                  onChange={() =>
                                    setMasterAuthorForm((prev) => ({ ...prev, penNameDisplayMode: "only" }))
                                  }
                                />
                                <span>केवल पेन नेम दिखाएं</span>
                              </label>
                            </div>
                          </>
                        )}
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          प्रोफ़ाइल अपडेट करें
                        </button>
                      </form>
                    </section>
                    </>
                  )}
                  {canManageUsers && (
                    <section className="rounded-lg border border-[var(--line)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--headline)]">एडमिन सूची</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">मास्टर: {users.find(u => u.role === "master")?.email || "N/A"}</p>
                      <div className="mt-3 space-y-3">
                        {adminAccounts.map((admin) => (
                          <div key={admin.id} className="rounded-md border border-[var(--line)] p-3">
                            <p className="text-sm font-semibold text-[var(--headline)]">{admin.email}</p>
                            <div className="mt-2 grid grid-cols-1 gap-2">
                              {permissionLabels.map((perm) => (
                                <label key={perm.key} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                                  <input
                                    type="checkbox"
                                    checked={admin.permissions[perm.key]}
                                    disabled={!isMaster}
                                    onChange={() => void handleAdminPermissionToggle(admin.id, perm.key)}
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                            <button
                              onClick={() => void handleRemoveAdmin(admin.id)}
                              className="rise-on-hover mt-3 rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                            >
                              Remove Admin
                            </button>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddAdmin} className="mt-4 space-y-2">
                        <input
                          type="text"
                          value={newAdminForm.email}
                          onChange={(event) => setNewAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="ईमेल (वैकल्पिक यदि मास्टर एडमिन है)"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <input
                          type="password"
                          value={newAdminForm.password}
                          onChange={(event) => setNewAdminForm((prev) => ({ ...prev, password: event.target.value }))}
                          placeholder="पासवर्ड"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <input
                          value={newAdminForm.authorName}
                          onChange={(event) => setNewAdminForm((prev) => ({ ...prev, authorName: event.target.value }))}
                          placeholder="एडमिन नाम"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <div className="grid grid-cols-1 gap-1">
                          {permissionLabels.map((perm) => (
                            <label key={perm.key} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                              <input
                                type="checkbox"
                                checked={newAdminForm.permissions[perm.key]}
                                disabled={!isMaster}
                                onChange={() =>
                                  setNewAdminForm((prev) => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [perm.key]: !prev.permissions[perm.key],
                                    },
                                    ...(perm.key === "publishBlog" && prev.permissions.publishBlog
                                      ? { authorImage: "" }
                                      : {}),
                                  }))
                                }
                              />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                        {newAdminForm.permissions.publishBlog && (
                          <>
                            <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                              लेखक फोटो
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => void handleUserAuthorImageInputChange(event, "admin")}
                                className="w-full text-xs"
                              />
                            </label>
                          </>
                        )}
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          Add Admin
                        </button>
                        {!isMaster && (
                          <p className="text-xs text-[var(--muted)]">
                            एडमिन परमिशन संशोधन केवल मास्टर एडमिन कर सकता है।
                          </p>
                        )}
                      </form>
                    </section>
                  )}
                  {canManageCategories && (
                    <section className="rounded-lg border border-[var(--line)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--headline)]">कैटेगरी नियंत्रण</h4>
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {allCategories
                          .filter((category) => category !== "सभी")
                          .map((category) => (
                            <div
                              key={category}
                              className="flex items-center justify-between rounded-md border border-[var(--line)] px-3 py-2"
                            >
                              <span className="text-sm text-[var(--headline)]">{category}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCategory(category)}
                                className="rise-on-hover rounded-md border border-[var(--line)] px-2 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                      </div>
                      <form onSubmit={handleAddCategory} className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={newCategoryName}
                          onChange={(event) => setNewCategoryName(event.target.value)}
                          placeholder="नई कैटेगरी नाम"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          Add Category
                        </button>
                      </form>
                    </section>
                  )}
                  {canManageUsers && (
                    <section className="rounded-lg border border-[var(--line)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--headline)]">अधिकृत योगदानकर्ता</h4>
                      <div className="mt-3 space-y-2">
                        {contributorAccounts.map((contributor) => (
                          <div key={contributor.id} className="rounded-md border border-[var(--line)] p-3">
                            <p className="text-sm font-semibold text-[var(--headline)]">{contributor.email}</p>
                            <p className="text-xs text-[var(--muted)]">{contributor.active ? "सक्रिय" : "निष्क्रिय"}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isMaster && (
                                <button
                                  onClick={() => void handleToggleContributor(contributor.id)}
                                  className="rise-on-hover rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                                >
                                  {contributor.active ? "Disable" : "Enable"}
                                </button>
                              )}
                              <button
                                onClick={() => void handleRemoveContributor(contributor.id)}
                                className="rise-on-hover rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <form onSubmit={handleAddContributor} className="mt-4 space-y-2">
                        <input
                          type="text"
                          value={newContributorForm.email}
                          onChange={(event) => setNewContributorForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="ईमेल (वैकल्पिक यदि मास्टर एडमिन है)"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <input
                          type="password"
                          value={newContributorForm.password}
                          onChange={(event) =>
                            setNewContributorForm((prev) => ({ ...prev, password: event.target.value }))
                          }
                          placeholder="पासवर्ड"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <input
                          value={newContributorForm.authorName}
                          onChange={(event) =>
                            setNewContributorForm((prev) => ({ ...prev, authorName: event.target.value }))
                          }
                          placeholder="लेखक नाम"
                          className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                        />
                        <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                          लेखक फोटो
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => void handleUserAuthorImageInputChange(event, "contributor")}
                            className="w-full text-xs"
                          />
                        </label>
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          Add Contributor
                        </button>
                      </form>
                    </section>
                  )}
                  {currentUser.role === "contributor" && (
                    <p className="rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
                      {currentUser.active
                        ? "आपका योगदानकर्ता एक्सेस सक्रिय है। आप ब्लॉग सेक्शन से पोस्ट प्रकाशित कर सकते हैं।"
                        : "आपका खाता निष्क्रिय कर दिया गया है। अब आप नई पोस्ट प्रकाशित नहीं कर सकते।"}
                    </p>
                  )}
                  {canPublishBlog && currentUser.role !== "master" && (
                    <section className="rounded-lg border border-[var(--line)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--headline)]">लेखक पेन नेम सेटिंग</h4>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        लेखक नाम: {currentUser.authorName || "—"}
                      </p>
                      <form onSubmit={handleSaveSelfPenName} className="mt-3 space-y-2">
                        <label className="flex items-center gap-2 text-sm text-[var(--headline)]">
                          <input
                            type="checkbox"
                            checked={selfPenNameForm.penNameEnabled}
                            onChange={(event) =>
                              setSelfPenNameForm((prev) => ({ ...prev, penNameEnabled: event.target.checked }))
                            }
                          />
                          पेन नेम उपयोग करें
                        </label>
                        {selfPenNameForm.penNameEnabled && (
                          <>
                            <input
                              value={selfPenNameForm.penName}
                              onChange={(event) =>
                                setSelfPenNameForm((prev) => ({ ...prev, penName: event.target.value }))
                              }
                              placeholder="पेन नेम"
                              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                            />
                            <div className="space-y-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--muted)]">
                              <label className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="self-pen-name-display"
                                  checked={selfPenNameForm.penNameDisplayMode === "alongside"}
                                  onChange={() =>
                                    setSelfPenNameForm((prev) => ({ ...prev, penNameDisplayMode: "alongside" }))
                                  }
                                />
                                <span>असली नाम के साथ दिखाएं (जैसे: {currentUser.authorName || "नाम"} &apos;{selfPenNameForm.penName.trim() || "पेन नेम"}&apos;)</span>
                              </label>
                              <label className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  name="self-pen-name-display"
                                  checked={selfPenNameForm.penNameDisplayMode === "only"}
                                  onChange={() =>
                                    setSelfPenNameForm((prev) => ({ ...prev, penNameDisplayMode: "only" }))
                                  }
                                />
                                <span>केवल पेन नेम दिखाएं</span>
                              </label>
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                              प्रदर्शित नाम:{" "}
                              {formatAuthorDisplayName(currentUser.authorName, {
                                penNameEnabled: selfPenNameForm.penNameEnabled,
                                penName: selfPenNameForm.penName,
                                penNameDisplayMode: selfPenNameForm.penNameDisplayMode,
                              })}
                            </p>
                          </>
                        )}
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          पेन नेम सेव करें
                        </button>
                      </form>
                    </section>
                  )}
                  {adminMessage && <p className="text-sm text-[var(--primary)]">{adminMessage}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="site-footer" style={{ background: "var(--ink)", borderTop: "3px solid var(--crimson)", padding: "48px 24px 24px", marginLeft: -16, marginRight: -16 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="footer-grid" style={{ marginBottom: 40 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <img
                    src="/vaamki-logo.png"
                    alt="वाम की आवाज़ लोगो"
                    onError={(event) => {
                      event.currentTarget.src = "/vercel.svg";
                    }}
                    style={{ width: 52, height: 52, objectFit: "contain", border: "1px solid var(--divider)", background: "var(--surface-mid)", padding: 3 }}
                  />
                  <div className={`site-footer__brand ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`} style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 34, fontWeight: 700 }}>वाम की आवाज़</div>
                </div>
                <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: 16 }}>
                  {SITE_TAGLINE}
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <a href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="Facebook">
                    <FacebookIcon className="h-[18px] w-[18px]" />
                  </a>
                  <a href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="YouTube">
                    <YoutubeIcon className="h-[18px] w-[18px]" />
                  </a>
                  <a href="https://www.x.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="YouTube">
                    <TwitterIcon className="h-[18px] w-[18px]" />
                  </a>
                  <a href="https://www.instagram.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="YouTube">
                    <InstagramIcon className="h-[18px] w-[18px]" />
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>मुख्य पन्ने</div>
                {[
                  { label: "होम", value: "home" },
                  { label: "ताज़ा खबरें", value: "latest" },
                  { label: "आलेख", value: "add-news" },
                  { label: "संसाधन", value: "resources" },
                  { label: "न्यूज़लेटर", value: "newsletter" },
                ].map((link) => (
                  <div key={link.label} style={{ marginBottom: 8 }}>
                    <button type="button" onClick={() => handleNavTabChange(link.value)} style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
                      {link.label}
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>जानकारी</div>
                {[
                  { label: "हमारे बारे में", href: "/about-us" },
                  { label: "संपादकीय नीति", href: "/editorial-policy" },
                  { label: "सुधार नीति", href: "/corrections-policy" },
                  { label: "गोपनीयता नीति", href: "/privacy-policy" },
                  { label: "संपर्क करें", href: "/contact-us" },
                ].map((link) => (
                  <div key={link.label} style={{ marginBottom: 8 }}>
                    <Link href={link.href} style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>आर्काइव</div>
                <div style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEventArchiveModalOpen(true)}
                    style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)", background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    अभियान कैलेंडर आर्काइव
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>© 2026 वाम की आवाज़ — जन संघर्ष का डिजिटल पुरालेख</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>Made for the Movement</span>
            </div>
          </div>
        </footer>
      </div>
    </div>

    {otpModalState.isOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl">
          <button
            type="button"
            onClick={() => setOtpModalState((prev) => ({ ...prev, isOpen: false }))}
            className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-white"
          >
            Close
          </button>
          <h3 className="font-serif text-xl font-bold text-[var(--headline)] mb-2">OTP Verification</h3>
          <p className="text-sm text-[var(--muted)] mb-5">
            एक सत्यापन कोड <strong>{otpModalState.email}</strong> पर भेजा गया है। कृपया उसे नीचे दर्ज करें।
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={otpCode}
              disabled={otpModalState.isLoading}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full text-center tracking-widest font-mono text-xl rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 outline-none focus:border-[var(--primary)]"
              maxLength={6}
            />
            {otpModalState.error && <p className="text-xs text-[var(--primary)]">{otpModalState.error}</p>}
            <button
              disabled={otpModalState.isLoading || otpCode.length < 6}
              onClick={handleVerifyOtp}
              id="verifyOtpBtn"
              className="rise-on-hover w-full rounded-md bg-[var(--primary)] px-4 py-2 font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:pointer-events-none"
            >
              {otpModalState.isLoading ? "सत्यापन हो रहा है..." : "सत्यापित करें"}
            </button>
          </div>
        </div>
      </div>
    )}


    {activeResource && (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <div className="flex w-[95%] max-w-5xl items-center justify-between bg-[var(--surface)] p-3 rounded-t-xl border-b border-[var(--line)]">
          <h2 className="text-lg font-bold text-[var(--headline)] truncate">{activeResource.title}</h2>
          <div className="flex gap-2">
            {activeResource.type === 'link' && activeResource.url && (
              <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                ओपन न्यू टैब (New Tab)
              </a>
            )}
            {activeResource.type === "pdf" && (activeResource.url || activeResource.fileData) && (
              <a href={activeResource.url || activeResource.fileData || "#"} download={`${activeResource.title}.pdf`} className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                डाउनलोड (Download)
              </a>
            )}
            <button
              onClick={() => setActiveResource(null)}
              className="rounded-md bg-gray-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        <div className="w-[95%] max-w-5xl flex-1 bg-[white] rounded-b-xl overflow-hidden relative">
          {activeResource.type === 'link' && activeResource.url ? (
            <iframe src={activeResource.url} className="w-full h-full border-none" title={activeResource.title} />
          ) : activeResource.type === "pdf" && (activeResource.url || activeResource.fileData) ? (
            <iframe src={activeResource.url || activeResource.fileData || ""} className="w-full h-full border-none" title={activeResource.title} />
          ) : activeResource.type === "pdf" && !activeResource.url && !activeResource.fileData ? (
            <div className="flex w-full h-full items-center justify-center text-black font-semibold">
              PDF लोड हो रहा है... कृपया प्रतीक्षा करें।
            </div>
          ) : null}
        </div>
      </div>
    )}
    {cropModalSrc && (
      <ImageCropModal
        imageSrc={cropModalSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    )}

    {historicEventModalOpen && (
      <div className="fixed inset-0 z-[122] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
          <button
            type="button"
            onClick={() => setHistoricEventModalOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Close
          </button>
          <h3 className="pr-14 font-serif text-2xl font-bold text-[var(--headline)]">आज का इतिहास</h3>
          {historicEventLoading ? (
            <p className="mt-4 text-sm text-[var(--muted)]">लोड हो रहा है...</p>
          ) : historicEventData ? (
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--foreground)]">
              <p className="text-[var(--muted)]">{historicEventData.date}{historicEventData.year ? ` • ${historicEventData.year}` : ""}</p>
              <p>{historicEventData.description}</p>
              {historicEventData.wikiUrl && (
                <a href={historicEventData.wikiUrl} target="_blank" rel="noreferrer" className="inline-flex text-[var(--primary)] font-semibold hover:underline">
                  और पढ़ें →
                </a>
              )}
            </div>
          ) : null}
        </div>
      </div>
    )}

    {todayKaryakramOpen && (
      <div className="fixed inset-0 z-[122] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
          <button
            type="button"
            onClick={() => setTodayKaryakramOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            Close
          </button>
          <h3 className="pr-14 font-serif text-2xl font-bold text-[var(--headline)]">आज के कार्यक्रम</h3>
          <div className="mt-4 space-y-3">
            {todayEvents.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">आज के लिए कोई कार्यक्रम उपलब्ध नहीं है।</p>
            ) : (
              todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => { setActiveEvent(ev); setTodayKaryakramOpen(false); }}
                  className="cursor-pointer rise-on-hover rounded-md border border-l-4 border-[var(--line)] border-l-[var(--primary)] bg-[var(--surface)] p-3"
                >
                  <p className="font-semibold text-[var(--headline)]">{ev.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {ev.date ? `${formatDateWithDay(ev.date)} • ${ev.time}` : "तय होना बाकी है"}
                    {ev.location ? ` | ${ev.location}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    <GoToTopButton />
    </>
  );
}
