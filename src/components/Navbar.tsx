"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search, Menu, X, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { collection, query, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SearchResult {
  title: string;
  slug: string;
  category: string;
  authorName: string;
}

// Deterministic color palette for letter avatars — warm editorial tones
const AVATAR_COLORS = [
  "#9d2b2b", "#c39a5b", "#2b6e9d", "#6e2b9d", "#2b9d6e",
  "#9d6e2b", "#5b5bc3", "#9d2b6e", "#2b9d9d", "#6e9d2b",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Navbar() {
  const { user, role, userData, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverHero, setIsOverHero] = useState(false);

  // Handle scroll effect & hero visibility on article pages
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);

      if (pathname?.startsWith("/article/")) {
        const heroHeight = window.innerHeight;
        setIsOverHero(window.scrollY < heroHeight - 80);
      } else {
        setIsOverHero(false);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Close overlays on path change
  useEffect(() => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [pathname]);

  // Handle Search queries
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const articlesRef = collection(db, "articles");
        const q = query(articlesRef, limit(40));
        const querySnapshot = await getDocs(q);
        
        const results: SearchResult[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const title = data.title || "";
          const subtitle = data.subtitle || "";
          const content = data.content || "";
          const author = data.authorName || "";
          const term = searchQuery.toLowerCase();

          if (
            title.toLowerCase().includes(term) ||
            subtitle.toLowerCase().includes(term) ||
            content.toLowerCase().includes(term) ||
            author.toLowerCase().includes(term)
          ) {
            results.push({
              title,
              slug: data.slug,
              category: data.category,
              authorName: author,
            });
          }
        });
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error("Search error: ", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "National", href: "/national" },
    { name: "International", href: "/international" },
    { name: "About", href: "/about" },
  ];

  // Avatar rendering helper
  const avatarLetter = userData?.firstName?.charAt(0)?.toUpperCase() || "?";
  const avatarColor = getAvatarColor(userData?.firstName || "User");

  const renderAvatar = () => {
    if (userData?.photoURL) {
      return (
        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 relative">
          <Image
            src={userData.photoURL}
            alt="Profile Avatar"
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
      );
    }
    return (
      <div
        className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-lg tracking-wide"
        style={{ backgroundColor: avatarColor }}
      >
        {avatarLetter}
      </div>
    );
  };

  const shouldBeTransparent = isOverHero && !isMobileMenuOpen;

  return (
    <>
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        shouldBeTransparent
          ? "bg-transparent backdrop-blur-none border-transparent shadow-none"
          : `bg-editorial-cream/97 backdrop-blur-lg ${isScrolled ? "border-b border-[#e6e2da]/50 shadow-xs" : ""}`
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? "py-2" : "py-5 sm:py-6"}`}>
            {/* Brand Identity */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="group flex items-center gap-3.5 transition-opacity duration-200 hover:opacity-75"
              >
                {/* Globe Emblem */}
                <div className={`relative flex-shrink-0 transition-all duration-300 ${isScrolled ? "h-[38px] w-[50px] sm:h-[44px] sm:w-[58px]" : "h-[52px] w-[68px] sm:h-[58px] sm:w-[76px]"}`}>
                  <Image
                    src="/emblem.png"
                    alt="Youth Research Forum — Globe Emblem"
                    fill
                    sizes="(max-width: 640px) 68px, 76px"
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>

                {/* Brand Text */}
                <span className={`font-serif font-bold tracking-[0.02em] whitespace-nowrap transition-all duration-300 ${
                  shouldBeTransparent
                    ? "text-white"
                    : "text-[#930B51]"
                } ${isScrolled ? "text-[14px] sm:text-[17px] lg:text-[19px]" : "text-[16px] sm:text-[20px] lg:text-[22px]"}`}>
                  YOUTH RESEARCH FORUM
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative py-2 font-sans text-[13px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                      shouldBeTransparent
                        ? isActive
                          ? "text-white font-bold"
                          : "text-white hover:text-white"
                        : isActive
                          ? "text-editorial-accent font-semibold"
                          : "text-editorial-gray hover:text-editorial-charcoal"
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBorder"
                        className={`absolute bottom-0 left-0 right-0 h-[2px] ${shouldBeTransparent ? "bg-white" : "bg-editorial-accent"}`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Controls & Search Icon */}
            <div className="flex items-center gap-5 justify-end">
              {/* Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className={`p-2 transition-colors duration-200 cursor-pointer ${
                  shouldBeTransparent
                    ? "text-white hover:text-white"
                    : "text-editorial-gray hover:text-editorial-charcoal"
                }`}
                aria-label="Search articles"
              >
                <Search className="h-[18px] w-[18px] stroke-[1.5]" />
              </button>

              {/* Desktop User Section */}
              <div className="hidden md:block relative">
                {user ? (
                  <div>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-1.5 py-1.5 transition-all duration-200 cursor-pointer group"
                    >
                      {renderAvatar()}
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                        shouldBeTransparent
                          ? "text-white group-hover:text-white"
                          : "text-editorial-gray group-hover:text-editorial-charcoal"
                      } ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {isProfileOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsProfileOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 mt-1.5 w-44 origin-top-right bg-editorial-cream py-2.5 z-20 border-t border-[#e6e2da]/50"
                          >
                            {/* User Info Header */}
                            <div className="px-4 pb-2 border-b border-[#e6e2da]/30">
                              <p className="text-xs font-serif font-bold text-editorial-charcoal truncate">
                                {userData?.firstName} {userData?.lastName}
                              </p>
                            </div>

                            {/* Navigation Links */}
                            <div className="flex flex-col pt-1.5 space-y-0.5">
                              <Link
                                href="/library"
                                className="px-4 py-1.5 text-[11px] font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                My Library
                              </Link>
                              <Link
                                href="/profile"
                                className="px-4 py-1.5 text-[11px] font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors"
                                onClick={() => setIsProfileOpen(false)}
                              >
                                Profile
                              </Link>

                              {role === "admin" && (
                                <Link
                                  href="/admin"
                                  className="px-4 py-1.5 text-[11px] font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors"
                                  onClick={() => setIsProfileOpen(false)}
                                >
                                  Admin Dashboard
                                </Link>
                              )}
                              
                              <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    handleLogout();
                                }}
                                className="w-full text-left px-4 py-1.5 text-[11px] font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors cursor-pointer"
                              >
                                Sign Out
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link
                      href="/login"
                      className={`font-sans text-[11px] tracking-[0.18em] uppercase px-4 py-2 rounded-sm transition-all duration-200 ${
                        shouldBeTransparent
                          ? "text-white bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-xs"
                          : "text-white bg-editorial-charcoal hover:bg-editorial-accent"
                      }`}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Menu Icon */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 lg:hidden cursor-pointer transition-colors duration-200 ${
                  shouldBeTransparent
                    ? "text-white hover:text-white"
                    : "text-editorial-gray hover:text-editorial-charcoal"
                }`}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 stroke-[1.5]" />
                ) : (
                  <Menu className="h-6 w-6 stroke-[1.5]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-editorial-charcoal/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-editorial-cream border-b border-[#e6e2da] shadow-xl py-8 px-4 sm:px-6 lg:px-8"
            >
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between border-b border-editorial-charcoal pb-3">
                  <Search className="h-6 w-6 text-editorial-gray mr-3" />
                  <input
                    type="text"
                    placeholder="Search articles, authors, policy, and research..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent font-serif text-lg sm:text-2xl placeholder-editorial-gray/50 border-0 outline-none ring-0 text-editorial-charcoal focus:ring-0"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="p-2 text-editorial-gray hover:text-editorial-charcoal transition-colors cursor-pointer"
                  >
                    <X className="h-6 w-6 stroke-[1.5]" />
                  </button>
                </div>

                {/* Search Results */}
                <div className="mt-6">
                  {isSearching ? (
                    <div className="text-center py-6 text-sm text-editorial-gray">
                      Searching the archives...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-xs uppercase tracking-widest text-editorial-accent font-semibold">Results</p>
                      <div className="divide-y divide-[#e6e2da]">
                        {searchResults.map((result) => (
                          <Link
                            key={result.slug}
                            href={`/article/${result.slug}`}
                            className="block py-4 hover:bg-editorial-cream-dark/50 transition-colors group px-2 rounded-sm"
                          >
                            <span className="text-xs uppercase tracking-wider text-editorial-gold font-mono mb-1 block">
                              {result.category} • By {result.authorName}
                            </span>
                            <h4 className="font-serif text-lg text-editorial-charcoal group-hover:text-editorial-accent transition-colors">
                              {result.title}
                            </h4>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-6 text-sm text-editorial-gray">
                      No publications found matching &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    <div className="text-xs text-editorial-gray tracking-wider uppercase">
                      Type something to begin searching...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={`fixed inset-0 z-40 bg-editorial-cream flex flex-col justify-between border-t border-[#e6e2da] overflow-y-auto transition-all duration-300 ${isScrolled ? "top-[54px] sm:top-[60px]" : "top-[92px] sm:top-[106px]"}`}
          >
            <div className="px-6 py-8 space-y-6">
              <nav className="flex flex-col space-y-6">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`font-serif text-2xl tracking-wide border-b border-[#e6e2da] pb-3 transition-colors ${
                        isActive
                          ? "text-editorial-accent font-bold"
                          : "text-editorial-charcoal hover:text-editorial-accent"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Profile Actions */}
              <div className="pt-6">
                {user ? (
                  <div className="space-y-3.5">
                    {/* Minimal user name header */}
                    <div className="pb-2 border-b border-[#e6e2da]/40">
                      <p className="text-sm font-serif font-bold text-editorial-charcoal">
                        {userData?.firstName} {userData?.lastName}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <Link
                        href="/library"
                        className="block text-xs font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors py-2"
                      >
                        My Library
                      </Link>

                      <Link
                        href="/profile"
                        className="block text-xs font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors py-2"
                      >
                        Profile
                      </Link>

                      {role === "admin" && (
                        <Link
                          href="/admin"
                          className="block text-xs font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors py-2"
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left text-xs font-sans uppercase tracking-[0.14em] text-editorial-gray hover:text-editorial-charcoal transition-colors py-2 cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-4 pt-4">
                    <Link
                      href="/login"
                      className="font-sans text-center text-sm tracking-widest uppercase text-white bg-editorial-charcoal hover:bg-editorial-accent py-3 rounded-sm transition-all"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-editorial-cream-dark/50 text-center border-t border-[#e6e2da]">
              <p className="font-serif text-sm tracking-wide text-editorial-gray">
                © {new Date().getFullYear()} Youth Research Forum
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
