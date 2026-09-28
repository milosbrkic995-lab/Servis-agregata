import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { RegisterServiceWorker } from "@/components/app/register-service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Servisni dnevnik agregata",
  description: "Pratite agregate, servisne rokove, radne sate i istoriju održavanja na jednom mestu.",
  applicationName: "Servisni dnevnik",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Servisni dnevnik",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#234f75",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr-Latn">
      <body className="min-h-dvh antialiased">
        {children}
        <RegisterServiceWorker />
        <Script
          src="https://cdn-chatly.vyro.ai/chatly-make/sites-script/make-preview-runtime.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdn-chatly.vyro.ai/chatly-make/sites-script/heading-override.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
