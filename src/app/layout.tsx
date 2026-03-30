import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Source_Serif_4, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "वाम की आवाज़ | CPI(M) जन समाचार मंच",
  description:
    "वामपंथी विचार, जन संघर्ष, सामाजिक न्याय और लोकतांत्रिक मुद्दों पर केंद्रित आधुनिक न्यूज़ पोर्टल।",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hi"
      className={cn("h-full", "antialiased", notoSansDevanagari.variable, sourceSerif.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
