"use client";

import Link from "next/link";
import { User, Share2, AtSign, CheckCircle, Users } from "lucide-react";
import { formatViews } from "@/utils/designUtils";

type Post = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  clickCount?: number;
};

// Removed toDevanagari conversion as per user request for English numerals

type AuthorProfileBoxProps = {
  authorName: string;
  authorImage?: string | null;
  authorPosts: Post[];
};

const AUTHOR_DATA: Record<string, { role: string; tags: string[]; bio: string }> = {
  "विनय कुमार": {
    role: "News Editor",
    tags: ["MA"],
    bio: "विनय कुमार, वाम की आवाज़ के प्रमुख संपादक हैं। उन्होंने पिछले 12 वर्षों से राजनीति, खेल, समाज और स्थानीय मुद्दों की रिपोर्टिंग की है। फील्ड रिपोर्टिंग का व्यापक अनुभव रखते हैं। उनकी रिपोर्टिंग हमेशा तथ्यों पर आधारित और निष्पक्ष रहती है।",
  },
  "केशव कुमार भट्टड़": {
    role: "संस्थापक एवं मुख्य । प्रबंध संपादक",
    tags: ["Founder", "Editor"],
    bio: "केशव कुमार भट्टड़ 'वाम की आवाज़' के संस्थापक और मुख्य संपादक हैं। उन्होंने जन-संघर्ष, सामाजिक न्याय और अल्पसंख्यक मुद्दों पर निरंतर निर्भीक पत्रकारिता की है।",
  },
  "मोहम्मद सलीम": {
    role: "प्रेरक",
    tags: ["Inspiration"],
    bio: "मोहम्मद सलीम वाम की आवाज़ के मार्गदर्शक और प्रेरक हैं, जिनका लंबा राजनीतिक और सामाजिक अनुभव टीम का मार्गदर्शन करता है।",
  },
  "डॉ. अशोक सिंह": {
    role: "मुख्य सचेतक",
    tags: ["Chief Whip"],
    bio: "डॉ. अशोक सिंह वाम की आवाज़ के मुख्य सचेतक हैं। वे लोकतांत्रिक अधिकारों और सामाजिक समानता के मुद्दों पर गहरी समझ रखते हैं।",
  },
  "उत्तम सेनगुप्ता": {
    role: "सलाहकार संपादक",
    tags: ["Consulting Editor"],
    bio: "उत्तम सेनगुप्ता एक वरिष्ठ पत्रकार और वाम की आवाज़ के सलाहकार संपादक हैं। उन्होंने कई प्रमुख मीडिया संस्थानों में अपनी सेवाएं दी हैं।",
  },
  "श्रेया जायसवाल": {
    role: "संपादक मण्डल",
    tags: ["Editor"],
    bio: "श्रेया जायसवाल वाम की आवाज़ के संपादक मण्डल की प्रमुख सदस्य हैं। वे महिला अधिकारों और सामाजिक न्याय के मुद्दों पर मुखर आवाज़ हैं।",
  },
  "राजीव कुमार पाण्डेय": {
    role: "संपादक मण्डल",
    tags: ["Editor"],
    bio: "राजीव कुमार पाण्डेय स्वतंत्र पत्रकार और संपादक मण्डल के अहम सदस्य हैं, जो जन-आंदोलनों और जमीनी हकीकतों पर गहरी पकड़ रखते हैं।",
  },
};

const getAuthorInfo = (name: string) => {
  if (AUTHOR_DATA[name]) return AUTHOR_DATA[name];
  return {
    role: "योगदानकर्ता",
    tags: ["Contributor"],
    bio: `${name} 'वाम की आवाज़' के एक स्वतंत्र पत्रकार और योगदानकर्ता हैं, जो जन-सरोकार और सामाजिक न्याय के मुद्दों पर बेबाक रिपोर्टिंग करते हैं।`,
  };
};

export default function AuthorProfileBox({ authorName, authorImage, authorPosts }: AuthorProfileBoxProps) {
  const authorInfo = getAuthorInfo(authorName);

  const totalPosts = authorPosts.length;
  const totalViews = authorPosts.reduce((sum, post) => sum + (post.clickCount ?? 0), 0);

  const earliest = authorPosts.reduce<Date | null>((min, post) => {
    const date = new Date(post.createdAt);
    if (Number.isNaN(date.getTime())) return min;
    return !min || date < min ? date : min;
  }, null);

  const memberSinceLabel = earliest
    ? `${new Intl.DateTimeFormat("hi-IN", { month: "long" }).format(earliest)} ${earliest.getFullYear()}`
    : null;

  const experienceYears = earliest
    ? Math.max(1, new Date().getFullYear() - earliest.getFullYear())
    : 1;

  const stats: { label: string; value: string }[] = [
    { label: "कुल लेख", value: String(totalPosts) },
    { label: "कुल पाठक", value: formatViews(totalViews) },
    { label: "अनुभव", value: `${experienceYears} वर्ष` },
  ];

  return (
    <section className="article-no-print author-hero text-[var(--foreground)] font-sans">
      {/* Identity column */}
      <div className="author-hero__identity">
        {authorImage ? (
          <img src={authorImage} alt={authorName} className="avatar-circle author-hero__avatar" />
        ) : (
          <div className="avatar-circle author-hero__avatar author-hero__avatar--placeholder">
            <User className="h-12 w-12" style={{ color: "var(--text-muted)" }} />
          </div>
        )}

        <Link href={`/author/${encodeURIComponent(authorName)}`} className="hover:underline" style={{ textDecoration: "none" }}>
          <h1 className="author-hero__name">{authorName}</h1>
        </Link>
        <div className="author-hero__role">{authorInfo.role}</div>
        {memberSinceLabel && <div className="author-hero__meta">सदस्य: {memberSinceLabel} से</div>}

        <div className="author-hero__icons">
          <button type="button" className="author-hero__icon" aria-label="साझा करें">
            <Share2 className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className="author-hero__icon" aria-label="संपर्क">
            <AtSign className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="author-hero__trust">
          <div className="author-hero__trust-item">
            <CheckCircle className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span>तथ्य-जाँचित एवं संपादकीय दिशा-निर्देश</span>
          </div>
          <div className="author-hero__trust-item">
            <Users className="h-4 w-4" style={{ color: "var(--gold)" }} />
            <span>विशेषज्ञों द्वारा समीक्षित</span>
          </div>
        </div>
      </div>

      {/* Editorial column: quote + statistics */}
      <div>
        <blockquote className="author-hero__quote">{authorInfo.bio}</blockquote>

        <div className="author-stats">
          {stats.map((stat) => (
            <div key={stat.label} className="author-stat-card">
              <div className="author-stat-card__label">{stat.label}</div>
              <div className="author-stat-card__value">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
