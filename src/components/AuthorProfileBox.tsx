"use client";

import { useState } from "react";
import Link from "next/link";
import { User, PenTool, CheckCircle, Users } from "lucide-react";

type Post = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
};

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
  const [activeTab, setActiveTab] = useState<"about" | "posts">("about");
  const authorInfo = getAuthorInfo(authorName);

  return (
    <div className="article-no-print my-8 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4 sm:p-6 text-[var(--foreground)] font-sans">
      
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
        {authorImage ? (
          <img src={authorImage} alt={authorName} className="h-20 w-20 rounded-full border-2 border-[var(--primary)] object-cover flex-shrink-0" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="h-10 w-10 text-gray-500" />
          </div>
        )}
        <div className="text-center sm:text-left flex-1">
          <Link href={`/author/${encodeURIComponent(authorName)}`} className="hover:underline">
            <h3 className="text-2xl font-bold text-[var(--headline)]">{authorName}</h3>
          </Link>
          <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-sm">
            <span className="font-medium text-[var(--muted)]">{authorInfo.role}</span>
            {authorInfo.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--line)] flex gap-6">
        <button
          onClick={() => setActiveTab("about")}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "about" ? "border-[var(--primary)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
          } cursor-pointer`}
        >
          <User className="h-4 w-4" /> About the Author
        </button>
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 text-sm font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "about" ? "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]" : "border-[var(--primary)] text-[var(--foreground)]"
          } cursor-pointer`}
        >
          <PenTool className="h-4 w-4" /> Latest Posts
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-6 min-h-[140px]">
        {activeTab === "about" && (
          <div className="animate-in fade-in duration-300">
            <p className="text-[var(--muted)] leading-relaxed text-[15px] mb-4">
              {authorInfo.bio}
            </p>
            {authorPosts.length > 0 && (
              <div className="border-l-4 border-[var(--primary)] bg-[var(--background)] p-3 rounded-r-md">
                <span className="text-[var(--primary)] font-bold mr-2">यह भी पढ़ें:</span>
                <Link href={`/post/${authorPosts[0].id}`} className="font-semibold text-[var(--headline)] hover:underline">
                  {authorPosts[0].title}
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="animate-in fade-in duration-300">
            {authorPosts.length > 0 ? (
              <ul className="space-y-3">
                {authorPosts.slice(0, 4).map((post) => (
                  <li key={post.id}>
                    <Link href={`/post/${post.id}`} className="group flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                      <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide shrink-0">
                        {post.category}
                      </span>
                      <span className="font-medium text-[var(--headline)] group-hover:underline line-clamp-1">
                        {post.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--muted)] italic">इस लेखक का कोई अन्य लेख उपलब्ध नहीं है।</p>
            )}
            <div className="mt-4 pt-2">
              <Link href={`/author/${encodeURIComponent(authorName)}`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
                सभी लेख देखें →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer Details */}
      <div className="border-t border-[var(--line)] pt-4 mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium text-gray-600">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-orange-500" />
          <span>Fact Checked & Editorial Guidelines</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-500" />
          <span>Reviewed by: Subject Matter Experts</span>
        </div>
      </div>
    </div>
  );
}
