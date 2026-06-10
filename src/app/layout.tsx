import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/context/AuthContext";
import PageTransition from "@/components/PageTransition";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Youth Research Forum | Deep Articles and Long-form Intellectual Publications",
    template: "%s | Youth Research Forum",
  },
  description: "A premium intellectual publication platform dedicated to long-form research articles, papers, and critiques covering national and international policy, philosophy, and society.",
  metadataBase: new URL("https://youthresearchforum.org"),
  openGraph: {
    title: "Youth Research Forum",
    description: "Deep articles and intellectual reviews of policy, philosophy, and society.",
    url: "https://youthresearchforum.org",
    siteName: "Youth Research Forum",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Youth Research Forum",
    description: "Deep articles and intellectual reviews of policy, philosophy, and society.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-editorial-cream text-editorial-charcoal font-sans selection:bg-editorial-accent selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
