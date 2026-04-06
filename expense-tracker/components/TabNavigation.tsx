"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Receipt, ScanLine, Lightbulb, Settings, LogOut } from "lucide-react";
import { db } from "@/lib/instant";
import { ThemeToggle } from "@/components/ThemeToggle";

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Scan", href: "/scan", icon: ScanLine },
  { name: "Insights", href: "/insights", icon: Lightbulb },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await db.auth.signOut();
    router.push("/auth");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] border-t border-[var(--border)] pb-safe z-50 md:left-0 md:top-0 md:bottom-0 md:w-72 md:border-t-0 md:border-r md:shadow-[4px_0_24px_rgba(0,0,0,0.04)] transition-colors duration-300">
      <div className="flex justify-around items-center h-20 md:flex-col md:h-full md:justify-start md:pt-10 md:gap-1 md:px-5 relative">

        {/* Logo — desktop only */}
        <div className="hidden md:flex items-center w-full mb-8 px-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white mr-3 shadow-lg shadow-[var(--accent-primary)]/20 flex-shrink-0">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-tight text-xl text-[var(--text-primary)]">Advisor AI</span>
        </div>

        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`relative flex flex-col md:flex-row items-center justify-center w-full h-full md:h-12 md:px-3 md:py-2.5 md:justify-start transition-colors group z-10 rounded-2xl ${
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 max-md:top-2 md:inset-0 bg-[var(--highlight)] md:rounded-2xl rounded-xl z-[-1] max-md:w-14 max-md:h-14 max-md:mx-auto max-md:scale-110" />
              )}

              <div className={`relative mb-1 md:mb-0 md:mr-3 transition-transform ${isActive ? "scale-110 md:scale-100 text-[var(--accent-primary)]" : "group-hover:scale-110"}`}>
                <Icon className="w-6 h-6 md:w-4.5 md:h-4.5 stroke-[2px]" />
              </div>
              <span className={`text-[10px] md:text-sm tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>{tab.name}</span>
            </Link>
          );
        })}

        {/* ── Bottom section: Theme toggle + Logout ── */}
        <div className="hidden md:flex flex-col w-full mt-auto mb-8 gap-1">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full h-12 px-3 py-2.5 justify-start rounded-2xl transition-all text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 group"
          >
            <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>

        {/* Mobile: Logout only */}
        <button
          onClick={handleLogout}
          className="flex md:hidden flex-col items-center justify-center w-full h-full text-red-400 hover:text-red-500 transition-colors group"
        >
          <LogOut className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>

      </div>
    </nav>
  );
}
