"use client";

import { TabNavigation } from "@/components/TabNavigation";
import { ThemeProvider } from "@/lib/ThemeContext";
import { db } from "@/lib/instant";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = db.useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/30 animate-pulse">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[var(--text-secondary)] animate-pulse tracking-wide">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16 md:pb-0 md:pl-72 transition-colors duration-300">
        <TabNavigation />
        <main className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
