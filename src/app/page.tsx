"use client";

import { type CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LogIn, LogOut, Menu, ShieldCheck, X, Share2, Printer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";
import { RichTextEditor } from "@/components/RichTextEditor";

type NewsPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  postImage?: string | null;
  authorImage?: string | null;
  time: string;
  createdAt?: string;
  clickCount?: number;
  uploaderName?: string | null;
  source?: "static" | "blog";
};

type ApiBlogPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  postImage: string | null;
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
  password: string;
  active: boolean;
  permissions: Permissions;
  authorName: string;
  authorImage: string | null;
};

const MASTER_EMAIL = "lordbuddha.mailing@gmail.com";
const MASTER_PASSWORD = "@Keshava95";
const MASTER_AUTHOR_NAME = "केशव कुमार भट्टर";
const USERS_STORAGE_KEY = "vaamki-aawaz-users";
const SESSION_STORAGE_KEY = "vaamki-aawaz-session";
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

const allPermissionsEnabled = (): Permissions => ({
  manageHomepage: true,
  publishBlog: true,
  manageCategories: true,
  manageNewsletter: true,
  manageUsers: true,
});

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
  return {
    authorName: rawName,
    authorImage: rawImage || null,
  };
};

const mapApiUserToAccount = (user: ApiAuthUser): UserAccount => {
  const permissionsObject = (user.permissions ?? null) as Record<string, unknown> | null;
  const authorProfile = parseAuthorProfileFromPermissions(permissionsObject);
  return {
    id: user.id,
    role: user.role === "MASTER_ADMIN" ? "master" : user.role === "ADMIN" ? "admin" : "contributor",
    email: user.email,
    password: "",
    active: user.active ?? true,
    permissions: parsePermissionFlags(permissionsObject),
    authorName: authorProfile.authorName,
    authorImage: authorProfile.authorImage,
  };
};

const permissionLabels: { key: PermissionKey; label: string }[] = [
  { key: "manageHomepage", label: "होमपेज नियंत्रण" },
  { key: "publishBlog", label: "ब्लॉग प्रकाशित करना" },
  { key: "manageCategories", label: "कैटेगरी नियंत्रण" },
  { key: "manageNewsletter", label: "न्यूज़लेटर नियंत्रण" },
  { key: "manageUsers", label: "यूज़र मैनेजमेंट" },
];

const seedUsers = (): UserAccount[] => [
  {
    id: "master-admin",
    role: "master",
    email: MASTER_EMAIL,
    password: MASTER_PASSWORD,
    active: true,
    permissions: allPermissionsEnabled(),
    authorName: "",
    authorImage: null,
  },
];

const featuredPosts: NewsPost[] = [
  {
    id: "ts2",
    category: "राष्ट्रीय",
    title: "संसद में श्रम कानून बहस तेज, ट्रेड यूनियनों ने संयुक्त विरोध कार्यक्रम घोषित किया",
    excerpt:
      "कई राज्यों की यूनियन इकाइयों ने मजदूर सुरक्षा, न्यूनतम वेतन और सामाजिक सुरक्षा पर संयुक्त कार्यक्रम की रूपरेखा जारी की।",
    author: "संपादकीय डेस्क",
    time: "अभी",
  },
  {
    id: "ts3",
    category: "जनसंघर्ष",
    title: "किसान-मजदूर संयुक्त मोर्चा: MSP, मंडी और ग्रामीण रोज़गार पर साझा संघर्ष",
    excerpt:
      "ग्राम स्तर पर पदयात्राओं, जनसभाओं और नीति वैकल्पिक दस्तावेज़ को लेकर राष्ट्रीय समन्वय अभियान शुरू।",
    author: "राज्य संवाददाता",
    time: "2 घंटे पहले",
  },
  {
    id: "ts4",
    category: "छात्र-युवा",
    title: "विश्वविद्यालय फीस वृद्धि के विरोध में छात्र संगठनों का साझा मंच",
    excerpt:
      "छात्र प्रतिनिधियों ने शिक्षा के अधिकार और सार्वजनिक विश्वविद्यालयों की स्वायत्तता बचाने पर संयुक्त घोषणापत्र जारी किया।",
    author: "कैम्पस ब्यूरो",
    time: "3 घंटे पहले",
  },
];

