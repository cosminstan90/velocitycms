import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { resolveMetadataBase } from "@/lib/metadata-base";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // metadataBase face absolute URL-urile imaginilor opengraph/twitter-image; vine din SeoSettings.siteUrl.
  let siteUrl: string | null = null;
  try {
    const site = await prisma.site.findFirst({ where: { isActive: true }, select: { id: true } });
    const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id }, select: { siteUrl: true } }) : null;
    siteUrl = seo?.siteUrl ?? null;
  } catch {
    // baza indisponibila: metadatele raman fara baza
  }
  return {
    title: "DiVet",
    description: "Enciclopedia animalelor din România",
    metadataBase: resolveMetadataBase(siteUrl),
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
