import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { brand } from "@/config/brand";
import "./globals.css";

const body = Nunito({ variable: "--font-body", subsets: ["latin", "latin-ext"], display: "swap" });
const display = Fredoka({ variable: "--font-display-face", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${brand.name} — ${brand.tagline}`, template: `%s · ${brand.name}` },
  description:
    "An adaptive learning universe for children aged 3–12: maths and reading adventures built on carefully designed original content, with clear progress for parents. No ads, ever.",
  applicationName: brand.name,
};

export const viewport: Viewport = {
  themeColor: "#5b3fd9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
