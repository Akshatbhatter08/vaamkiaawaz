import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
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
  title: "वाम की आवाज़ | जन समाचार मंच",
  description:
    "जन-संघर्ष, सामाजिक न्याय, अल्पसंख्यक और लोकतांत्रिक मुद्दों पर खबर और विचार केंद्रित न्यूज पोर्टल",
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
      <body suppressHydrationWarning className="min-h-full flex flex-col">
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
      </body>
    </html>
  );
}