const allNewsPosts: NewsPost[] = [
  {
    id: "ln1",
    category: "राज्य",
    title: "केरल में स्थानीय निकायों ने सार्वजनिक स्वास्थ्य केंद्रों के लिए अतिरिक्त बजट पास किया",
    excerpt: "सामुदायिक स्वास्थ्य मॉडल को जिला स्तर तक विस्तार देने का निर्णय।",
    author: "दक्षिण डेस्क",
    time: "1 घंटा पहले",
  },
  {
    id: "ln2",
    category: "अर्थव्यवस्था",
    title: "रोज़गार और महँगाई पर जनसुनवाई: विशेषज्ञों ने सार्वजनिक निवेश बढ़ाने पर ज़ोर दिया",
    excerpt: "रेल, शिक्षा और स्वास्थ्य क्षेत्रों में राज्य निवेश को प्राथमिकता देने की सलाह।",
    author: "नीति विश्लेषण टीम",
    time: "2 घंटे पहले",
  },
  {
    id: "ln3",
    category: "आधी आबादी",
    title: "महिला श्रमिकों की सुरक्षा और समान वेतन पर राष्ट्रीय सम्मेलन में 18 प्रस्ताव पारित",
    excerpt: "अनौपचारिक क्षेत्र की महिलाओं के लिए सामाजिक सुरक्षा कोष की मांग प्रमुख रही।",
    author: "महिला डेस्क",
    time: "4 घंटे पहले",
  },
  {
    id: "ln4",
    category: "शिक्षा",
    title: "सरकारी स्कूलों में डिजिटल विभाजन कम करने हेतु ग्राम पंचायतों की पहल",
    excerpt: "स्थानीय स्तर पर पुस्तकालय और इंटरनेट केंद्रों के लिए सामूहिक निधि प्रस्तावित।",
    author: "शिक्षा संवाद",
    time: "5 घंटे पहले",
  },
  {
    id: "ln5",
    category: "राष्ट्रीय",
    title: "सार्वजनिक स्वास्थ्य बजट पर विपक्षी दलों ने संयुक्त संशोधन प्रस्ताव पेश किया",
    excerpt: "जिला अस्पतालों में स्टाफ की कमी और दवा उपलब्धता को लेकर संसद में विस्तृत बहस।",
    author: "संसद डेस्क",
    time: "6 घंटे पहले",
  },
  {
    id: "ln6",
    category: "जनसंघर्ष",
    title: "खदान क्षेत्र में विस्थापन के खिलाफ आदिवासी संगठनों का राज्यव्यापी प्रदर्शन",
    excerpt: "भूमि अधिकार, मुआवजा और पुनर्वास नीति पर पारदर्शी सामाजिक लेखा-जोखा की मांग।",
    author: "मैदानी रिपोर्ट टीम",
    time: "7 घंटे पहले",
  },
  {
    id: "ln7",
    category: "अर्थव्यवस्था",
    title: "MSME सेक्टर में सार्वजनिक क्रेडिट गारंटी बढ़ाने की मांग तेज",
    excerpt: "रोज़गार सृजन और उत्पादन श्रृंखला स्थिरता के लिए छोटे उद्योगों को विशेष पैकेज का सुझाव।",
    author: "आर्थिक ब्यूरो",
    time: "8 घंटे पहले",
  },
  {
    id: "ln8",
    category: "आधी आबादी",
    title: "कार्यस्थल पर लैंगिक सुरक्षा कानून के क्रियान्वयन पर राष्ट्रीय ऑडिट रिपोर्ट जारी",
    excerpt: "अनौपचारिक क्षेत्र में शिकायत निवारण तंत्र कमजोर होने की बात प्रमुख रूप से सामने आई।",
    author: "महिला डेस्क",
    time: "9 घंटे पहले",
  },
  {
    id: "ln9",
    category: "छात्र-युवा",
    title: "युवा रोजगार अधिकार मार्च में हजारों छात्रों की भागीदारी",
    excerpt: "सार्वजनिक भर्तियों के लंबित पदों पर समयबद्ध नियुक्ति कैलेंडर जारी करने की मांग।",
    author: "युवा संवाद",
    time: "10 घंटे पहले",
  },
  {
    id: "ln10",
    category: "राज्य",
    title: "पंचायत स्तर पर पोषण केंद्रों के विस्तार का प्रस्ताव सर्वसम्मति से पारित",
    excerpt: "गर्भवती महिलाओं और बच्चों के लिए पूरक आहार वितरण तंत्र को मजबूत करने पर सहमति।",
    author: "ग्रामीण डेस्क",
    time: "11 घंटे पहले",
  },
  {
    id: "ln11",
    category: "राष्ट्रीय",
    title: "लोकतांत्रिक संस्थाओं की स्वायत्तता पर नागरिक समाज का राष्ट्रीय सम्मेलन",
    excerpt: "न्यायिक पारदर्शिता, मीडिया स्वतंत्रता और संघीय ढांचे पर संयुक्त प्रस्ताव जारी किए गए।",
    author: "विशेष संवाद",
    time: "12 घंटे पहले",
  },
  {
    id: "ln12",
    category: "अर्थव्यवस्था",
    title: "महँगाई राहत के लिए आवश्यक वस्तु आपूर्ति श्रृंखला पर राज्यों की बैठक",
    excerpt: "थोक-खुदरा मूल्य अंतर कम करने और सार्वजनिक वितरण को मजबूत करने की रूपरेखा तैयार।",
    author: "नीति रिपोर्ट",
    time: "13 घंटे पहले",
  },
];

const opinionPieces = [
  "लोकतंत्र की सेहत और विपक्ष की भूमिका",
  "सार्वजनिक शिक्षा बनाम निजीकरण की राजनीति",
  "शहरी गरीबों के आवास संकट पर नीति पुनर्विचार",
  "जलवायु न्याय और श्रमिक वर्ग का भविष्य",
];

