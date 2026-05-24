"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Share2, Printer, ArrowLeft, Clock, Eye, ChevronRight, Copy, Check, Trash2, Edit3, X, LogIn, Menu, Languages } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";
import { AnimatePresence, motion } from "motion/react";
import { useRef, type CSSProperties } from "react";
import "react-quill-new/dist/quill.snow.css";
import { SanitizedHtml } from "@/utils/sanitizeHtml";
import { TiptapEditor } from "@/components/TiptapEditor";
import AuthorProfileBox from "@/components/AuthorProfileBox";

type Post = {
  id: string; category: string; title: string; excerpt: string; content: string;
  author: string; postImage?: string | null; authorImage?: string | null;
  clickCount?: number; uploaderName?: string | null; authorUserId?: string | null;
  createdAt: string; time: string; source: "blog";
};
type SidebarPost = Post;
type Evt = { id: string; title: string; date: string; time: string; location: string; details: string };
type Res = { id: string; title: string; type: string; url: string | null; createdAt: string };

const cleanHtml = (html: string | undefined | null) => {
  if (!html) return "";
  // Strip zero-width chars and replace non-breaking spaces with normal spaces
  return html
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ");
};

const THEME_KEY = "vaamki-aawaz-theme";
const readingTime = (html: string) => {
  if (!html) return 1;
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("hi-IN", { day: "2-digit", month: "long", year: "numeric" });

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
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5.5 w-5.5" fill="currentColor"><g transform="translate(0 -1.5)"><path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z"/></g></svg>
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: post.title, excerpt: post.excerpt, content: post.content });
  const [saving, setSaving] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  
  const [displayedSuggested, setDisplayedSuggested] = useState<Post[]>(suggestedPosts);
  const [allFetchedPosts, setAllFetchedPosts] = useState<Post[] | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
    const update = () => {
      const scrollY = window.scrollY;
      const isScrolled = scrollY > 12;
      setIsScrolledHeader((prev) => (prev === isScrolled ? prev : isScrolled));
      const compact = isScrolled ? "1" : "0";
      if (stickyHeaderRef.current) {
        stickyHeaderRef.current.style.setProperty("--compact-progress", compact);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
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
          }
        }
      }).catch(() => {});
  }, []);

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

  const isMaster = userRole === "MASTER_ADMIN";
  const isAuthor = userAuthorName && userAuthorName === post.author.trim().toLowerCase();
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
    <div className={`${theme === "dark" ? "theme-dark" : ""} news-shell min-h-screen text-[var(--foreground)]`}>
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* ─── Top bar ─── */}
        <div className="article-no-print flex items-center justify-between gap-2 border-b border-[var(--line)] py-2 text-xs text-[var(--muted)] sm:text-sm">
          <span className="shrink-0 whitespace-nowrap">
            {new Date().toLocaleDateString("hi-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              weekday: "long",
            })}
          </span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <FacebookIcon />
            </a>
            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer">
              <YoutubeIcon />
            </a>
            <button type="button" className="interactive-link hidden rounded-md px-2 py-1 text-xs hover:cursor-pointer sm:inline-flex">
              सदस्यता
            </button>
            <a href="mailto:vaamkiaawaz@gmail.com" className="interactive-link hidden px-2 py-1 text-xs md:inline-flex md:text-sm">
              संपर्क: vaamkiaawaz@gmail.com
            </a>
            <div className="relative flex items-center shrink-0 ml-1 sm:ml-2">
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
                className={`absolute right-0 top-full mt-2 bg-white border border-[var(--line)] p-1 rounded-md shadow-lg z-50 ${showTranslate ? 'block' : 'hidden'}`}
              ></div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1 shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-none">{sessionEmail ? roleText || "लॉगिन है" : "लॉगिन"}</span>
            </button>
          </div>
        </div>

        {/* ─── Header & Nav (Sticky) ─── */}
        <div
          ref={stickyHeaderRef}
          className={`sticky top-0 z-50 ${isScrolledHeader ? (theme === "dark" ? "bg-[var(--surface)]" : "bg-white") : "bg-transparent"}`}
          style={{ "--compact-progress": 0 } as CSSProperties}
        >
          <header
            id="top"
            className="headline-fade border-b border-[var(--line)]"
            style={{
              paddingTop: "calc(28px - 16px * var(--compact-progress))",
              paddingBottom: "calc(28px - 16px * var(--compact-progress))",
            }}
          >
            <div className="flex flex-col gap-2 px-1 sm:gap-4 sm:px-2 lg:flex-row lg:items-center lg:justify-between lg:px-0">
              <div className="flex items-start gap-3 sm:items-center sm:gap-5">
                <img
                  src="/vaamki-logo.png"
                  alt="वाम की आवाज़ लोगो"
                  onError={(event) => {
                    event.currentTarget.src = "/vercel.svg";
                  }}
                  className="shrink-0 rounded-lg border border-[var(--line)] object-contain bg-white"
                  style={{
                    width: "calc(120px - 40px * var(--compact-progress))",
                    height: "calc(120px - 40px * var(--compact-progress))",
                  }}
                />
                <div className="space-y-2 min-w-0">
                  <p
                    className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 font-semibold text-[var(--primary)] hover:cursor-pointer"
                    style={{
                      fontSize: "calc(0.75rem - 0.1rem * var(--compact-progress))",
                      paddingTop: "calc(4px - 2px * var(--compact-progress))",
                      paddingBottom: "calc(4px - 2px * var(--compact-progress))",
                    }}
                  >
                    विकल्प की डिजिटल दुनिया
                  </p>
                  <h1
                    className="font-serif font-bold leading-tight text-[var(--headline)]"
                    style={{
                      fontSize: "calc(2rem - 0.65rem * var(--compact-progress))",
                    }}
                  >
                    वाम की आवाज़ (Vaam ki Aawaz)
                  </h1>
                  <p
                    className="hidden text-[var(--muted)] sm:block whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      opacity: "calc(1 - var(--compact-progress))",
                      fontSize: "calc(0.85rem - 0.13rem * var(--compact-progress))",
                    }}
                  >
                    अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ, न्याय, समानता और प्रगति में हैं विश्वास तो — उठो ! बोलो ! बदलो !
                  </p>
                </div>
              </div>
              <a href="https://www.youtube.com/@VaamKiAawaz" className="mt-1 w-full px-1 sm:mt-0 sm:w-auto sm:px-0">
                <button
                  className="rise-on-hover w-full sm:w-fit rounded-md border border-[var(--primary)] bg-[var(--primary)] font-semibold text-white hover:cursor-pointer hover:bg-[var(--primary-dark)]"
                  style={{
                    paddingLeft: "calc(20px - 4px * var(--compact-progress))",
                    paddingRight: "calc(20px - 4px * var(--compact-progress))",
                    paddingTop: "calc(8px - 2px * var(--compact-progress))",
                    paddingBottom: "calc(8px - 2px * var(--compact-progress))",
                    fontSize: "calc(0.875rem - 0.1rem * var(--compact-progress))",
                  }}
                >
                  लाइव कवरेज
                </button>
              </a>
            </div>
          </header>

          <nav
            className="mx-1 rounded-lg border border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md sm:mx-0"
            style={{
              marginTop: "calc(16px - 8px * var(--compact-progress))",
              marginBottom: "calc(16px - 8px * var(--compact-progress))",
              padding: "calc(12px - 4px * var(--compact-progress))",
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
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#2B2B2B]",

                      bubbleSurface: theme === "dark"
                        ? "bg-[#7D0F13] border-[#5E0B0E] text-white"
                        : "bg-[#E8DDD8] border-[#D6C7C0] text-[#2B2B2B]"
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
        <nav className="article-no-print flex items-center gap-1.5 py-3 text-xs text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--primary)]">होम</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/?tab=fresh`} className="hover:text-[var(--primary)]">ताज़ा खबरें</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--primary)] font-semibold">{post.category}</span>
        </nav>

        {/* ─── Main layout ─── */}
        <main className="grid gap-8 pb-4 lg:grid-cols-12">

          {/* Article column */}
          <article className="lg:col-span-8 min-w-0 h-fit space-y-4 rounded-xl bg-white p-5 sm:p-8 border border-[var(--line)]" style={{ background: theme === 'dark' ? 'var(--surface)' : '#ffffff' }}>

            {isEditing ? (
              <div className="space-y-4 mb-8 bg-[var(--surface-soft)] p-6 rounded-xl border border-[var(--primary)]">
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
                <div className="hidden print-only border-b-2 border-black pb-4 mb-6 text-center">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <h1 className="font-serif text-4xl font-bold text-black uppercase tracking-wide">वाम की आवाज़</h1>
                    <p className="text-xs font-semibold tracking-widest text-gray-600 uppercase">जन समाचार मंच</p>
                  </div>
                </div>

                {/* Category + Title */}
                <div>
                  <span className="inline-block rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--primary)]">
                    {post.category}
                  </span>
                  <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-[var(--headline)] sm:text-4xl lg:text-[2.6rem]">
                    {post.title}
                  </h1>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)] border-b border-[var(--line)] pb-4">
                  {post.authorImage && (
                    <img src={post.authorImage} alt="" className="h-9 w-9 rounded-full border border-[var(--line)] object-cover" />
                  )}
                  <Link href={`/author/${encodeURIComponent(post.author)}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--primary)] hover:underline">
                    {post.author}
                  </Link>
                  <span>•</span>
                  <span>{fmtDate(post.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mins} मिनट पठन</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.clickCount ?? 0} बार पढ़ा गया</span>
                </div>

                {/* Abstract box */}
                <div className="rounded-xl border-l-4 border-[var(--primary)] bg-[var(--surface-soft)] p-5">
                  <p className="text-sm font-semibold text-[var(--primary)] mb-1">सारांश</p>
                  <div className="text-base leading-7 text-[var(--foreground)] italic ql-editor px-0 py-0" dangerouslySetInnerHTML={{ __html: cleanHtml(post.excerpt) }} />
                </div>

                {/* Hero image - only show if not already embedded in content */}
                {heroImg && !post.content?.includes(heroImg) && (
                  <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                    <img src={heroImg} alt={post.title} className="article-hero-img w-full object-cover" style={{ maxHeight: 480 }} />
                  </div>
                )}

                {/* Article content */}
                <SanitizedHtml
                  html={post.content}
                  className="article-body ql-editor prose max-w-none text-[var(--foreground)] [&>*:last-child]:mb-0 pb-0"
                  style={{ padding: 0, maxWidth: '100%', overflowX: 'clip', whiteSpace: 'pre-wrap' }}
                  debug={true}
                />

                {/* Uploader credit - Web view only */}
                {displayUploaderName && (
                  <p className="article-no-print text-sm text-[var(--muted)] italic border-t border-[var(--line)] pt-3 mt-4">
                    अपलोडर: {displayUploaderName}
                  </p>
                )}

                {/* Print Only Footer */}
                <div className="hidden print-only mt-10 pt-6 border-t-2 border-black text-center break-inside-avoid">
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


            {/* Share + Actions bar */}
            <div className="article-no-print flex flex-wrap items-center gap-3 border-y border-[var(--line)] py-3 mt-1">
              <button onClick={handleCopy} className="article-share-btn inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)]">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "कॉपी हुआ!" : "लिंक कॉपी"}
              </button>
              <button onClick={handleWhatsapp} className="article-share-btn inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white">
                <WhatsappIcon /> WhatsApp
              </button>
              <button onClick={handleFacebook} className="article-share-btn inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-medium text-white">
                <FacebookIcon /> Facebook
              </button>
              <button onClick={handlePrint} className="article-share-btn inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:border-[var(--primary)] hover:text-[var(--primary)]">
                <Printer className="h-4 w-4" /> प्रिंट
              </button>
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="article-share-btn inline-flex items-center gap-2 rounded-lg border border-blue-400 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
                  <Edit3 className="h-4 w-4" /> संपादित करें
                </button>
              )}
              {canDelete && (
                <button onClick={() => setConfirmDelete(true)} className="article-share-btn inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
                  <Trash2 className="h-4 w-4" /> हटाएं
                </button>
              )}
            </div>

            {/* Ad Placeholder - Bottom of article */}
            <div className="article-no-print my-6 flex h-[250px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]">
              <span className="text-sm font-semibold uppercase tracking-wide">विज्ञापन</span>
            </div>

            {/* Suggested posts */}
            {displayedSuggested.length > 0 && (
              <section className="mt-4">
                <h3 className="font-serif text-2xl font-bold text-[var(--headline)] mb-4">और पढ़ें</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayedSuggested.slice(0, 4).map(sp => (
                    <Link key={sp.id} href={`/post/${sp.id}`} className="rise-on-hover group rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 block">
                      {sp.postImage && <img src={sp.postImage} alt="" className="mb-3 h-36 w-full rounded-lg object-cover" />}
                      <p className="text-xs font-semibold uppercase text-[var(--primary)]">{sp.category}</p>
                      <h4 className="mt-1 line-clamp-2 font-serif text-lg font-semibold text-[var(--headline)] group-hover:text-[var(--primary)]">{sp.title}</h4>
                      <div className="mt-1 line-clamp-2 text-sm text-[var(--muted)] excerpt-html" dangerouslySetInnerHTML={{ __html: cleanHtml(sp.excerpt) }} />
                      <p className="mt-2 text-xs text-[var(--muted)]">{sp.author} • {sp.time}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="article-no-print lg:col-span-4 space-y-6">
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
            <div className="article-no-print flex h-[250px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted)]">
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
            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">अभियान कैलेंडर</h3>
              <div className="mt-3 space-y-2 text-sm">
                {events.length === 0 ? (
                  <p className="text-[var(--muted)]">कोई आगामी ईवेंट नहीं</p>
                ) : events.map(ev => (
                  <div key={ev.id} className="rise-on-hover rounded-md border border-l-4 border-[var(--line)] border-l-[var(--primary)] p-3">
                    <p className="font-semibold text-[var(--headline)]">{ev.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{ev.date ? `${ev.date} • ${ev.time}` : "तय होना बाकी"}{ev.location ? ` | ${ev.location}` : ""}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Newsletter CTA */}
            <section className="rounded-xl border border-[var(--line)] bg-gradient-to-br from-[var(--primary)]/10 to-transparent p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">न्यूज़लेटर</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">रोज़ शाम 7 बजे प्रमुख खबरें सीधे आपके ईमेल पर।</p>
              <Link href="/#newsletter" className="mt-3 inline-block rise-on-hover rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                सदस्य बनें
              </Link>
            </section>
          </aside>
        </main>

        {/* Footer */}
        <footer className="article-no-print border-t border-[var(--line)] py-4 mt-2 text-sm text-[var(--muted)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 वाम की आवाज़ • जन समाचार मंच</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/editorial-policy" className="interactive-link hover:text-[var(--primary)] transition-colors">संपादकीय नीति</Link>
              <Link href="/corrections-policy" className="interactive-link hover:text-[var(--primary)] transition-colors">सुधार नीति</Link>
              <Link href="/privacy-policy" className="interactive-link hover:text-[var(--primary)] transition-colors">गोपनीयता नीति</Link>
              <Link href="/about-us" className="interactive-link hover:text-[var(--primary)] transition-colors">हमारे बारे में</Link>
              <Link href="/contact-us" className="interactive-link hover:text-[var(--primary)] transition-colors">संपर्क करें</Link>
            </div>
          </div>
        </footer>
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
    </div>
  );
}
