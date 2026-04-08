import { Providers } from "@/components/providers";
import { allowIndexing, siteConfig, siteUrl } from "@/lib/site";
import { Barlow_Condensed, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ADR Bot | ADR Prüfung auf Deutsch per Telegram",
    template: "%s | ADR Bot",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  category: "education",
  robots: allowIndexing
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
  openGraph: {
    title: "ADR Bot | ADR Prüfung auf Deutsch per Telegram",
    description: siteConfig.description,
    type: "website",
    locale: "de_DE",
    siteName: "ADR Bot",
    url: siteUrl,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ADR Bot landing page preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADR Bot | ADR Prüfung auf Deutsch per Telegram",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`h-full antialiased ${plusJakarta.variable} ${barlowCondensed.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
