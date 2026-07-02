"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Share2, Printer, ArrowLeft, Clock, Eye, ChevronRight, Copy, Check, Trash2, Edit3, X, LogIn, Menu, Languages, Link as LinkIcon } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";
import { AnimatePresence, motion } from "motion/react";
import { useRef, type CSSProperties } from "react";
import "react-quill-new/dist/quill.snow.css";
import { ArticleRichText } from "@/utils/sanitizeHtml";
import { getCategoryClass, formatViews, readingTime, cleanHtml, getTodayHindi, fmtDate, speakHindiText } from "@/utils/designUtils";
import { focusToObjectPosition } from "@/lib/imageCrop";
import { resolvePostImage } from "@/lib/postImage";
import { TiptapEditor } from "@/components/TiptapEditor";
import AuthorProfileBox from "@/components/AuthorProfileBox";
import ArticleLoginModal from "@/components/ArticleLoginModal";
import { postAuthorMatchesUser } from "@/lib/penName";
import { SectionHeader } from "@/components/SectionHeader";

type Post = {
  id: string; category: string; title: string; excerpt: string; content: string;
  author: string; postImage?: string | null; imageFocus?: string | null; authorImage?: string | null;
  clickCount?: number; uploaderName?: string | null; authorUserId?: string | null;
  createdAt: string; time: string; source: "blog";
};
type SidebarPost = Post;
type Evt = { id: string; title: string; date: string; time: string; location: string; details: string; imageUrl?: string };
type Res = { id: string; title: string; type: string; url: string | null; createdAt: string };

const THEME_KEY = "vaamki-aawaz-theme";

const navTabs = [
  { title: "होम", value: "home" },
  { title: "ताज़ा खबरें", value: "latest" },
  { title: "ब्लॉग", value: "blogs" },
  { title: "संसाधन", value: "resources" },
  { title: "न्यूज़लेटर", value: "newsletter" },
  { title: "कैटेगरी", value: "categories" },
  { title: "परिचय", value: "parichay" },
];

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "h-4 w-4"} fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 1 0 20 14.5z"/></svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/></svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const FacebookIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className || "h-5.5 w-5.5"} fill="currentColor"><g transform="translate(0 -1.5)"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z"/></g></svg>
);
const TwitterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.03) translate(0 -2)">
      <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.3L6.5 22H3.4l7.3-8.3L1 2h6.2l4.3 5.7L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
    </g>
  </svg>
);

const InstagramIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(1.03) translate(0 -2)">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </g>
  </svg>
);

