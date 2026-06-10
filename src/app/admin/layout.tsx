"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { LayoutDashboard, FileText, PlusCircle, Home, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || role !== "admin") {
        router.push("/login");
      }
    }
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-editorial-cream flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-editorial-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-mono text-editorial-gray">
            Authorizing Administrator Access...
          </p>
        </div>
      </div>
    );
  }

  // Double check authorization
  if (!user || role !== "admin") {
    return null; // Avoid rendering content while redirecting
  }

  const sidebarLinks = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "All Articles", href: "/admin/articles", icon: FileText },
    { name: "Create Essay", href: "/admin/create", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-editorial-cream flex flex-col md:flex-row font-sans border-t border-[#e6e2da]">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-editorial-cream-dark border-r border-[#e6e2da] p-6 space-y-8">
        <div className="border-b border-[#e6e2da] pb-6">
          <p className="text-[10px] font-mono tracking-widest uppercase text-editorial-accent font-bold">
            Administrative
          </p>
          <h2 className="font-serif text-lg font-bold text-editorial-charcoal">
            Editor Panel
          </h2>
          <span className="inline-block mt-1 text-[9px] font-mono uppercase bg-editorial-cream px-2 py-0.5 border border-[#e6e2da] rounded-sm text-editorial-gold">
            Editor-in-Chief
          </span>
        </div>

        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-4 py-3 text-sm rounded-sm font-medium transition-all ${
                  isActive
                    ? "bg-white border border-[#e6e2da] text-editorial-accent font-bold"
                    : "text-editorial-gray hover:text-editorial-charcoal hover:bg-white/50"
                }`}
              >
                <Icon className="h-4.5 w-4.5 mr-3 flex-shrink-0" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 border-t border-[#e6e2da] space-y-2">
          <Link
            href="/"
            className="flex items-center px-4 py-2.5 text-xs uppercase tracking-widest font-mono font-bold text-editorial-gray hover:text-editorial-charcoal transition-colors"
          >
            <Home className="h-4 w-4 mr-3" />
            Public Site
          </Link>
          <button
            onClick={() => logout().then(() => router.push("/"))}
            className="flex w-full items-center px-4 py-2.5 text-xs uppercase tracking-widest font-mono font-bold text-editorial-accent hover:text-red-700 transition-colors text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 p-6 sm:p-10 md:overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
