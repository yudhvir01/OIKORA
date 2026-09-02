import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { SiteNav } from "@/components/site-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Scoped to the OIKORA brand lockup in the nav only — the rest of the
// product's typography stays on Geist.
const brandSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  weight: ["600"],
  subsets: ["latin"],
});

const brandMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OIKORA — Business, in sync.",
  description: "Multi-location inventory tracking, stock movements, and purchase orders.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${brandSans.variable} ${brandMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Sets [data-theme] before hydration so there's no flash of the
            wrong theme. A plain JSX <script> tag here doesn't work — the App
            Router's <head>/<body> are React-managed, not literal static
            HTML, so React never lets a raw dangerouslySetInnerHTML script
            execute; beforeInteractive is Next's actual mechanism for
            "run this before any page JS or hydration." */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-zinc-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-zinc-50 dark:focus:text-zinc-900"
        >
          Skip to main content
        </a>
        <SiteNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
