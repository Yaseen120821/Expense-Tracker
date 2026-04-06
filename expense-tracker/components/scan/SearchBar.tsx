"use client";

import { Search } from "lucide-react";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[var(--text-secondary)]" />
      </div>
      <input
        type="text"
        placeholder="Search receipts by title, merchant, or category..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] shadow-sm transition-colors"
      />
    </div>
  );
}
