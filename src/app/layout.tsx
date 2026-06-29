import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import ContextMenu from "@/components/ContextMenu";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vaamkiaawaz.in"),
  title: "वाम की आवाज़ | जन समाचार मंच",
  description:
    "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
  openGraph: {
    title: "वाम की आवाज़ | जन समाचार मंच",
    description: "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
    siteName: "वाम की आवाज़ — विकल्प की डिजिटल दुनिया",
    url: "https://vaamkiaawaz.in",
    images: [
      {
        url: "https://vaamkiaawaz.in/fbpage.png",
        width: 1200,
        height: 630,
        alt: "वाम की आवाज़ | जन समाचार मंच",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "वाम की आवाज़ | जन समाचार मंच",
    description: "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
    images: ["https://vaamkiaawaz.in/fbpage.png"],
  },
  other: {
    "google-adsense-account": "ca-pub-5595988052361058"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hi"
      className={`${inter.variable} h-full`}
    >
      <head>
        {/* Google Fonts — Noto Serif Devanagari, Noto Sans Devanagari, Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5595988052361058"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7RC0RY6QDQ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7RC0RY6QDQ');
          `}
        </Script>
        <ContextMenu />
        {children}
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new window.google.translate.TranslateElement({
                pageLanguage: 'hi',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <div id="google_translate_container" className="hidden">
          <div id="google_translate_element"></div>
        </div>
      </body>
    </html>
  );
}
