"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  DollarSign,
  Tag,
  Moon,
  Sun,
  Brain,
  Plus,
  X,
  Save,
  CheckCircle2,
  Wallet,
  Settings,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import { db, DEFAULT_CATEGORIES } from "@/lib/instant";
import { useTheme } from "@/lib/ThemeContext";

const CURRENCIES = [
  { symbol: "₹", label: "INR – Indian Rupee" },
  { symbol: "$", label: "USD – US Dollar" },
  { symbol: "€", label: "EUR – Euro" },
  { symbol: "£", label: "GBP – British Pound" },
  { symbol: "¥", label: "JPY – Japanese Yen" },
];

const AI_MODES = [
  { value: "normal", label: "Balanced", desc: "Helpful and balanced suggestions" },
  { value: "strict", label: "Strict", desc: "Direct and firm about overspending" },
  { value: "aggressive", label: "Aggressive", desc: "Challenge every category ruthlessly" },
];

export default function SettingsPage() {
  const { user } = db.useAuth();

  const { data: settingsData } = db.useQuery(
    user ? { settings: { $: { where: { userId: user.id } } } } : null
  );

  const existing = settingsData?.settings?.[0];

  const { theme, setTheme } = useTheme();
  const [currency, setCurrency] = useState("₹");
  const [budget, setBudget] = useState("50000");
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = useState("");
  const [aiMode, setAiMode] = useState("normal");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load existing settings once
  useEffect(() => {
    if (existing && !initialized) {
      setCurrency(existing.currency || "₹");
      setBudget(String(existing.monthlyBudget || 50000));
      setTheme((existing.theme as "light" | "dark") || "dark");
      setAiMode(existing.aiMode || "normal");
      try {
        const cats = JSON.parse(existing.categories || "[]");
        if (Array.isArray(cats) && cats.length > 0) setCategories(cats);
      } catch {}
      setInitialized(true);
    }
  }, [existing, initialized]);

  const [smsEnabled, setSmsEnabled] = useState(false);

  // Apply theme to document — handled globally by ThemeContext, just save to DB

  // Initialize SMS toggle from localStorage
  useEffect(() => {
    setSmsEnabled(localStorage.getItem("sms_consent") === "true");
  }, []);

  const handleSmsToggle = () => {
    const newValue = !smsEnabled;
    setSmsEnabled(newValue);
    localStorage.setItem("sms_consent", newValue ? "true" : "false");
    // We auto-save this since it's local
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories([...categories, trimmed]);
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        userId: user.id,
        currency,
        monthlyBudget: parseFloat(budget) || 50000,
        theme,
        categories: JSON.stringify(categories),
        aiMode,
      };

      if (existing?.id) {
        // Update existing
        await db.transact([db.tx.settings[existing.id].update(payload)]);
      } else {
        // Create new
        const id = crypto.randomUUID();
        await db.transact([db.tx.settings[id].update(payload)]);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Settings save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[1.25rem] bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border)] shadow-sm">
            <Settings className="w-6 h-6 text-[var(--text-primary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">Preferences</h1>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Customize your budget and app experience.</p>
          </div>
        </div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 font-bold px-6 py-3 rounded-2xl transition-all shadow-sm ${
            saved 
              ? "bg-green-500 text-white" 
              : "bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] disabled:opacity-70"
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved ? "Saved Successfully" : "Save Changes"}
        </motion.button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 md:space-y-8">
        
        {/* ── Monthly Budget ───────────────────────────────────────────── */}
        <Section icon={<Wallet className="w-5 h-5" />} title="Monthly Budget" description="Set your spending target limit.">
          <div className="flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[1.5rem] p-4 shadow-inner focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/50 focus-within:border-[var(--accent-primary)] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] shadow-sm flex items-center justify-center text-2xl font-black text-[var(--text-primary)]">
              {currency}
            </div>
            <input
              type="number"
              min="0"
              step="100"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-[var(--text-primary)] text-3xl font-extrabold tracking-tight placeholder:opacity-40"
              placeholder="50000"
            />
          </div>
        </Section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* ── Theme ────────────────────────────────────────────────────── */}
          <Section icon={theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />} title="Appearance" description="Choose your preferred theme.">
            <div className="flex gap-4">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-[1.5rem] border-2 font-bold text-sm transition-all ${
                    theme === t
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40 hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t === "light" ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  {t === "light" ? "Light Mode" : "Dark Mode"}
                </button>
              ))}
            </div>
          </Section>

          {/* ── Currency ─────────────────────────────────────────────────── */}
          <Section icon={<DollarSign className="w-5 h-5" />} title="Currency" description="Select your primary currency.">
            <div className="grid grid-cols-2 gap-3">
              {CURRENCIES.map(({ symbol, label }) => (
                <button
                  key={symbol}
                  onClick={() => setCurrency(symbol)}
                  className={`flex flex-col items-start gap-1 p-4 rounded-[1.5rem] border-2 transition-all text-left ${
                    currency === symbol
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                      : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-secondary)]/80"
                  }`}
                >
                  <span className={`text-xl font-black ${currency === symbol ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}>
                    {symbol}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase">{label.split(' – ')[1]}</span>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Categories ───────────────────────────────────────────────── */}
        <Section icon={<Tag className="w-5 h-5" />} title="Expense Categories" description="Manage your custom transaction categories.">
          <div className="flex flex-wrap gap-2.5 mb-5">
            <AnimatePresence>
              {categories.map((cat) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={cat}
                  className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] pl-4 pr-1.5 py-1.5 rounded-2xl text-sm font-bold shadow-sm"
                >
                  {cat}
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="w-6 h-6 rounded-xl flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              placeholder="Create new category..."
              className="flex-1 px-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:outline-none transition-all text-[var(--text-primary)] font-medium text-sm shadow-inner"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
              className="flex items-center gap-2 bg-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#43a047] text-white px-6 py-4 rounded-2xl font-bold text-sm transition-colors shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          </div>
        </Section>

        {/* ── AI Insight Mode ──────────────────────────────────────────── */}
        <Section icon={<Brain className="w-5 h-5" />} title="AI Advisor Persona" description="Choose how strict the AI should be about your budget highlights.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AI_MODES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setAiMode(value)}
                className={`w-full flex flex-col items-start gap-2 p-5 rounded-[1.5rem] border-2 transition-all text-left relative overflow-hidden group ${
                  aiMode === value
                    ? "border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/5 shadow-md"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent-secondary)]/40"
                }`}
              >
                {aiMode === value && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[var(--accent-secondary)]/20 to-transparent rounded-bl-full pointer-events-none" />
                )}
                <div className="flex w-full items-center justify-between mb-2">
                  <span className={`font-extrabold text-base ${aiMode === value ? "text-[var(--accent-secondary)]" : "text-[var(--text-primary)]"}`}>
                    {label}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      aiMode === value
                        ? "border-[var(--accent-secondary)] bg-[var(--accent-secondary)]"
                        : "border-[var(--border)] bg-transparent group-hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    {aiMode === value && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">{desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* ── SMS Tracking ─────────────────────────────────────────────── */}
        <Section icon={<MessageSquareText className="w-5 h-5" />} title="Smart SMS Parsing" description="Enable pasting bank SMS to automatically extract transactions securely.">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[1.5rem] shadow-sm">
            <div className="flex items-start gap-4 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex flex-shrink-0 items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Text Extraction</h4>
                <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed max-w-sm">
                  We only analyze the texts you paste manually. We do not access your device's SMS inbox. Your data is stripped of sensitive info before AI categorization.
                </p>
              </div>
            </div>
            
            <button
               onClick={handleSmsToggle}
               className={`relative flex items-center w-14 h-8 rounded-full transition-colors flex-shrink-0 focus:outline-none ${smsEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'}`}
             >
               <motion.div
                 layout
                 className={`w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center`}
                 animate={{ x: smsEnabled ? 28 : 4 }}
                 transition={{ type: "spring", stiffness: 500, damping: 30 }}
               />
             </button>
          </div>
        </Section>
      </motion.div>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm"
    >
      <div className="mb-6 md:mb-8">
        <h2 className="flex items-center gap-3 font-extrabold text-[var(--text-primary)] text-lg md:text-xl">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)]">
            {icon}
          </div>
          {title}
        </h2>
        {description && <p className="text-sm font-medium text-[var(--text-secondary)] mt-2 ml-13">{description}</p>}
      </div>
      <div className="ml-0">{children}</div>
    </motion.div>
  );
}
