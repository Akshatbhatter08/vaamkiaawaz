import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import ContextMenu from "@/components/ContextMenu";
import "./globals.css";

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vaamkiaawaz.in"),
  title: "वाम की आवाज़ | जन समाचार मंच",
  description:
    "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
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
      className={`${notoSansDevanagari.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5595988052361058"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