const initialBlogs: NewsPost[] = [
  {
    id: "bl1",
    category: "ब्लॉग",
    title: "सड़क से सदन तक: जन आंदोलनों की नई रणनीति",
    excerpt:
      "ग्रामीण और शहरी संघर्षों को एक साझा राजनीतिक फ्रेम में जोड़ने की चुनौती पर विस्तृत चर्चा।",
    content:
      "जन आंदोलनों की नई रणनीति केवल विरोध तक सीमित नहीं रह सकती। स्थानीय मुद्दों से शुरू होकर उन्हें नीति-स्तर की बहस तक ले जाना जरूरी है। इसी कारण सड़क से सदन तक का पुल बनाना आज लोकतांत्रिक राजनीति की सबसे बड़ी आवश्यकता बन गया है।\n\nइस रणनीति का पहला आयाम संगठनात्मक है, जहां मजदूर, किसान, छात्र और महिला संगठनों को साझा न्यूनतम कार्यक्रम के आधार पर साथ लाया जाता है। दूसरा आयाम वैचारिक है, जिसमें जनहित के सवालों को सरल भाषा में जनता के बीच ले जाकर व्यापक राजनीतिक समझ तैयार की जाती है। तीसरा आयाम संसदीय हस्तक्षेप है, जहां जमीनी मांगों को प्रश्न, विधेयक संशोधन और नीति-पत्र के माध्यम से संस्थागत स्वर दिया जाता है।\n\nयह मॉडल तभी सफल होगा जब आंदोलन और जनप्रतिनिधित्व के बीच भरोसेमंद संवाद कायम रहे। इसके लिए नियमित जनसुनवाई, तथ्याधारित रिपोर्टिंग और अभियान-आधारित राजनीतिक शिक्षा की जरूरत है।",
    author: "अतिथि लेखक",
    time: "आज",
    clickCount: 0,
    source: "blog",
  },
  {
    id: "bl2",
    category: "विश्लेषण",
    title: "2026 की अर्थनीति: जनकल्याणकारी विकल्प और राजनीतिक इच्छाशक्ति",
    excerpt:
      "राजकोषीय नीति, सार्वजनिक वितरण और रोजगार गारंटी कार्यक्रमों की संभावनाओं का तुलनात्मक अध्ययन।",
    content:
      "2026 की अर्थनीति पर बहस में सबसे महत्वपूर्ण प्रश्न यह है कि विकास का लाभ किसे मिल रहा है। यदि बजटीय प्राथमिकताएं सार्वजनिक शिक्षा, स्वास्थ्य और रोजगार पर केंद्रित नहीं होंगी, तो असमानता और सामाजिक असुरक्षा दोनों बढ़ेंगी।\n\nजनकल्याणकारी विकल्पों में सार्वजनिक निवेश की पुनर्बहाली, ग्रामीण-शहरी रोजगार गारंटी का विस्तार, और आवश्यक वस्तुओं की मूल्य-स्थिरता के लिए वितरण तंत्र को मजबूत करना शामिल है। इसके साथ ही MSME क्षेत्र के लिए सस्ती क्रेडिट गारंटी, सहकारी उत्पादन मॉडल और स्थानीय बाजारों के संरक्षण की नीतियां जरूरी हैं।\n\nराजनीतिक इच्छाशक्ति का अर्थ केवल घोषणाएं नहीं, बल्कि संसाधनों की वास्तविक पुनर्संरचना है। जब नीति निर्माण में श्रमिक, किसान, महिला और युवा समूहों की भागीदारी बढ़ती है, तब अर्थनीति अधिक न्यायपूर्ण और टिकाऊ दिशा में आगे बढ़ती है।",
    author: "विचार मंच",
    time: "कल",
    clickCount: 0,
    source: "blog",
  },
];

const formatDate = () =>
  new Date().toLocaleDateString("hi-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

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
    <g transform="scale(1.4) translate(0 -5)">
      <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.5c0-.8.2-1.4 1.4-1.4h1.4V5.6c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.7v2h-2.3V14H11v7h2.5z" />
    </g>
  </svg>
);

const WhatsappIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
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

// const TwitterIcon = () => (
//   <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
//     <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.3L6.5 22H3.4l7.3-8.3L1 2h6.2l4.3 5.7L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
//   </svg>
// );

const TwitterIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <g transform="scale(0.9) translate(0 -1)">
      <path d="M18.9 2H22l-6.8 7.7L23 22h-6.1l-4.8-6.3L6.5 22H3.4l7.3-8.3L1 2h6.2l4.3 5.7L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z" />
    </g>
  </svg>
);

