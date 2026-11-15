import type { Metadata } from "next";
import { Header, Footer } from "@/components/header";
import { SavedProvider } from "@/components/saved-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Good Finds — Good things. New beginnings.", template: "%s | Good Finds" },
  description: "Discover pre-loved pieces with plenty of life left. Browse, sell, and connect directly on Good Finds, the neighborhood marketplace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><SavedProvider><a className="skip-link" href="#main-content">Skip to content</a><Header /><div id="main-content">{children}</div><Footer /></SavedProvider></body></html>;
}