export default function ArticlePage({ post, suggestedPosts, sidebarTopReads, authorPosts, events, resources }: {
  post: Post; suggestedPosts: SidebarPost[]; sidebarTopReads: SidebarPost[];
  authorPosts: SidebarPost[];
  events: Evt[]; resources: Res[];
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<"light"|"dark">("light");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sessionEmail, setSessionEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userAuthorName, setUserAuthorName] = useState("");
  const [userPermissions, setUserPermissions] = useState<Record<string, unknown> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, excerpt: post.excerpt, content: post.content });
  const [saving, setSaving] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  
  const [displayedSuggested, setDisplayedSuggested] = useState<Post[]>(suggestedPosts);
  const [allFetchedPosts, setAllFetchedPosts] = useState<Post[] | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<Evt | null>(null);

  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return 'तय होना बाकी है';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
    return `${days[d.getDay()]}, ${d.toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => !ev.date || ev.date >= todayStr)
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        const dateA = new Date(`${a.date}T${a.time || '00:00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00:00'}`).getTime();
        return dateA - dateB;
      });
  }, [events, todayStr]);

  const hasIncrementedRef = useRef(false);
  useEffect(() => {
    if (!hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      fetch(`/api/blogs/${post.id}/click`, { method: "POST" }).catch(() => {});
    }
  }, [post.id]);

  useEffect(() => {
    setDisplayedSuggested(suggestedPosts);
    setAllFetchedPosts(null);
    setHasMore(true);
  }, [post.id, suggestedPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          
          let sourcePosts = allFetchedPosts;
          
          if (!sourcePosts) {
            try {
              const res = await fetch("/api/blogs");
              const data = await res.json();
              sourcePosts = data.posts as Post[];
              setAllFetchedPosts(sourcePosts);
            } catch (e) {
              console.error(e);
              setIsLoadingMore(false);
              return;
            }
          }
          
          const existingIds = new Set([post.id, ...displayedSuggested.map(p => p.id)]);
          let newAvailable = sourcePosts.filter(p => !existingIds.has(p.id));
          
          if (newAvailable.length === 0) {
            setHasMore(false);
          } else {
            newAvailable.sort((a, b) => {
              if (a.category === post.category && b.category !== post.category) return -1;
              if (a.category !== post.category && b.category === post.category) return 1;
              return 0;
            });
            
            const nextBatch = newAvailable.slice(0, 4);
            setDisplayedSuggested(prev => {
              const newSet = new Set(prev.map(p => p.id));
              const uniqueNext = nextBatch.filter(p => !newSet.has(p.id));
              return [...prev, ...uniqueNext];
            });
            
            if (newAvailable.length <= 4) {
              setHasMore(false);
            }
          }
          
          setIsLoadingMore(false);
        }
      },
      { rootMargin: "300px" }
    );

    const target = loadMoreRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [allFetchedPosts, displayedSuggested, hasMore, isLoadingMore, post.category, post.id]);

  const displayUploaderName = post.uploaderName === 'मास्टर एडमिन' ? 'केशव कुमार भट्टड़' : post.uploaderName === 'अज्ञात' ? post.author : post.uploaderName;

  const [isScrolledHeader, setIsScrolledHeader] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNewsDate, setSelectedNewsDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ताज़ा खबरें");
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const allCategories = ["साहित्य-संस्कृति", "अतिथि लेखन", "महिला मुद्दे", "छात्र-युवा", "मज़दूर-किसान", "पर्यावरण", "अंतर्राष्ट्रीय", "कला-संस्कृति", "इतिहास-विमर्श", "विविध"];

  const handleNavTabChange = (value: string) => {
    if (value === "categories") {
      setIsCategoryMenuOpen((prev) => !prev);
      return;
    }
    if (value === "home") {
      router.push("/");
      return;
    }
    router.push(`/?tab=${value}`);
  };

  const handleMobileNavTabClick = (value: string) => {
    if (value === "categories") {
      setIsCategoryMenuOpen((prev) => !prev);
      return;
    }
    router.push(value === "home" ? "/" : `/?tab=${value}`);
    setIsMobileNavOpen(false);
  };

  useEffect(() => {
    let ticking = false;
    let lastCompact = "";

    const update = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 12;
      setIsScrolledHeader((prev) => (prev === isScrolled ? prev : isScrolled));
      
      const compact = isScrolled ? "1" : "0";
      if (lastCompact !== compact) {
        lastCompact = compact;
        if (stickyHeaderRef.current) {
          stickyHeaderRef.current.style.setProperty("--compact-progress", compact);
        }
      }
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
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const mins = useMemo(() => readingTime(post.content), [post.content]);
  const articleUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : "";

  useEffect(() => {
    const t = localStorage.getItem(THEME_KEY) as "light"|"dark"|null;
    if (t) setTheme(t);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setSessionEmail(d.user.email);
          setUserRole(d.user.role);
          let perm = d.user.permissions;
          if (typeof perm === "string") {
            try { perm = JSON.parse(perm); } catch (e) {}
          }
          if (perm && typeof perm === "object" && perm.authorName) {
            setUserAuthorName(perm.authorName.trim().toLowerCase());
            setUserPermissions(perm as Record<string, unknown>);
          }
        }
      }).catch(() => {});
  }, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const checkAndMoveTranslate = () => {
      const gTranslate = document.getElementById("google_translate_element");
      const placeholder = document.getElementById("article_translate_placeholder");
      if (gTranslate && placeholder && gTranslate.innerHTML.trim() !== "") {
        placeholder.appendChild(gTranslate);
      } else {
        setTimeout(checkAndMoveTranslate, 500);
      }
    };
    checkAndMoveTranslate();
    
    return () => {
      const translateEl = document.getElementById("google_translate_element");
      const container = document.getElementById("google_translate_container");
      if (container && translateEl) {
        container.appendChild(translateEl);
      }
    };
  }, []);

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const isMaster = userRole === "MASTER_ADMIN";
  const isAuthor = userPermissions ? postAuthorMatchesUser(userPermissions, post.author) : false;
  const isUploader = userAuthorName && post.uploaderName && userAuthorName === post.uploaderName.trim().toLowerCase();
  const canEdit = isMaster || isAuthor || isUploader;
  const canDelete = isMaster || isUploader;
  
  const roleText = userRole === "MASTER_ADMIN" 
    ? "मास्टर एडमिन" 
    : userRole === "ADMIN" 
      ? "एडमिन" 
      : userRole === "CONTRIBUTOR" 
        ? "योगदानकर्ता" 
        : "";
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleWhatsapp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + "\n\n" + articleUrl)}`, "_blank");
  };
  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, "_blank");
  };
  const handlePrint = () => window.print();
  const changeFontSize = (delta: number) => {
    if (typeof document === "undefined") return;
    const current = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const next = Math.min(22, Math.max(13, current + delta));
    document.documentElement.style.fontSize = `${next}px`;
  };
  const readArticleAloud = () => {
    const plain = `${post.title}. ${(post.excerpt || "").replace(/<[^>]*>/g, " ")} ${(post.content || "").replace(/<[^>]*>/g, " ")}`
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    speakHindiText(plain);
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blogs/${post.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) router.push("/");
      else alert("हटाने में त्रुटि हुई");
    } catch { alert("नेटवर्क त्रुटि"); }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const handleEditSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/blogs/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
        credentials: "include"
      });
      if (res.ok) {
        setIsEditing(false);
        window.location.reload();
      } else {
        alert("संपादित करने में त्रुटि हुई");
      }
    } catch {
      alert("नेटवर्क त्रुटि");
    }
    setSaving(false);
  };

  const heroImg = post.postImage || null;

  return (
    <div className={`${theme === "dark" ? "theme-dark" : "theme-light"} news-shell min-h-screen`}>
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* ─── Top bar ─── */}
        <div className="article-no-print notranslate hidden min-[550px]:flex items-center justify-between gap-2 border-b border-[var(--line)] py-2 text-xs text-[var(--muted)] sm:text-sm">
          <span className="shrink-0 whitespace-nowrap">
            {new Date().toLocaleDateString("hi-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              weekday: "long",
            })}
          </span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => changeFontSize(-1)}
              title="फ़ॉन्ट छोटा करें"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--gold)", background: "transparent", border: "1px solid var(--divider)", padding: "1px 7px", cursor: "pointer" }}
            >
              अ−
            </button>
            <button
              type="button"
              onClick={() => changeFontSize(1)}
              title="फ़ॉन्ट बड़ा करें"
              style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 15, color: "var(--gold)", background: "transparent", border: "1px solid var(--divider)", padding: "1px 7px", cursor: "pointer" }}
            >
              अ+
            </button>
            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-black hover:text-[var(--primary)]"}`} href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <FacebookIcon />
            </a>
            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-black hover:text-[var(--primary)]"}`} href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer">
              <YoutubeIcon />
            </a>
            <a className={`interactive-link inline-flex items-center justify-center h-8 w-8 ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-black hover:text-[var(--primary)]"}`} href="https://www.instagram.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a href="mailto:vaamkiaawaz@gmail.com" className={`interactive-link hidden px-2 py-1 text-xs md:inline-flex md:text-sm ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-black hover:text-[var(--primary)]"}`}>
              संपर्क: vaamkiaawaz@gmail.com
            </a>
            <button
              onClick={handleLoginClick}
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{sessionEmail ? roleText || "लॉगिन है" : "लॉगिन"}</span>
            </button>
            <a href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer" className="btn-primary hidden sm:inline-flex" style={{ padding: "3px 12px", fontSize: 11 }}>
              सदस्यता में
            </a>
          </div>
        </div>

        {/* ─── Header & Nav (Sticky) ─── */}
        <div
          ref={stickyHeaderRef}
          className={`notranslate sticky top-0 z-50 ${isScrolledHeader ? (theme === "dark" ? "bg-[var(--surface)]" : "bg-white") : "bg-transparent"}`}
          style={{ "--compact-progress": 0 } as CSSProperties}
        >
          <header
            id="top"
            className="headline-fade home-header"
            style={{
              background: "var(--ink)",
              padding: "10px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <Link href="/" className="home-header__brand" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
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
                <div className="home-header__subtitle" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "var(--gold)", letterSpacing: "0.09em", textAlign: "center" }}>
                  विकल्प की डिजिटल दुनिया
                </div>
              </div>
            </Link>
            <div className="hidden lg:block" style={{ position: "absolute", right: 24 }}>
              <a href="https://www.youtube.com/@VaamKiAawaz" className="btn-primary">
                लाइव कवरेज
              </a>
            </div>
          </header>

          <nav
            className="backdrop-blur-md"
            style={{
              background: isScrolledHeader ? "rgba(15,15,15,0.96)" : "var(--ink)",
              borderBottom: "2px solid var(--crimson)",
              padding: "8px 12px",
            }}
          >
            <div className="relative flex flex-row items-center justify-between gap-2 px-1 sm:px-0">
              <div className="flex items-center gap-2 flex-1 pr-2">
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
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Mega Menu</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {allCategories.filter((category) => category !== "ब्लॉग").map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
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
              <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pr-1 sm:pr-0 lg:w-auto lg:flex-none lg:justify-end">
                <div className="hidden md:block">
                  <GooeyInput
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    placeholder="खबरें खोजें..."
                    className="w-auto shrink"
                    collapsedWidth={140}
                    expandedWidth={220}
                    expandedOffset={49}
                    classNames={{
                      trigger: theme === "dark"
                        ? "bg-[#2A1E1E] border-[#3A2A2A] text-[#F5EDEB]"
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#0F0F0F]",

                      bubbleSurface: theme === "dark"
                        ? "bg-[#7D0F13] border-[#5E0B0E] text-white"
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#0F0F0F]",
                        
                      input: theme === "dark"
                        ? "text-white placeholder:text-white/70"
                        : "text-black placeholder:text-black/70"
                    }}
                  />
                </div>
                <input
                  type="date"
                  value={selectedNewsDate}
                  onChange={(event) => {
                    setSelectedNewsDate(event.target.value);
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
                        <a href="https://www.facebook.com/VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><FacebookIcon /></a>
                        <a href="https://www.youtube.com/@VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><YoutubeIcon /></a>
                        <a href="https://www.instagram.com/VaamKiAawaz" className="text-[var(--muted)] hover:text-[var(--primary)] p-1 border border-[var(--line)] rounded-full bg-[var(--surface)]"><TwitterIcon className="h-4 w-4" /></a>
                      </div>
                    </div>
                    
                    <a href="mailto:vaamkiaawaz@gmail.com" className="text-[var(--muted)] text-sm hover:text-[var(--primary)] block">
                      संपर्क: vaamkiaawaz@gmail.com
                    </a>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => { setIsMobileNavOpen(false); handleLoginClick(); }}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)]"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span className="truncate">{sessionEmail ? roleText || "लॉगिन है" : "लॉगिन"}</span>
                      </button>
                      
                      <a href="https://www.youtube.com/@VaamKiAawaz" className="btn-primary text-xs px-3 py-1.5">
                        सदस्यता में
                      </a>
                    </div>
                  </div>

                  <div className="mb-4 lg:hidden">
                    <a href="https://www.youtube.com/@VaamKiAawaz" className="btn-primary flex w-full justify-center">
                      लाइव कवरेज
                    </a>
                  </div>

                  <div className="mb-4">
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="खबरें खोजें..."
                      className="h-10 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
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
                                                                                          setIsCategoryMenuOpen(false);
                              setIsMobileNavOpen(false);
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

        {/* ─── Breadcrumb ─── */}
        <nav className="article-no-print notranslate flex items-center gap-1.5 py-3 text-xs text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--primary)]">होम</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/?tab=fresh`} className="hover:text-[var(--primary)]">ताज़ा खबरें</Link>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: "var(--gold)" }} className="font-semibold">{post.category}</span>
        </nav>

        {/* ─── Main layout ─── */}
        <main className="grid gap-8 pb-4 lg:grid-cols-12">

          {/* Article column */}
          <article className="article-paper lg:col-span-8 min-w-0 h-fit space-y-4 p-5 sm:p-8">

            {isEditing ? (
              <div
                className="article-edit-shell notranslate space-y-4 mb-8 bg-[var(--surface-soft)] p-6 rounded-xl border border-[var(--primary)]"
                style={theme === "dark" ? ({
                  "--surface": "#ffffff",
                  "--surface-soft": "#f8f3ea",
                  "--surface-mid": "#ede9e0",
                  "--surface-high": "#ede9e0",
                  "--foreground": "#0F0F0F",
                  "--headline": "#14110f",
                  "--text-primary": "#0F0F0F",
                  "--muted": "#0F0F0F",
                  "--line": "#e5ded9",
                  background: "#f8f3ea",
                } as CSSProperties) : undefined}
              >
                <h2 className="text-xl font-bold text-[var(--primary)] mb-4">लेख संपादित करें</h2>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[var(--foreground)]">शीर्षक (Title)</label>
                  <GooeyInput
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[var(--foreground)]">सारांश (Excerpt)</label>
                  <div className="min-w-0 bg-[var(--surface)] text-[var(--foreground)] rounded-md border border-[var(--line)]">
                    <TiptapEditor
                      value={editForm.excerpt}
                      onChange={(val) => setEditForm(prev => ({...prev, excerpt: val}))}
                      placeholder="संक्षिप्त सारांश यहाँ लिखें..."
                      className="min-h-[200px] h-auto rounded-md"
                      hideMediaLinks={true}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[var(--foreground)]">मुख्य लेख (Content)</label>
                  <div className="min-w-0 bg-[var(--surface)] text-[var(--foreground)] rounded-md border border-[var(--line)]">
                    <TiptapEditor
                      value={editForm.content}
                      onChange={(val) => setEditForm(prev => ({...prev, content: val}))}
                      placeholder="लेख का विवरण यहाँ लिखें..."
                      className="min-h-[500px] h-auto rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-4 py-2 rounded-lg border border-[var(--line)] text-[var(--foreground)] hover:bg-[var(--surface)]"
                  >
                    रद्द करें
                  </button>
                  <button 
                    onClick={handleEditSubmit} 
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "सहेज रहा है..." : "सहेजें (Save)"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Print Only Header */}
                <div className="hidden print-only notranslate border-b-2 border-black pb-4 mb-6 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <h1 className="font-serif text-4xl font-bold text-black uppercase tracking-wide">वाम की आवाज़</h1>
                    <p className="text-xs font-semibold tracking-widest text-gray-600 uppercase">जन समाचार मंच</p>
                  </div>
                </div>

                {/* Only title, excerpt & body are translated — nav/sidebar stay in Hindi */}
                <div id="article-translatable-content">
                  <div>
                    <span className={`cat-pill ${getCategoryClass(post.category)}`}>
                      {post.category}
                    </span>
                    <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[var(--headline)] sm:text-4xl lg:text-[2.6rem]">
                      {post.title}
                    </h1>
                  </div>

                {/* Meta row */}
                <div className="notranslate flex flex-wrap items-center gap-3 text-sm text-[var(--muted)] border-b border-[var(--line)] pb-4 mt-0">
                  {post.authorImage && (
                    <img src={post.authorImage} alt="" className="h-9 w-9 rounded-full border border-[var(--line)] object-cover" />
                  )}
                  <Link href={`/author/${encodeURIComponent(post.author)}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline">
                    {post.author}
                  </Link>
                  <span>•</span>
                  <span>{fmtDate(post.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mins} मिनट पठन</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatViews(post.clickCount ?? 0)} बार पढ़ा गया</span>
                  <button
                    type="button"
                    onClick={readArticleAloud}
                    className="article-no-print inline-flex items-center gap-1.5"
                    style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "4px 12px", cursor: "pointer" }}
                  >
                    🔊 <span>सुनें</span>
                  </button>
                  <div className="article-no-print relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowTranslate(!showTranslate)}
                      className="inline-flex items-center gap-1.5"
                      style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "var(--foreground)", background: "transparent", border: "1px solid var(--line)", padding: "4px 12px", cursor: "pointer" }}
                      title="Translate article"
                    >
                      <Languages className="h-3.5 w-3.5" />
                      <span>अनुवाद</span>
                    </button>
                    <div
                      id="article_translate_placeholder"
                      className={`absolute left-0 top-full mt-2 bg-white border border-[var(--line)] p-1 rounded-md shadow-lg z-[100] transition-all duration-200 ${showTranslate ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'}`}
                    />
                  </div>
                </div>

                {/* Abstract box */}
                <div className="article-invert article-abstract rounded-xl border-l-4 border-[var(--primary)] bg-[var(--surface-soft)] p-5">
                  <ArticleRichText
                    html={post.excerpt || ""}
                    className="italic"
                    debug={true}
                  />
                </div>

                {/* Hero image - only show if not already embedded in content */}
                {heroImg && !post.content?.includes(heroImg) && (
                  <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                    <img src={heroImg} alt={post.title} className="article-hero-img w-full object-cover" style={{ maxHeight: 480, objectPosition: focusToObjectPosition(post.imageFocus) }} />
                  </div>
                )}

                {/* Article content */}
                <ArticleRichText html={post.content || ""} className="[&>*:last-child]:mb-0 pb-0" debug={true} />
                </div>

                {/* Uploader credit - Web view only */}
                {displayUploaderName && (
                  <p className="article-no-print notranslate text-sm text-[var(--muted)] italic border-t border-[var(--line)] pt-3 mt-4">
                    अपलोडर: {displayUploaderName}
                  </p>
                )}

                {/* Print Only Footer */}
                <div className="hidden print-only notranslate mt-10 pt-6 border-t-2 border-black text-center break-inside-avoid">
                  <h4 className="font-serif text-lg font-bold text-black mb-2">{post.title}</h4>
                  <p className="text-xs text-gray-700 mb-4 font-medium">
                    अपलोडर: <span className="font-semibold">{displayUploaderName || post.author}</span> &bull; 
                    प्रकाशित: {fmtDate(post.createdAt)} &bull; {mins} मिनट पठन
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-serif font-bold text-sm text-black">वाम की आवाज़</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">जन समाचार मंच</span>
                  </div>
                </div>
              </>
            )}


            {/* Ad Placeholder - Bottom of article */}
            <div className="article-invert article-no-print notranslate my-6 flex h-[250px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]">
              <span className="text-sm font-semibold uppercase tracking-wide">विज्ञापन</span>
            </div>

          </article>

          {/* Sidebar */}
          <aside className="article-no-print notranslate lg:col-span-4 space-y-6 lg:sticky lg:top-[170px] lg:h-[calc(100vh-170px)] lg:overflow-y-auto no-visible-scrollbar pb-6">
            {/* Share + Actions */}
            <section className="article-share-card rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="article-share-card__title mb-3">शेयर करें</h3>
              <div className="grid grid-cols-4 gap-2.5">
                <button onClick={handleCopy} title={copied ? "कॉपी हुआ!" : "लिंक कॉपी"} className="article-share-icon">
                  {copied ? <Check className="h-5 w-5 text-green-500" /> : <LinkIcon className="h-5 w-5" />}
                </button>
                <button onClick={handleWhatsapp} title="WhatsApp" className="article-share-icon hover:!text-[#25D366] hover:!border-[#25D366]">
                  <WhatsappIcon />
                </button>
                <button onClick={handleFacebook} title="Facebook" className="article-share-icon hover:!text-[#1877F2] hover:!border-[#1877F2]">
                  <FacebookIcon/>
                </button>
                <button onClick={handlePrint} title="प्रिंट" className="article-share-icon">
                  <Printer className="h-5 w-5" />
                </button>
              </div>
              {(canEdit || canDelete) && (
                <div className="mt-3 flex flex-col gap-2">
                  {canEdit && (
                    <button onClick={() => setIsEditing(true)} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${theme === "dark" ? "border-blue-700 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                      <Edit3 className="h-4 w-4" /> संपादित करें
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirmDelete(true)} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${theme === "dark" ? "border-red-700 bg-red-900/30 text-red-400 hover:bg-red-900/50" : "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"}`}>
                      <Trash2 className="h-4 w-4" /> हटाएं
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Top reads */}
            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)] mb-3">सबसे ज्यादा पढ़ी गईं</h3>
              <div className="space-y-3">
                {sidebarTopReads.map((s, i) => (
                  <Link key={s.id} href={`/post/${s.id}`} className="rise-on-hover flex gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
                    <span className="text-xl font-bold text-[var(--primary)]">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] line-clamp-2">{s.title}</p>
                      <p className="text-xs text-[var(--muted)]">{s.clickCount ?? 0} क्लिक</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Ad Placeholder - Sidebar */}
            <div className="article-no-print notranslate flex h-[250px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]">
              <span className="text-sm font-semibold uppercase tracking-wide">विज्ञापन</span>
            </div>

            {/* Resources */}
            {resources.length > 0 && (
              <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <h3 className="font-serif text-xl font-bold text-[var(--headline)]">संसाधन</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {resources.map(r => (
                    <div key={r.id} className="rise-on-hover rounded-md border border-[var(--line)] p-3">
                      <p className="font-semibold text-[var(--headline)]">{r.title} {r.type === "pdf" ? "(PDF)" : "(Link)"}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Calendar */}
            <section id="abhiyan-calendar" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">अभियान कैलेंडर</h3>
              <div className="mt-3 space-y-2 text-sm">
                {filteredEvents.length === 0 ? (
                  <p className="text-[var(--muted)]">कोई आगामी ईवेंट नहीं</p>
                ) : filteredEvents.map(ev => {
                  const isToday = ev.date === todayStr;
                  return (
                    <div 
                      key={ev.id} 
                      onClick={() => setActiveEvent(ev)}
                      className={`rise-on-hover rounded-md border p-3 cursor-pointer ${isToday ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]' : 'border-l-4 border-[var(--line)] border-l-[var(--primary)] bg-[var(--surface)]'}`}
                    >
                      {isToday && <span className="mb-2 inline-block rounded bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">आज का कार्यक्रम</span>}
                      <p className="font-semibold text-[var(--headline)]">{ev.title}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{ev.date ? `${formatDateWithDay(ev.date)} • ${ev.time}` : "तय होना बाकी"}{ev.location ? ` | ${ev.location}` : ""}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Newsletter CTA */}
            <section className="rounded-xl p-5" style={{ background: "var(--crimson)", border: "2px solid var(--gold)" }}>
              <h3 className="font-serif text-xl font-bold text-white">जुड़े रहने के लिए</h3>
              <p className="mt-2 text-sm text-white/85">रोज़ शाम 7 बजे प्रमुख खबरें सीधे आपके ईमेल पर।</p>
              <Link
                href="/#newsletter"
                className="mt-4 block w-full rounded-md px-4 py-2 text-center text-sm font-semibold text-[var(--gold)] transition-colors hover:bg-black/30"
                style={{ background: "var(--ink)", border: "1px solid var(--gold)" }}
              >
                सदस्यता लें
              </Link>
            </section>
          </aside>
        </main>

        {/* Related posts (full width) */}
        {displayedSuggested.length > 0 && (
          <section className="article-no-print notranslate pb-8 pt-2">
            <SectionHeader title="और पढ़ें" href="/" linkText="सभी देखें →" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedSuggested.slice(0, 3).map(sp => (
                <Link key={sp.id} href={`/post/${sp.id}`} className="rise-on-hover card-lift group flex flex-col overflow-hidden border border-[var(--line)] bg-[var(--surface)]">
                  {resolvePostImage(sp.postImage, sp.content) && (
                    <div className="card-image-container">
                      <img src={resolvePostImage(sp.postImage, sp.content)!} alt="" style={{ objectPosition: focusToObjectPosition(sp.imageFocus) }} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-4">
                    <span className={`cat-pill self-start ${getCategoryClass(sp.category)}`}>{sp.category}</span>
                    <h4 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-[var(--headline)] group-hover:text-[var(--primary)]">{sp.title}</h4>
                    <div className="line-clamp-2 text-sm leading-6 text-[var(--muted)] excerpt-html" dangerouslySetInnerHTML={{ __html: cleanHtml(sp.excerpt) }} />
                    <p className="mt-1 text-xs text-[var(--muted)]">{sp.author} • {sp.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="article-no-print notranslate site-footer" style={{ background: "var(--ink)", borderTop: "3px solid var(--crimson)", padding: "48px 24px 24px", marginLeft: -16, marginRight: -16 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="footer-grid" style={{ marginBottom: 40 }}>
              <div>
                <div className={`site-footer__brand ${theme === "dark" ? "text-[var(--muted)] hover:text-white" : "text-gray-700 hover:text-[var(--primary)]"}`} style={{ fontFamily: "'Noto Serif Devanagari', serif", fontSize: 42, fontWeight: 700, marginBottom: 12 }}>वाम की आवाज़</div>
                <p style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, lineHeight: 1.75, color: "var(--text-secondary)", marginBottom: 16 }}>
                  जन संघर्षों की कहानियाँ, संदर्भ और आवाज़। हम पत्रकार नहीं, पहरेदार हैं—न्याय और समता के।
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <a href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer" className={theme === "dark" ? "text-[var(--text-secondary)] hover:text-white" : "text-black hover:text-[var(--primary)]"} aria-label="Facebook">
                    <FacebookIcon className="h-5.5 w-5.5" />
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
                  { label: "ब्लॉग", value: "blogs" },
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
                {["2026 के लेख", "विशेष रिपोर्ट", "पॉडकास्ट"].map((link) => (
                  <div key={link} style={{ marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>{link}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>© 2026 वाम की आवाज़ — जन संघर्ष का डिजिटल पुरालेख</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "var(--text-muted)" }}>Made for the Movement</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sticky share bar */}
      <div
        className="mobile-share-bar article-no-print notranslate"
        style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--surface-mid)", borderTop: "1px solid var(--divider)", zIndex: 100, padding: "5px 14px calc(5px + env(safe-area-inset-bottom))" }}
      >
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", width: "100%" }}>
          <button onClick={handleWhatsapp} aria-label="WhatsApp" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "#25D366", color: "#fff" }}>
              <span style={{ display: "flex", transform: "scale(1.1)" }}><WhatsappIcon /></span>
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--text-secondary)" }}>WhatsApp</span>
          </button>
          <button onClick={handleFacebook} aria-label="Facebook" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "#1877F2", color: "#fff" }}>
              <span style={{ display: "flex", transform: "scale(0.82)" }}><FacebookIcon /></span>
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--text-secondary)" }}>Facebook</span>
          </button>
          <button onClick={handleCopy} aria-label="Copy" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: theme === "dark" ? "var(--surface-high)" : "#ece7dd", color: copied ? "#25D366" : "var(--text-primary)", border: "1px solid var(--divider)" }}>
              {copied ? <Check className="h-[17px] w-[17px]" /> : <Copy className="h-[17px] w-[17px]" />}
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--text-secondary)" }}>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button onClick={handlePrint} aria-label="Print" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: theme === "dark" ? "var(--surface-high)" : "#ece7dd", color: "var(--text-primary)", border: "1px solid var(--divider)" }}>
              <Printer className="h-[17px] w-[17px]" />
            </span>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "var(--text-secondary)" }}>Print</span>
          </button>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[var(--headline)] mb-2">लेख हटाएं?</h3>
            <p className="text-sm text-[var(--muted)] mb-5">क्या आप वाकई इस लेख को स्थायी रूप से हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {deleting ? "हटा रहे हैं..." : "हां, हटाएं"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:border-[var(--primary)]">
                रद्द करें
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
                  const link = `${window.location.origin}/#abhiyan-calendar`;
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
                  const link = `${window.location.origin}/#abhiyan-calendar`;
                  const text = `${activeEvent.title}\n📅 ${formatDateWithDay(activeEvent.date)} ${activeEvent.time}\n📍 ${activeEvent.location}\n\n${activeEvent.details}\n\nवाम की आवाज़ - अभियान कैलेंडर\n${link}`;
                  if (navigator.share) {
                    navigator.share({ title: activeEvent.title, text, url: link }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(text);
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

      <ArticleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        sessionEmail={sessionEmail}
        roleText={roleText}
        onLoginSuccess={(email) => setSessionEmail(email)}
        onLogout={() => setSessionEmail("")}
      />
    </div>
  );
}
