"use client";

import { useTheme } from "@/lib/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--highlight)] transition-all duration-200 group"
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--highlight)] border border-[var(--border)] group-hover:border-[var(--accent-secondary)]/40 transition-colors flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="w-4 h-4 text-[var(--accent-secondary)]" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="w-4 h-4 text-[var(--accent-secondary)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <span className="text-sm font-semibold hidden md:block">
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}