export default function Home() {
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
  const [nowMs, setNowMs] = useState(Date.now());
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [managedCategories, setManagedCategories] = useState<string[]>([...DEFAULT_CATEGORIES]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

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
  };
  const [events, setEvents] = useState<AbhiyanEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<AbhiyanEvent | null>(null);
  const [newEventForm, setNewEventForm] = useState({ title: '', date: '', time: '', location: '', details: '' });

  const [blogMessage, setBlogMessage] = useState("");
  const [blogSyncMessage, setBlogSyncMessage] = useState("");
  const [postClicks, setPostClicks] = useState<Record<string, number>>({});
  const [activePost, setActivePost] = useState<NewsPost | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    author: "",
    category: "ब्लॉग",
    customCategory: "",
    excerpt: "",
    content: "",
    postImage: "",
    authorImage: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    
    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.events) {
          setEvents(data.events);
        }
      } catch {}
    };
    loadEvents();
    
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
    const savedManagedCategories = localStorage.getItem(MANAGED_CATEGORIES_STORAGE_KEY);
    if (savedManagedCategories) {
      const parsed = JSON.parse(savedManagedCategories) as unknown;
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => normalizeCategoryLabel(item));
        setManagedCategories(Array.from(new Set([...DEFAULT_CATEGORIES, ...sanitized])));
      }
    }
    const savedHiddenCategories = localStorage.getItem(HIDDEN_CATEGORIES_STORAGE_KEY);
    if (savedHiddenCategories) {
      const parsed = JSON.parse(savedHiddenCategories) as unknown;
      if (Array.isArray(parsed)) {
        setHiddenCategories(
          parsed
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => normalizeCategoryLabel(item)),
        );
      }
    }
  }, []);

  useEffect(() => {
    void fetchAuthors();
  }, []);

  useEffect(() => {
    if (!formState.author && availableAuthors.length > 0) {
      setFormState((prev) => ({
        ...prev,
        author: availableAuthors[0].name,
        authorImage: availableAuthors[0].image ?? "",
      }));
      return;
    }
    if (formState.author) {
      const matchedAuthor = availableAuthors.find(
        (author) => normalizeAuthorName(author.name) === normalizeAuthorName(formState.author),
      );
      if (matchedAuthor && formState.authorImage !== (matchedAuthor.image ?? "")) {
        setFormState((prev) => ({ ...prev, authorImage: matchedAuthor.image ?? "" }));
      }
    }
  }, [availableAuthors, formState.author, formState.authorImage]);

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
    const update = () => {
      const isScrolled = window.scrollY > 12;
      const compact = isScrolled ? "1" : "0";
      stickyHeaderRef.current?.style.setProperty("--compact-progress", compact);
      setIsScrolledHeader((prev) => (prev === isScrolled ? prev : isScrolled));
    };
    const onScroll = () => {
      update();
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 5_000);
    return () => window.clearInterval(timer);
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
        const data = (await response.json()) as { posts: ApiBlogPost[] };
        if (Array.isArray(data.posts)) {
          setBlogs(data.posts.map(mapApiBlogToNewsPost));
          setBlogSyncMessage("");
        }
      } catch (error) {
        setBlogs(initialBlogs);
        const message =
          error instanceof Error && error.message
            ? `सर्वर से लाइव पोस्ट लोड नहीं हो सकीं (${error.message}). इस डिवाइस पर फिलहाल डिफॉल्ट पोस्ट दिखाई जा रही हैं।`
            : "सर्वर से लाइव पोस्ट लोड नहीं हो सकीं। इस डिवाइस पर फिलहाल डिफॉल्ट पोस्ट दिखाई जा रही हैं।";
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
    const source = [...blogs, ...featuredPosts, ...allNewsPosts];
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
  const feedPosts = useMemo(() => filteredNews.slice(3), [filteredNews]);
  const visibleFeedPosts = useMemo(
    () => feedPosts.slice(0, newsVisibleCount),
    [feedPosts, newsVisibleCount],
  );

  const topReadPosts = useMemo(() => {
    return [...featuredPosts, ...allNewsPosts, ...blogs]
      .sort((a, b) => {
        const clicksA = a.source === "blog" ? (a.clickCount ?? 0) : (postClicks[a.id] ?? 0);
        const clicksB = b.source === "blog" ? (b.clickCount ?? 0) : (postClicks[b.id] ?? 0);
        return clicksB - clicksA;
      })
      .slice(0, 4);
  }, [blogs, postClicks]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    [...featuredPosts, ...allNewsPosts, ...blogs].forEach((post) => {
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

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageUsers) return;
    if (!newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      setAdminMessage("नए एडमिन के लिए ईमेल और पासवर्ड आवश्यक है।");
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

  const handleAddContributor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageUsers) return;
    if (!newContributorForm.email.trim() || !newContributorForm.password.trim()) {
      setAdminMessage("योगदानकर्ता के लिए ईमेल और पासवर्ड आवश्यक है।");
      return;
    }
    if (!newContributorForm.authorName.trim() || !newContributorForm.authorImage.trim()) {
      setAdminMessage("योगदानकर्ता के लिए लेखक नाम और फोटो आवश्यक है।");
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
    if (!canManageUsers) {
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

  const handleAddEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMaster) return;
    try {
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEventForm)
      });
      if (res.ok) {
        const loadRes = await fetch("/api/events");
        const data = await loadRes.json();
        if (data.events) setEvents(data.events);
        setNewEventForm({ title: '', date: '', time: '', location: '', details: '' });
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

  const handleSaveMasterAuthorProfile = async (event: FormEvent<HTMLFormElement>) => {
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
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, authorImage }),
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

  const handleAddCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageCategories) {
      return;
    }
    const name = newCategoryName.trim();
    if (!name) {
      setAdminMessage("कैटेगरी नाम आवश्यक है।");
      return;
    }
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
  };

  const handleRemoveCategory = (category: string) => {
    if (!canManageCategories) {
      return;
    }
    if (normalizeCategoryName(category) === normalizeCategoryName("ब्लॉग")) {
      setAdminMessage("ब्लॉग कैटेगरी हटाई नहीं जा सकती।");
      return;
    }
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
  };

  const executeNewsletterSubscription = () => {
    setNewsletterMessage("धन्यवाद! आप सफलतापूर्वक न्यूज़लेटर से जुड़ गए हैं।");
    setNewsletterEmail("");
    setNewsletterName("");
    setNewsletterPhone("");
  };

  const handleNewsletter = async (event: FormEvent<HTMLFormElement>) => {
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

  const handleBlogSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
    try {
      const targetCategory = formState.customCategory.trim() || formState.category;
      const submittedTitle = formState.title.trim();
      const submittedExcerpt = formState.excerpt.trim();
      const submittedContent = formState.content.trim();
      const submittedAuthor = formState.author.trim();
      const submittedPostImage = formState.postImage.trim();
      const submittedAuthorImage = selectedAuthorProfile.image?.trim() ?? "";
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
          authorImage: submittedAuthorImage || undefined,
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
      setFormState({
        title: "",
        author: availableAuthors[0]?.name ?? "",
        category: "ब्लॉग",
        customCategory: "",
        excerpt: "",
        content: "",
        postImage: "",
        authorImage: availableAuthors[0]?.image ?? "",
      });
      setBlogMessage("नई पोस्ट सफलतापूर्वक जोड़ दी गई।");
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "पोस्ट सेव नहीं हो सकी। कृपया दोबारा प्रयास करें।";
      setBlogMessage(message);
    }
  };

  const handleDeleteArticle = async (post: NewsPost) => {
    if (!canRemoveArticle) {
      setBlogMessage("इस पोस्ट को हटाने की अनुमति नहीं है।");
      return;
    }
    if (post.source !== "blog") {
      setBlogMessage("केवल प्रकाशित ब्लॉग पोस्ट हटाई जा सकती हैं।");
      return;
    }
    try {
      const response = await fetch(`/api/blogs/${post.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setBlogMessage(data.error || "पोस्ट हटाई नहीं जा सकी।");
        return;
      }
      setBlogs((prev) => prev.filter((item) => item.id !== post.id));
      setActivePost((prev) => (prev?.id === post.id ? null : prev));
      setBlogMessage("पोस्ट हटा दी गई।");
    } catch {
      setBlogMessage("पोस्ट हटाई नहीं जा सकी।");
    }
  };

  const navTabs = [
    { title: "होम", value: "home" },
    { title: "ताज़ा खबरें", value: "latest" },
    { title: "ब्लॉग", value: "blogs" },
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
      setFormState((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setBlogMessage("कृपया वैध image file चुनें।");
      return;
    }
    try {
      const encoded = await readImageAsDataUrl(file);
      setFormState((prev) => ({ ...prev, [key]: encoded }));
    } catch {
      setBlogMessage("फोटो अपलोड नहीं हो सकी।");
    }
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
      const encoded = await readImageAsDataUrl(file);
      if (target === "admin") {
        setNewAdminForm((prev) => ({ ...prev, authorImage: encoded }));
      } else if (target === "contributor") {
        setNewContributorForm((prev) => ({ ...prev, authorImage: encoded }));
      } else {
        setMasterAuthorForm((prev) => ({ ...prev, authorImage: encoded }));
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
      return;
    }
    if (value === "admin") {
      setIsCategoryMenuOpen(false);
      setIsAuthModalOpen(true);
      return;
    }
    setIsCategoryMenuOpen(false);
    if (value === "home") {
      // scrollToSection("top");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrollToSection(value);
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

  const getFullArticle = (post: NewsPost) =>
    post.content?.trim() ||
    `${post.excerpt}\n\nइस विषय पर विस्तृत रिपोर्ट के लिए संपादकीय टीम द्वारा तथ्यात्मक पृष्ठभूमि, जमीनी प्रतिक्रियाएं और नीति-संदर्भ एकत्र किए जा रहे हैं।`;

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
    const diffMs = nowMs - parsed;
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

  const handlePostOpen = (post: NewsPost) => {
    if (post.source === "blog") {
      setBlogs((prev) =>
        prev.map((item) => (item.id === post.id ? { ...item, clickCount: (item.clickCount ?? 0) + 1 } : item)),
      );
      const optimistic = { ...post, clickCount: (post.clickCount ?? 0) + 1 };
      setActivePost(optimistic);
      void fetch(`/api/blogs/${post.id}/click`, { method: "POST" })
        .then((res) => res.json() as Promise<{ id: string; clickCount: number }>)
        .then((data) => {
          setBlogs((prev) => prev.map((item) => (item.id === data.id ? { ...item, clickCount: data.clickCount } : item)));
          setActivePost((prev) => (prev?.id === data.id ? { ...prev, clickCount: data.clickCount } : prev));
        })
        .catch(() => undefined);
      return;
    }
    setActivePost(post);
    setPostClicks((prev) => ({ ...prev, [post.id]: (prev[post.id] ?? 0) + 1 }));
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleShareAction = (platform: "whatsapp" | "facebook" | "copy") => {
    if (!activePost) return;
    const url = `${window.location.origin}/?post=${activePost.id}`;
    const text = `${activePost.title}\n\n`;

    if (platform === "copy") {
      void navigator.clipboard.writeText(url).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } else if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("post");
    if (!postId) return;

    const allAvailablePosts = [...featuredPosts, ...allNewsPosts, ...blogs];
    const match = allAvailablePosts.find((p) => p.id === postId);
    
    if (match) {
      handlePostOpen(match);
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blogs]);

  return (
    <>
    <div className={`print:hidden ${theme === "dark" ? "theme-dark" : ""} news-shell min-h-screen text-[var(--foreground)]`}>
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] py-2 text-xs text-[var(--muted)] sm:text-sm">
          <span className="shrink-0 whitespace-nowrap">{formatDate()}</span>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <FacebookIcon className="h-4 w-4" />
            </a>

            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer">
              <YoutubeIcon className="h-4 w-4" />
            </a>

            <button type="button" className="interactive-link hidden rounded-md px-2 py-1 text-xs hover:cursor-pointer sm:inline-flex">
              सदस्यता
            </button>
            <a href="mailto:vaamkiaawaz@gmail.com" className="interactive-link hidden px-2 py-1 text-xs md:inline-flex md:text-sm">
              संपर्क: vaamkiaawaz@gmail.com
            </a>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            >
              <LogIn className="h-3.5 w-3.5" />
              {currentUser ? `${roleText}` : "लॉगिन"}
            </button>
          </div>
        </div>

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
                    className="break-words font-serif font-bold leading-tight text-[var(--headline)]"
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
              <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 pr-1 sm:pr-0 lg:w-auto lg:flex-none lg:justify-end">
                <div className="hidden md:block">
                  <GooeyInput
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    placeholder="खबरें खोजें..."
                    className="w-auto shrink"
                    collapsedWidth={92}
                    expandedWidth={170}
                    expandedOffset={40}
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

        <section className="my-4 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-2">
            <span className="rounded bg-[var(--primary)] px-2 py-1 text-xs font-semibold tracking-wide text-white">
              ब्रेकिंग
            </span>
            <div className="overflow-hidden">
              <div className="ticker-move flex min-w-max gap-10 text-sm text-[var(--muted)]">
                {filteredNews.slice(0, 8).map((story, i) => (
                  <span 
                    key={`ticker-${story.id}-${i}`} 
                    onClick={() => handlePostOpen(story)} 
                    className="cursor-pointer hover:text-[var(--primary)] hover:underline"
                  >
                    {story.title}
                  </span>
                ))}
                {filteredNews.slice(0, 8).map((story, i) => (
                  <span 
                    key={`ticker-dup-${story.id}-${i}`} 
                    onClick={() => handlePostOpen(story)} 
                    className="cursor-pointer hover:text-[var(--primary)] hover:underline"
                  >
                    {story.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <main className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-8">
            {featuredForDisplay[0] && (
              <button
                type="button"
                onClick={() => handlePostOpen(featuredForDisplay[0])}
                className="card-fade rise-on-hover w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 text-left"
              >
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                  {featuredForDisplay[0].category}
                </p>
                <h2 className="line-clamp-3 font-serif text-2xl font-bold leading-tight text-[var(--headline)] sm:text-4xl">
                  {featuredForDisplay[0].title}
                </h2>
                <p className="mt-3 line-clamp-3 text-base leading-7 text-[var(--muted)]">{featuredForDisplay[0].excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] sm:gap-4">
                  <span>{featuredForDisplay[0].author}</span>
                  <span>•</span>
                  <span>{getPostTimeLabel(featuredForDisplay[0])}</span>
                  <span>•</span>
                  <span>{getPostClicks(featuredForDisplay[0])} क्लिक</span>
                </div>
                <span className="mt-4 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
              </button>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredForDisplay.slice(1).map((story) => (
                <button
                  type="button"
                  key={story.id}
                  onClick={() => handlePostOpen(story)}
                  className="card-fade rise-on-hover rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 text-left"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                    {story.category}
                  </p>
                  <h3 className="line-clamp-2 mt-2 font-serif text-xl font-semibold leading-snug text-[var(--headline)]">
                    {story.title}
                  </h3>
                  <p className="line-clamp-3 mt-2 text-sm leading-6 text-[var(--muted)]">{story.excerpt}</p>
                  <p className="mt-4 text-xs text-[var(--muted)]">
                    {story.author} • {getPostTimeLabel(story)} • {getPostClicks(story)} क्लिक
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
                </button>
              ))}
            </div>

            <section id="latest" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                      {story.category}
                    </p>
                    <h4 className="line-clamp-2 mt-2 text-lg font-semibold leading-snug text-[var(--headline)]">{story.title}</h4>
                    <p className="line-clamp-3 mt-2 text-sm text-[var(--muted)]">{story.excerpt}</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      {story.author} • {getPostTimeLabel(story)} • {getPostClicks(story)} क्लिक
                    </p>
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

            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="mb-4 font-serif text-2xl font-bold text-[var(--headline)]">विचार</h3>
              <div className="grid gap-3">
                {opinionPieces.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="rise-on-hover interactive-link rounded-md border border-[var(--line)] px-4 py-3 text-base font-medium text-[var(--foreground)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
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

            <section id="newsletter" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
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
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
                />
                <button className="rise-on-hover w-full rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                  सदस्य बनें
                </button>
              </form>
              {newsletterMessage && <p className="mt-3 text-sm text-[var(--primary)]">{newsletterMessage}</p>}
            </section>

            <section className="rounded-xl border border-[var(--line)] bg-white dark:bg-[var(--surface-soft)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">अभियान कैलेंडर</h3>
              <div className="mt-3 space-y-3 text-sm">
                {events.length === 0 ? (
                  <p className="text-[var(--muted)]">कोई आगामी ईवेंट नहीं</p>
                ) : (
                  events.map(ev => (
                    <div onClick={() => setActiveEvent(ev)} key={ev.id} className="cursor-pointer rise-on-hover rounded-md border border-l-4 border-[var(--line)] border-l-[var(--primary)] bg-[var(--surface)] p-3">
                      <p className="font-semibold text-[var(--headline)]">{ev.title}</p>
                      <p className="text-[var(--muted)] text-xs mt-0.5">{ev.date} • {ev.time}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </main>

        <section id="blogs" className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">समाचार</h3>
            <div className="flex items-center gap-3">
              {selectedAuthor && (
                <button
                  type="button"
                  onClick={() => setSelectedAuthor("")}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                >
                  लेखक फ़िल्टर हटाएं
                </button>
              )}
              <button type="button" className="interactive-link text-sm font-semibold text-[var(--primary)]">
                ब्लॉग आर्काइव
              </button>
            </div>
          </div>
          {blogSyncMessage && (
            <p className="mb-4 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
              {blogSyncMessage}
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleBlogs.map((post) => (
              <article 
                key={post.id} 
                onClick={() => handlePostOpen(post)}
                className="rise-on-hover cursor-pointer rounded-lg border border-[var(--line)] p-4 text-left transition-all"
              >
                {post.postImage && (
                  <img src={post.postImage} alt={post.title} className="mb-3 h-40 w-full rounded-md object-cover" />
                )}
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{post.category}</p>
                <h4 className="line-clamp-2 mt-2 text-xl font-semibold text-[var(--headline)]">{post.title}</h4>
                <p className="line-clamp-3 mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                  <div className="inline-flex items-center gap-2">
                    {post.authorImage && (
                      <img src={post.authorImage} alt={post.author} className="h-5 w-5 rounded-full object-cover" />
                    )}
                    <Link
                      href={`/author/${encodeURIComponent(post.author)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="interactive-link font-semibold text-[var(--primary)]"
                    >
                      {post.author}
                    </Link>
                  </div>
                  <span>•</span>
                  <span>{getPostTimeLabel(post)}</span>
                  <span>•</span>
                  <span>{getPostClicks(post)} क्लिक</span>
                </div>
                <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">
                  पूरा लेख पढ़ें →
                </span>
              </article>
            ))}
          </div>
          {visibleBlogs.length < filteredBlogs.length && (
            <button
              onClick={() => setBlogVisibleCount((prev) => prev + 12)}
              className="rise-on-hover mt-5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
            >
              More Posts
            </button>
          )}
        </section>

        <section className="my-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">नई खबर जोड़ें</h3>
          {!canPublishBlog && (
            <p className="mt-2 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--muted)]">
              ब्लॉग पोस्ट जोड़ने के लिए एडमिन या एडमिन द्वारा अधिकृत योगदानकर्ता लॉगिन करें।
            </p>
          )}
          {canPublishBlog && (
            <form onSubmit={handleBlogSubmit} className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="हेडलाइन / शीर्षक"
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              />
              <select
                value={formState.author}
                onChange={(event) => handleAuthorSelectionChange(event.target.value)}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              >
                <option value="">लेखक चुनें</option>
                {availableAuthors.map((author) => (
                  <option key={author.name} value={author.name}>
                    {author.name}
                  </option>
                ))}
              </select>
              <select
                value={formState.category}
                onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              >
                {allCategories
                  .filter((category) => category !== "सभी")
                  .map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
              </select>
              <input
                value={formState.customCategory}
                onChange={(event) => setFormState((prev) => ({ ...prev, customCategory: event.target.value }))}
                placeholder="नई कैटेगरी (optional)"
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              />
              <label className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] md:col-span-2">
                पोस्ट फोटो
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageInputChange(event, "postImage")}
                  className="w-full text-xs"
                />
              </label>
              {(formState.postImage || formState.authorImage) && (
                <div className="md:col-span-2 flex gap-3">
                  {formState.postImage && (
                    <img src={formState.postImage} alt="Post preview" className="h-16 w-24 rounded-md object-cover" />
                  )}
                  {formState.authorImage && (
                    <img src={formState.authorImage} alt="Author preview" className="h-16 w-16 rounded-full object-cover" />
                  )}
                </div>
              )}
              <textarea
                value={formState.excerpt}
                onChange={(event) => setFormState((prev) => ({ ...prev, excerpt: event.target.value }))}
                placeholder="संक्षिप्त सारांश / एब्स्ट्रैक्ट"
                className="min-h-24 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] md:col-span-2"
              />
              <RichTextEditor
                value={formState.content}
                onChange={(content) => setFormState((prev) => ({ ...prev, content }))}
                placeholder="पूरी विस्तृत खबर / लेख"
                className="md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end">
                <button className="rise-on-hover rounded-md bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                  ब्लॉग प्रकाशित करें
                </button>
              </div>
            </form>
          )}
          {blogMessage && <p className="mt-3 text-sm font-medium text-[var(--primary)]">{blogMessage}</p>}
        </section>

        {activePost && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              {canRemoveArticle && activePost.source === "blog" && (
                <button
                  type="button"
                  onClick={() => void handleDeleteArticle(activePost)}
                  className="absolute right-20 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--primary)] hover:border-[var(--primary)]"
                >
                  Remove
                </button>
              )}
              <button
                type="button"
                onClick={() => setActivePost(null)}
                className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Close
              </button>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{activePost.category}</p>
              <h2 className="pr-14 font-serif text-2xl font-bold leading-tight text-[var(--headline)] sm:text-3xl">
                {activePost.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <div className="inline-flex items-center gap-2">
                  {activePost.authorImage && (
                    <img src={activePost.authorImage} alt={activePost.author} className="h-6 w-6 rounded-full object-cover" />
                  )}
                  <Link
                    href={`/author/${encodeURIComponent(activePost.author)}`}
                    onClick={() => setActivePost(null)}
                    className="interactive-link font-semibold text-[var(--primary)]"
                  >
                    {activePost.author}
                  </Link>
                </div>
                <span>•</span>
                <span>{getPostTimeLabel(activePost)}</span>
                <span>•</span>
                <span>{getPostClicks(activePost)} क्लिक</span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-[var(--line)] py-3">
                <span className="text-sm font-semibold text-[var(--muted)]">शेयर करें:</span>
                <button
                  type="button"
                  onClick={() => handleShareAction("copy")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] hover: cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {isCopied ? "कॉपी किया गया" : "लिंक कॉपी करें"}
                </button>
                <button
                  type="button"
                  onClick={() => handleShareAction("whatsapp")}
                  className="inline-flex items-center justify-center rounded-md border border-[#25D366] bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#25D366] shadow-sm transition hover:bg-[#25D366] hover:text-white hover: cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <WhatsappIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareAction("facebook")}
                  className="inline-flex items-center justify-center rounded-md border border-[#1877F2] bg-[#1877F2]/10 px-3 py-1.5 text-xs font-semibold text-[#1877F2] shadow-sm transition hover:bg-[#1877F2] hover:text-white hover: cursor-pointer"
                  title="Share on Facebook"
                >
                  <FacebookIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] hover:cursor-pointer"
                  title="Print to PDF"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </button>
              </div>
              {activePost.postImage && (
                <img src={activePost.postImage} alt={activePost.title} className="mt-4 max-h-[320px] w-full rounded-lg object-cover" />
              )}
              <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)] quill-article-content">
                {(getFullArticle(activePost).includes("<p>") || getFullArticle(activePost).includes("<h")) ? (
                  <div dangerouslySetInnerHTML={{ __html: getFullArticle(activePost) }} />
                ) : (
                  getFullArticle(activePost).split("\n\n").map((paragraph, index) => (
                    <p key={`${activePost.id}-${index}`}>{paragraph}</p>
                  ))
                )}
              </div>
              {activePost.uploaderName && (
                <div className="mt-8 border-t border-[var(--line)] pt-4 text-right">
                  <span className="text-xs text-[var(--muted)]">अप्लोडकर्ता: <span className="font-semibold text-[var(--foreground)]">{activePost.uploaderName}</span></span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeEvent && (
          <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
              <button
                type="button"
                onClick={() => setActiveEvent(null)}
                className="absolute right-4 top-4 rounded-full border border-[var(--line)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-white"
              >
                Close
              </button>
              <h3 className="pr-14 font-serif text-2xl font-bold text-[var(--headline)]">{activeEvent.title}</h3>
              <div className="mt-4 flex flex-col gap-2 border-b border-[var(--line)] pb-4 text-sm font-semibold text-[var(--muted)]">
                <span className="flex items-center gap-1"><span className="text-[var(--primary)]">📅</span> {activeEvent.date} {activeEvent.time}</span>
                <span className="flex items-center gap-1"><span className="text-[var(--primary)]">📍</span> {activeEvent.location}</span>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
                {activeEvent.details}
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
                        Email Address
                      </label>
                      <input
                        id="auth-email"
                        type="email"
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
                        <h4 className="text-lg font-semibold text-[var(--headline)]">अभियान कैलेंडर नियंत्रण</h4>
                        <form onSubmit={handleAddEvent} className="mt-4 space-y-3">
                          <input required value={newEventForm.title} onChange={e => setNewEventForm({...newEventForm, title: e.target.value})} placeholder="इवेंट का नाम (Title)" className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <div className="grid grid-cols-2 gap-3">
                            <input required type="date" value={newEventForm.date} onChange={e => setNewEventForm({...newEventForm, date: e.target.value})} className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                            <input required type="time" value={newEventForm.time} onChange={e => setNewEventForm({...newEventForm, time: e.target.value})} className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          </div>
                          <input required value={newEventForm.location} onChange={e => setNewEventForm({...newEventForm, location: e.target.value})} placeholder="स्थान (Location)" className="w-full rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <textarea required value={newEventForm.details} onChange={e => setNewEventForm({...newEventForm, details: e.target.value})} placeholder="पूरी जानकारी" className="w-full h-20 resize-none rounded border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]" />
                          <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                            + नया इवेंट जोड़ें
                          </button>
                        </form>
                        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                          {events.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between rounded border border-[var(--line)] p-2">
                              <div>
                                <p className="text-sm font-semibold">{ev.title}</p>
                                <p className="text-xs text-[var(--muted)]">{ev.date} | {ev.time}</p>
                              </div>
                              <button onClick={() => handleRemoveEvent(ev.id)} className="text-xs text-red-500 hover:underline">हटाएं</button>
                            </div>
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
                      <p className="mt-1 text-xs text-[var(--muted)]">मास्टर: {MASTER_EMAIL}</p>
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
                          type="email"
                          value={newAdminForm.email}
                          onChange={(event) => setNewAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="नया एडमिन ईमेल"
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
                              <button
                                onClick={() => void handleToggleContributor(contributor.id)}
                                className="rise-on-hover rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              >
                                {contributor.active ? "Disable" : "Enable"}
                              </button>
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
                          type="email"
                          value={newContributorForm.email}
                          onChange={(event) => setNewContributorForm((prev) => ({ ...prev, email: event.target.value }))}
                          placeholder="योगदानकर्ता ईमेल"
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
                      आपका योगदानकर्ता एक्सेस सक्रिय है। आप ब्लॉग सेक्शन से पोस्ट प्रकाशित कर सकते हैं।
                    </p>
                  )}
                  {adminMessage && <p className="text-sm text-[var(--primary)]">{adminMessage}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="border-t border-[var(--line)] py-8 text-sm text-[var(--muted)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 वाम की आवाज़ • जन समाचार मंच</p>
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" className="interactive-link">
                संपादकीय नीति
              </button>
              <button type="button" className="interactive-link">
                गोपनीयता
              </button>
              <button type="button" className="interactive-link">
                विज्ञापन
              </button>
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

    {activePost && (
      <div className="hidden print:block text-black font-serif w-full min-h-screen" style={{ backgroundColor: '#f7f6f2', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <table className="w-full border-collapse">
          <thead className="table-header-group">
            <tr><td className="h-[20mm] p-0 border-none"></td></tr>
          </thead>
          <tfoot className="table-footer-group">
            <tr><td className="h-[20mm] p-0 border-none"></td></tr>
          </tfoot>
          <tbody>
            <tr>
              <td className="p-0 border-none">
                <div className="px-12 pb-8 max-w-[210mm] mx-auto">
                  <header className="mb-8 w-full border-b-[6px] border-[var(--primary)] pb-6 text-center">
                    <a href="https://vaamkiaawaz.in" className="block w-full bg-black pt-1">
                      <img src="/fbpage.png" alt="वाम की आवाज़ - Vaam ki Aawaz" className="mx-auto w-full max-h-[160px] object-cover object-center rounded-t-sm" />
                    </a>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <h2 className="text-4xl font-extrabold leading-snug text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                        {activePost.title}
                      </h2>
                      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-700 italic font-medium bg-[#f3efea] px-6 py-2 rounded-full border border-gray-300 shadow-sm mt-2" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <span className="font-bold text-gray-900">{activePost.author}</span>
                        {activePost.uploaderName && <span className="text-gray-500">| {activePost.uploaderName}</span>}
                      </div>
                    </div>
                  </header>
                {activePost.postImage && (
                  <img src={activePost.postImage} alt={activePost.title} className="w-full max-h-[400px] object-cover rounded-md mb-6" />
                )}
                <div className="text-base leading-relaxed quill-article-content">
                  {(getFullArticle(activePost).includes("<p>") || getFullArticle(activePost).includes("<h")) ? (
                    <div dangerouslySetInnerHTML={{ __html: getFullArticle(activePost) }} />
                  ) : (
                    getFullArticle(activePost).split("\n\n").map((paragraph, index) => (
                      <p key={`print-${activePost.id}-${index}`} className="mb-4">{paragraph}</p>
                    ))
                  )}
                </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}
    </>
  );
}
