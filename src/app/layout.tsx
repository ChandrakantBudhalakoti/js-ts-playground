import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { DisableDevToolsShortcuts } from "@/components/DisableDevToolsShortcuts";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LOAD_FAILURE_SCRIPT } from "@/lib/load-failure";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

// Defaults for every page. Pages set their own title, description, canonical
// URL and Open Graph data with `pageMetadata()` (src/lib/metadata.ts); no
// canonical is set here, because pages without one would inherit it.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  ...(googleSiteVerification && {
    verification: { google: googleSiteVerification },
  }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // When the on-screen keyboard opens, shrink the page instead of covering
  // it, so the editor and its code keys stay above the keyboard (Android).
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121316" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* First, so it sees every script that fails to download. */}
        <script dangerouslySetInnerHTML={{ __html: LOAD_FAILURE_SCRIPT }} />
        <meta
          name="google-site-verification"
          content="yKOHr6XY2H0EL2VwtjjFDZkJFklTn1Ec6zig88enJ1Y"
        />
      </head>
      <body className="min-h-full">
        <DisableDevToolsShortcuts />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster position="bottom-right" closeButton />
            <ServiceWorkerRegistration />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
