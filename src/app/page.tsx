"use client";

import { type CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { GooeyInput } from "@/components/ui/gooey-input";

type NewsPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  time: string;
  clickCount?: number;
  source?: "static" | "blog";
};

type ApiBlogPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  clickCount: number;
  createdAt: string;
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
};

const MASTER_EMAIL = "lordbuddha.mailing@gmail.com";
const MASTER_PASSWORD = "@Keshava95";
const USERS_STORAGE_KEY = "vaamki-aawaz-users";
const SESSION_STORAGE_KEY = "vaamki-aawaz-session";
const THEME_STORAGE_KEY = "vaamki-aawaz-theme";
const POST_CLICKS_STORAGE_KEY = "vaamki-aawaz-post-clicks";

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
    category: "महिला मुद्दे",
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
    category: "महिला मुद्दे",
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
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (minutes < 60) {
    return `${minutes} मिनट पहले`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} घंटे पहले`;
  }
  const days = Math.floor(hours / 24);
  return `${days} दिन पहले`;
};

const mapApiBlogToNewsPost = (post: ApiBlogPost): NewsPost => ({
  id: post.id,
  category: post.category,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  author: post.author,
  time: formatRelativeTime(post.createdAt),
  clickCount: post.clickCount,
  source: "blog",
});

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
  const [selectedCategory, setSelectedCategory] = useState("सभी");
  const [selectedNewsDate, setSelectedNewsDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [newsVisibleCount, setNewsVisibleCount] = useState(6);
  const [blogVisibleCount, setBlogVisibleCount] = useState(4);
  const [blogs, setBlogs] = useState<NewsPost[]>(initialBlogs);
  const [users, setUsers] = useState<UserAccount[]>(seedUsers());
  const [sessionEmail, setSessionEmail] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginMessage, setLoginMessage] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [newAdminForm, setNewAdminForm] = useState({
    email: "",
    password: "",
    permissions: noPermissions(),
  });
  const [newContributorForm, setNewContributorForm] = useState({
    email: "",
    password: "",
  });
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");
  const [blogMessage, setBlogMessage] = useState("");
  const [postClicks, setPostClicks] = useState<Record<string, number>>({});
  const [activePost, setActivePost] = useState<NewsPost | null>(null);
  const stickyHeaderRef = useRef<HTMLDivElement | null>(null);
  const [formState, setFormState] = useState({
    title: "",
    author: "",
    category: "ब्लॉग",
    customCategory: "",
    excerpt: "",
    content: "",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers) as UserAccount[];
      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
        const hasMaster = parsedUsers.some((user) => user.role === "master" && user.email === MASTER_EMAIL);
        setUsers(hasMaster ? parsedUsers : [...seedUsers(), ...parsedUsers]);
      }
    } else {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(seedUsers()));
    }
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      setSessionEmail(savedSession);
    }
    const savedPostClicks = localStorage.getItem(POST_CLICKS_STORAGE_KEY);
    if (savedPostClicks) {
      const parsedClicks = JSON.parse(savedPostClicks) as Record<string, number>;
      if (parsedClicks && typeof parsedClicks === "object") {
        setPostClicks(parsedClicks);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (sessionEmail) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionEmail);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [sessionEmail]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(POST_CLICKS_STORAGE_KEY, JSON.stringify(postClicks));
  }, [postClicks]);

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
    const loadBlogs = async () => {
      try {
        const response = await fetch("/api/blogs", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch blogs");
        }
        const data = (await response.json()) as { posts: ApiBlogPost[] };
        if (Array.isArray(data.posts) && data.posts.length > 0) {
          setBlogs(data.posts.map(mapApiBlogToNewsPost));
        }
      } catch {
        setBlogs(initialBlogs);
      }
    };
    void loadBlogs();
  }, []);

  const currentUser = useMemo(
    () => users.find((user) => user.email.toLowerCase() === sessionEmail.toLowerCase()),
    [sessionEmail, users],
  );

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

  const canManageContributors = useMemo(() => {
    if (!currentUser) {
      return false;
    }
    if (currentUser.role === "master") {
      return true;
    }
    return currentUser.role === "admin" && currentUser.permissions.manageUsers;
  }, [currentUser]);

  const isMaster = currentUser?.role === "master";

  const filteredNews = useMemo(() => {
    const q = normalizeForSearch(searchTerm);
    const qLatin = transliterate(q);
    const qRoman = normalizeRomanized(qLatin);
    const qSkeleton = stripLatinVowels(qRoman);
    const source = [...featuredPosts, ...allNewsPosts];
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
    const dateFiltered = selectedNewsDate
      ? categoryFiltered.filter((post) => inferDateKeyFromTime(post.time) === selectedNewsDate)
      : categoryFiltered;
    return [...dateFiltered].sort((a, b) => (postClicks[b.id] ?? 0) - (postClicks[a.id] ?? 0));
  }, [searchTerm, selectedCategory, postClicks, selectedNewsDate]);

  const featuredForDisplay = useMemo(() => filteredNews.slice(0, 3), [filteredNews]);
  const feedPosts = useMemo(() => filteredNews.slice(3), [filteredNews]);
  const visibleFeedPosts = useMemo(
    () => feedPosts.slice(0, newsVisibleCount),
    [feedPosts, newsVisibleCount],
  );
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    [...featuredPosts, ...allNewsPosts, ...blogs].forEach((post) => {
      set.add(post.category);
    });
    return ["सभी", ...Array.from(set)];
  }, [blogs]);
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
    return [...categoryFiltered].sort((a, b) => (b.clickCount ?? 0) - (a.clickCount ?? 0));
  }, [blogs, searchTerm, selectedCategory]);
  const visibleBlogs = useMemo(() => filteredBlogs.slice(0, blogVisibleCount), [filteredBlogs, blogVisibleCount]);
  const adminAccounts = useMemo(() => users.filter((user) => user.role === "admin"), [users]);
  const contributorAccounts = useMemo(() => users.filter((user) => user.role === "contributor"), [users]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const matchedUser = users.find(
      (user) =>
        user.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
        user.password === loginForm.password.trim(),
    );
    if (!matchedUser) {
      setLoginMessage("गलत ईमेल या पासवर्ड।");
      return;
    }
    if (!matchedUser.active) {
      setLoginMessage("यह खाता निष्क्रिय है।");
      return;
    }
    setSessionEmail(matchedUser.email);
    setLoginMessage(`स्वागत है ${matchedUser.email}`);
    setLoginForm({ email: "", password: "" });
  };

  const handleLogout = () => {
    setSessionEmail("");
    setLoginMessage("सफलतापूर्वक लॉगआउट किया गया।");
  };

  const handleAddAdmin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isMaster) {
      return;
    }
    if (!newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      setAdminMessage("नए एडमिन के लिए ईमेल और पासवर्ड आवश्यक है।");
      return;
    }
    const alreadyExists = users.some((user) => user.email.toLowerCase() === newAdminForm.email.trim().toLowerCase());
    if (alreadyExists) {
      setAdminMessage("यह ईमेल पहले से मौजूद है।");
      return;
    }
    const freshAdmin: UserAccount = {
      id: `admin-${Date.now()}`,
      role: "admin",
      email: newAdminForm.email.trim(),
      password: newAdminForm.password.trim(),
      active: true,
      permissions: newAdminForm.permissions,
    };
    setUsers((prev) => [...prev, freshAdmin]);
    setAdminMessage("नया एडमिन जोड़ा गया।");
    setNewAdminForm({ email: "", password: "", permissions: noPermissions() });
  };

  const handleRemoveAdmin = (adminId: string) => {
    if (!isMaster) {
      return;
    }
    setUsers((prev) => prev.filter((user) => user.id !== adminId));
  };

  const handleAdminPermissionToggle = (adminId: string, key: PermissionKey) => {
    if (!isMaster) {
      return;
    }
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== adminId || user.role !== "admin") {
          return user;
        }
        return {
          ...user,
          permissions: {
            ...user.permissions,
            [key]: !user.permissions[key],
          },
        };
      }),
    );
  };

  const handleAddContributor = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageContributors) {
      return;
    }
    if (!newContributorForm.email.trim() || !newContributorForm.password.trim()) {
      setAdminMessage("योगदानकर्ता के लिए ईमेल और पासवर्ड आवश्यक है।");
      return;
    }
    const alreadyExists = users.some(
      (user) => user.email.toLowerCase() === newContributorForm.email.trim().toLowerCase(),
    );
    if (alreadyExists) {
      setAdminMessage("यह ईमेल पहले से मौजूद है।");
      return;
    }
    const contributor: UserAccount = {
      id: `contributor-${Date.now()}`,
      role: "contributor",
      email: newContributorForm.email.trim(),
      password: newContributorForm.password.trim(),
      active: true,
      permissions: noPermissions(),
    };
    setUsers((prev) => [...prev, contributor]);
    setAdminMessage("अधिकृत योगदानकर्ता जोड़ा गया।");
    setNewContributorForm({ email: "", password: "" });
  };

  const handleToggleContributor = (contributorId: string) => {
    if (!canManageContributors) {
      return;
    }
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== contributorId || user.role !== "contributor") {
          return user;
        }
        return { ...user, active: !user.active };
      }),
    );
  };

  const handleRemoveContributor = (contributorId: string) => {
    if (!canManageContributors) {
      return;
    }
    setUsers((prev) => prev.filter((user) => user.id !== contributorId));
  };

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterMessage("कृपया वैध ईमेल दर्ज करें।");
      return;
    }
    setNewsletterMessage("धन्यवाद! आप सफलतापूर्वक न्यूज़लेटर से जुड़ गए हैं।");
    setNewsletterEmail("");
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
    try {
      const response = await fetch("/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: formState.customCategory.trim() || formState.category,
          title: formState.title,
          excerpt: formState.excerpt,
          content: formState.content,
          author: formState.author,
        }),
      });
      if (!response.ok) {
        throw new Error("Unable to publish");
      }
      const data = (await response.json()) as { post: ApiBlogPost };
      setBlogs((prev) => [mapApiBlogToNewsPost(data.post), ...prev]);
      setFormState({ title: "", author: "", category: "ब्लॉग", customCategory: "", excerpt: "", content: "" });
      setBlogMessage("नई पोस्ट सफलतापूर्वक जोड़ दी गई।");
    } catch {
      setBlogMessage("पोस्ट सेव नहीं हो सकी। कृपया दोबारा प्रयास करें।");
    }
  };

  const navTabs = [
    { title: "होम", value: "home" },
    { title: "ताज़ा खबरें", value: "latest" },
    { title: "परिचय", value: "parichay" },
    { title: "कैटेगरी", value: "categories" },
    { title: "ब्लॉग", value: "blogs" },
    { title: "न्यूज़लेटर", value: "newsletter" },
  ];

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
      scrollToSection("top");
      return;
    }
    scrollToSection(value);
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

  return (
    <div className={`${theme === "dark" ? "theme-dark" : ""} news-shell min-h-screen text-[var(--foreground)]`}>
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] py-2 text-xs text-[var(--muted)] sm:text-sm">
          <span>{formatDate()}</span>
          <div className="flex items-center gap-1">
            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.facebook.com/VaamKiAawaz" target="_blank" rel="noreferrer">
              <FacebookIcon className="h-4 w-4" />
            </a>

            <a className="interactive-link inline-flex items-center justify-center h-8 w-8" href="https://www.youtube.com/@VaamKiAawaz" target="_blank" rel="noreferrer">
              <YoutubeIcon className="h-4 w-4" />
            </a>

            <button type="button" className="interactive-link h-10 w-10 hover:cursor-pointer">
              सदस्यता
            </button>
            <a href="mailto:vaamkiaawaz@gmail.com" className="interactive-link px-2 py-1 text-xs sm:text-sm">
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <img
                  src="/vaamki-logo.png"
                  alt="वाम की आवाज़ लोगो"
                  onError={(event) => {
                    event.currentTarget.src = "/vercel.svg";
                  }}
                  className="shrink-0 rounded-lg border border-[var(--line)] object-cover"
                  style={{
                    width: "calc(80px - 28px * var(--compact-progress))",
                    height: "calc(80px - 28px * var(--compact-progress))",
                  }}
                />
                <div className="space-y-2">
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
                      fontSize: "calc(2.45rem - 1.05rem * var(--compact-progress))",
                    }}
                  >
                    वाम की आवाज़
                  </h1>
                  <p
                    className="max-w-2xl overflow-hidden text-[var(--muted)]"
                    style={{
                      opacity: "calc(1 - var(--compact-progress))",
                      maxHeight: "calc(48px * (1 - var(--compact-progress)))",
                      fontSize: "calc(0.85rem - 0.13rem * var(--compact-progress))",
                    }}
                  >
                    अगर थक गए हो चुप रहकर सहने से, रगों में खून उबल रहा है अन्याय के खिलाफ, न्याय, समानता और प्रगति में हैं विश्वास तो — उठो ! बोलो ! बदलो !
                  </p>
                </div>
              </div>
              <a href="https://www.youtube.com/@VaamKiAawaz">
                <button
                  className="rise-on-hover w-fit rounded-md border border-[var(--primary)] bg-[var(--primary)] font-semibold text-white hover:cursor-pointer hover:bg-[var(--primary-dark)]"
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
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md"
            style={{
              marginTop: "calc(16px - 8px * var(--compact-progress))",
              marginBottom: "calc(16px - 8px * var(--compact-progress))",
              padding: "calc(12px - 4px * var(--compact-progress))",
            }}
          >
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs
                tabs={navTabs}
                onTabChange={handleNavTabChange}
                hideContent
                containerClassName="gap-1 lg:flex-1 lg:pr-4"
                activeTabClassName="bg-[var(--surface-soft)] border border-[var(--line)]"
                tabClassName="rise-on-hover border border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              />
              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-12 z-30 w-[min(95vw,540px)] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-lg">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Mega Menu</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {allCategories.filter((category) => category !== "ब्लॉग").map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setNewsVisibleCount(6);
                          setBlogVisibleCount(4);
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
              <div className="ml-auto flex w-full items-center justify-end gap-2 lg:w-auto">
                <GooeyInput
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  placeholder="खबरें खोजें..."
                  classNames={{
                    trigger: theme === "dark"
                      ? "bg-[#2A1E1E] border-[#3A2A2A] text-[#F5EDEB]"
                      : "bg-[#E8DDD8] border-[#D6C7C0] text-[#2B2B2B]",

                    bubbleSurface: theme === "dark"
                      ? "bg-[#7D0F13] border-[#5E0B0E] text-white"
                      : "bg-[#E8DDD8] border-[#D6C7C0] text-[#2B2B2B]"
                  }}
                />
                <input
                  type="date"
                  value={selectedNewsDate}
                  onChange={(event) => {
                    setSelectedNewsDate(event.target.value);
                    setNewsVisibleCount(6);
                  }}
                  className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]"
                  aria-label="Select date for news filter"
                />
                {selectedNewsDate && (
                  <button
                    type="button"
                    onClick={() => setSelectedNewsDate("")}
                    className="h-10 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className="rise-on-hover rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  aria-label={theme === "light" ? "Night mode" : "Day mode"}
                >
                  {theme === "light" ? <MoonIcon /> : <SunIcon />}
                </button>
              </div>
            </div>
          </nav>
        </div>

        <section className="my-4 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-2">
            <span className="rounded bg-[var(--primary)] px-2 py-1 text-xs font-semibold tracking-wide text-white">
              ब्रेकिंग
            </span>
            <div className="overflow-hidden">
              <div className="ticker-move flex min-w-max gap-10 text-sm text-[var(--muted)]">
                <span>जनविरोधी नीतियों के खिलाफ देशव्यापी हस्ताक्षर अभियान शुरू</span>
                <span>शिक्षा और स्वास्थ्य बजट में वृद्धि की मांग पर राज्यव्यापी धरना</span>
                <span>युवा रोजगार गारंटी पर संसद में विशेष चर्चा की तैयारी</span>
                <span>जनविरोधी नीतियों के खिलाफ देशव्यापी हस्ताक्षर अभियान शुरू</span>
                <span>शिक्षा और स्वास्थ्य बजट में वृद्धि की मांग पर राज्यव्यापी धरना</span>
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
                <h2 className="font-serif text-3xl font-bold leading-tight text-[var(--headline)] sm:text-4xl">
                  {featuredForDisplay[0].title}
                </h2>
                <p className="mt-3 text-base leading-7 text-[var(--muted)]">{featuredForDisplay[0].excerpt}</p>
                <div className="mt-4 flex items-center gap-4 text-sm text-[var(--muted)]">
                  <span>{featuredForDisplay[0].author}</span>
                  <span>•</span>
                  <span>{featuredForDisplay[0].time}</span>
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
                  <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-[var(--headline)]">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{story.excerpt}</p>
                  <p className="mt-4 text-xs text-[var(--muted)]">
                    {story.author} • {story.time} • {getPostClicks(story)} क्लिक
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
                </button>
              ))}
            </div>

            <section id="latest" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">ताज़ा खबरें</h3>
                <span className="text-sm text-[var(--muted)]">
                  {selectedCategory !== "सभी" ? `${selectedCategory} • ` : ""}
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
                    <h4 className="mt-2 text-lg font-semibold leading-snug text-[var(--headline)]">{story.title}</h4>
                    <p className="mt-2 text-sm text-[var(--muted)]">{story.excerpt}</p>
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      {story.author} • {story.time} • {getPostClicks(story)} क्लिक
                    </p>
                    <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
                  </button>
                ))}
              </div>
              {visibleFeedPosts.length < feedPosts.length && (
                <button
                  onClick={() => setNewsVisibleCount((prev) => prev + 4)}
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
                {[
                  "लोकसभा में बेरोज़गारी पर विशेष चर्चा की मांग",
                  "आंगनवाड़ी और आशा कार्यकर्ताओं के मानदेय पर राज्यों की रिपोर्ट",
                  "शहरी परिवहन में निजीकरण के प्रभाव पर जनसुनवाई",
                  "कैंपस लोकतंत्र और छात्र चुनाव: नई बहस",
                ].map((item, index) => (
                  <button
                    type="button"
                    key={item}
                    className="rise-on-hover flex gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                  >
                    <span className="text-xl font-bold text-[var(--primary)]">{index + 1}</span>
                    <span className="text-sm leading-6 text-[var(--foreground)]">{item}</span>
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

            <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <h3 className="font-serif text-xl font-bold text-[var(--headline)]">अभियान कैलेंडर</h3>
              <div className="mt-3 space-y-3 text-sm">
                <div className="rise-on-hover rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
                  <p className="font-semibold text-[var(--headline)]">जनसंवाद यात्रा</p>
                  <p className="text-[var(--muted)]">05 अप्रैल • भोपाल</p>
                </div>
                <div className="rise-on-hover rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
                  <p className="font-semibold text-[var(--headline)]">महिला अधिकार सम्मेलन</p>
                  <p className="text-[var(--muted)]">09 अप्रैल • कोलकाता</p>
                </div>
              </div>
            </section>
          </aside>
        </main>

        <section id="blogs" className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">ब्लॉग पोस्ट</h3>
            <button type="button" className="interactive-link text-sm font-semibold text-[var(--primary)]">
              ब्लॉग आर्काइव
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleBlogs.map((post) => (
              <button
                type="button"
                key={post.id}
                onClick={() => handlePostOpen(post)}
                className="rise-on-hover rounded-lg border border-[var(--line)] p-4 text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">{post.category}</p>
                <h4 className="mt-2 text-xl font-semibold text-[var(--headline)]">{post.title}</h4>
                <p className="mt-2 text-sm text-[var(--muted)]">{post.excerpt}</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {post.author} • {post.time} • {getPostClicks(post)} क्लिक
                </p>
                <span className="mt-3 inline-flex text-xs font-semibold text-[var(--primary)]">पूरा लेख पढ़ें →</span>
              </button>
            ))}
          </div>
          {visibleBlogs.length < filteredBlogs.length && (
            <button
              onClick={() => setBlogVisibleCount((prev) => prev + 4)}
              className="rise-on-hover mt-5 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]"
            >
              More Posts
            </button>
          )}
        </section>

        <section className="my-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <h3 className="font-serif text-2xl font-bold text-[var(--headline)]">नई खबर या ब्लॉग पोस्ट जोड़ें</h3>
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
              <input
                value={formState.author}
                onChange={(event) => setFormState((prev) => ({ ...prev, author: event.target.value }))}
                placeholder="लेखक नाम"
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)]"
              />
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
              <button className="rise-on-hover rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                ब्लॉग प्रकाशित करें
              </button>
              <textarea
                value={formState.excerpt}
                onChange={(event) => setFormState((prev) => ({ ...prev, excerpt: event.target.value }))}
                placeholder="संक्षिप्त सारांश / एब्स्ट्रैक्ट"
                className="min-h-24 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] md:col-span-2"
              />
              <textarea
                value={formState.content}
                onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="पूरी विस्तृत खबर / लेख"
                className="min-h-48 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] md:col-span-2"
              />
            </form>
          )}
          {blogMessage && <p className="mt-3 text-sm font-medium text-[var(--primary)]">{blogMessage}</p>}
        </section>

        {activePost && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
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
              <p className="mt-3 text-xs text-[var(--muted)]">
                {activePost.author} • {activePost.time} • {getPostClicks(activePost)} क्लिक
              </p>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--foreground)]">
                {getFullArticle(activePost).split("\n\n").map((paragraph, index) => (
                  <p key={`${activePost.id}-${index}`}>{paragraph}</p>
                ))}
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
            <div className="shadow-input relative max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:p-7">
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
                      <div className="flex items-center gap-2">
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
                                    onChange={() => handleAdminPermissionToggle(admin.id, perm.key)}
                                  />
                                  {perm.label}
                                </label>
                              ))}
                            </div>
                            <button
                              onClick={() => handleRemoveAdmin(admin.id)}
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
                        <div className="grid grid-cols-1 gap-1">
                          {permissionLabels.map((perm) => (
                            <label key={perm.key} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                              <input
                                type="checkbox"
                                checked={newAdminForm.permissions[perm.key]}
                                onChange={() =>
                                  setNewAdminForm((prev) => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      [perm.key]: !prev.permissions[perm.key],
                                    },
                                  }))
                                }
                              />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                        <button className="rise-on-hover rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)]">
                          Add Admin
                        </button>
                      </form>
                    </section>
                  )}
                  {canManageContributors && (
                    <section className="rounded-lg border border-[var(--line)] p-4">
                      <h4 className="text-lg font-semibold text-[var(--headline)]">अधिकृत योगदानकर्ता</h4>
                      <div className="mt-3 space-y-2">
                        {contributorAccounts.map((contributor) => (
                          <div key={contributor.id} className="rounded-md border border-[var(--line)] p-3">
                            <p className="text-sm font-semibold text-[var(--headline)]">{contributor.email}</p>
                            <p className="text-xs text-[var(--muted)]">{contributor.active ? "सक्रिय" : "निष्क्रिय"}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => handleToggleContributor(contributor.id)}
                                className="rise-on-hover rounded-md border border-[var(--line)] px-3 py-1 text-xs font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]"
                              >
                                {contributor.active ? "Disable" : "Enable"}
                              </button>
                              <button
                                onClick={() => handleRemoveContributor(contributor.id)}
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
            <div className="flex items-center gap-4">
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
  );
}
