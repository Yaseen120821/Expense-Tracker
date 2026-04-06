"use client";

import { useState } from "react";
import { db, Expense, SavingsGoal } from "@/lib/instant";
import { useSettings } from "@/lib/useSettings";
import { PieChartComponent } from "@/components/PieChartComponent";
import { LineChartComponent } from "@/components/LineChartComponent";
import { AlertBanner } from "@/components/AlertBanner";
import { ExpenseCard } from "@/components/ExpenseCard";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { HeroBalanceCard } from "@/components/dashboard/HeroBalanceCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SavingsCard } from "@/components/savings/SavingsCard";
import { SavingsModal } from "@/components/savings/SavingsModal";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Wallet, TrendingDown, Target, PiggyBank, PlusCircle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";

// ── Category gradient definitions (shared with PieChart logic) ──
const CAT_GRADIENTS = [
  { from: "#4CAF50", to: "#8BC34A", shadow: "rgba(76,175,80,0.25)" },
  { from: "#FF9800", to: "#FFC107", shadow: "rgba(255,152,0,0.25)" },
  { from: "#3B82F6", to: "#2DD4BF", shadow: "rgba(59,130,246,0.25)" },
  { from: "#E91E63", to: "#F48FB1", shadow: "rgba(233,30,99,0.25)" },
  { from: "#9C27B0", to: "#D500F9", shadow: "rgba(156,39,176,0.25)" },
  { from: "#F44336", to: "#FF8A80", shadow: "rgba(244,67,54,0.25)" },
  { from: "#00BCD4", to: "#84FFFF", shadow: "rgba(0,188,212,0.25)" },
];

const PREVIEW_COUNT = 3;

export default function DashboardPage() {
  const { user } = db.useAuth();
  const { currency, monthlyBudget } = useSettings();
  const [activityExpanded, setActivityExpanded] = useState(false);

  // ── Queries ──
  const { data: expensesData } = db.useQuery(
    user ? { expenses: { $: { where: { userId: user.id } } } } : null
  );
  const { data: savingsData } = db.useQuery(
    user ? { savings: { $: { where: { userId: user.id } } } } : null
  );

  const budget = monthlyBudget;
  const expenses = ((expensesData?.expenses || []) as Expense[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const savingsGoals = ((savingsData?.savings || []) as SavingsGoal[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // ── Date Filters ──
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const lastMonthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    return d.getMonth() === m && d.getFullYear() === y;
  });

  // ── Metrics ──
  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthSpent = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget - totalSpent;
  const totalSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const spendTrend = lastMonthSpent
    ? Math.round(((totalSpent - lastMonthSpent) / lastMonthSpent) * 100)
    : 0;

  // ── Charts Data ──
  const aggregatedData = currentMonthExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(aggregatedData)
    .map((k) => ({ name: k, value: aggregatedData[k] }))
    .sort((a, b) => b.value - a.value);

  const totalPieValue = pieData.reduce((acc, d) => acc + d.value, 0);

  const sparklineData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString();
    return (
      expenses
        .filter((e) => new Date(e.date).toLocaleDateString() === dayStr)
        .reduce((sum, e) => sum + e.amount, 0) || 0
    );
  });

  const heroTrendData = sparklineData.map((val) => ({ amount: val }));

  // ── Expandable activity list ──
  const displayedExpenses = activityExpanded ? expenses : expenses.slice(0, PREVIEW_COUNT);
  const hasMore = expenses.length > PREVIEW_COUNT;

  // ── Savings Modal State ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "add_funds">("create");
  const [modalData, setModalData] = useState<SavingsGoal | null>(null);

  const openSavingsModal = (mode: "create" | "edit" | "add_funds", goal: SavingsGoal | null = null) => {
    setModalMode(mode);
    setModalData(goal);
    setModalOpen(true);
  };
  const handleDeleteGoal = async (id: string) => {
    if (confirm("Are you sure you want to delete this savings goal?")) {
      await db.transact([db.tx.savings[id].delete()]);
    }
  };

  // ── Animations ──
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
  };
  const listItemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 28 } },
  };

  if (!user) return null;

  return (
    <div className="relative pb-28 min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 max-w-5xl mx-auto pt-4"
      >
        {/* ── BUDGET ALERT ── */}
        {totalSpent > budget && (
          <motion.div variants={sectionVariants}>
            <AlertBanner message="You've exceeded your monthly budget limit! Time to cut back." />
          </motion.div>
        )}

        {/* ── SECTION 1: HERO BALANCE ── */}
        <motion.div variants={sectionVariants}>
          <HeroBalanceCard balance={remaining} currency={currency} trendData={heroTrendData} />
        </motion.div>

        {/* ── SECTION 2: SUMMARY CARDS ── */}
        <motion.div
          variants={sectionVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <SummaryCard title="Monthly Budget" value={budget} currency={currency} icon={<Wallet className="w-5 h-5" />} delay={0.1} />
          <SummaryCard title="Monthly Spending" value={totalSpent} currency={currency} icon={<TrendingDown className="w-5 h-5 text-red-400" />} trend={{ value: spendTrend, isPositive: spendTrend < 0 }} sparklineData={sparklineData} delay={0.2} />
          <SummaryCard title="Remaining" value={Math.max(remaining, 0)} currency={currency} icon={<Target className="w-5 h-5 text-green-400" />} delay={0.3} />
          <SummaryCard title="Total Savings" value={totalSavings} currency={currency} icon={<PiggyBank className="w-5 h-5 text-blue-400" />} delay={0.4} />
        </motion.div>

        {/* ── SECTION 3: SPENDING TREND CHART (full width) ── */}
        <motion.div variants={sectionVariants}>
          <div className="glass rounded-[2rem] p-6 lg:p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2/3 h-px bg-gradient-to-r from-[var(--accent-primary)]/40 to-transparent" />
            <h3 className="font-extrabold text-lg text-[var(--text-primary)] mb-6 tracking-tight">
              Spending Flow
            </h3>
            <div className="w-full min-h-[340px]">
              <LineChartComponent expenses={expenses} currency={currency} />
            </div>
          </div>
        </motion.div>

        {/* ── SECTION 4: CATEGORY DISTRIBUTION (full width, below chart) ── */}
        {pieData.length > 0 && (
          <motion.div variants={sectionVariants}>
            <div className="glass rounded-[2rem] p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-px bg-gradient-to-l from-[var(--accent-secondary)]/40 to-transparent" />
              <h3 className="font-extrabold text-lg text-[var(--text-primary)] mb-8 tracking-tight">
                Category Distribution
              </h3>
              <div className="flex flex-col lg:flex-row items-center gap-10">
                {/* Donut */}
                <div className="w-full lg:w-[420px] flex-shrink-0 flex justify-center">
                  <PieChartComponent data={pieData} currency={currency} />
                </div>
                {/* Category List */}
                <div className="flex-1 w-full space-y-3">
                  {pieData.map((d) => {
                    const percent = totalPieValue ? (d.value / totalPieValue) * 100 : 0;
                    const gradient = CAT_GRADIENTS[d.name.length % CAT_GRADIENTS.length];
                    return (
                      <div
                        key={d.name}
                        className="p-4 rounded-[1.25rem] bg-[#1A1D24] border border-[var(--border)] hover:scale-[1.015] transition-transform"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-[10px] uppercase border border-white/10 shadow-inner flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                                boxShadow: `0 4px 14px ${gradient.shadow}`,
                              }}
                            >
                              {d.name.substring(0, 2)}
                            </div>
                            <span className="font-extrabold text-[var(--text-primary)] text-[15px] tracking-tight">
                              {d.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-[var(--text-primary)] tabular-nums">
                              {currency}{d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)]">
                              {percent.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-[#0F1115] rounded-full overflow-hidden mt-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1.2, type: "spring", stiffness: 60, damping: 15 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SECTION 5: SAVINGS TARGETS ── */}
        <motion.div variants={sectionVariants}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Savings Targets
            </h2>
            <button
              onClick={() => openSavingsModal("create")}
              className="text-xs uppercase tracking-widest font-black text-[var(--text-secondary)] bg-[#1A1D24] hover:bg-white hover:text-black border border-[var(--border)] px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </div>

          {savingsGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {savingsGoals.map((goal) => (
                  <SavingsCard
                    key={goal.id}
                    goal={goal}
                    currency={currency}
                    onEdit={(g) => openSavingsModal("edit", g)}
                    onAddFunds={(g) => openSavingsModal("add_funds", g)}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="glass p-12 rounded-[2.5rem] text-center border border-dashed border-[var(--border)] relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
              <motion.div
                animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-400/10 text-blue-400 mx-auto rounded-[1.75rem] flex items-center justify-center mb-7 border border-blue-500/25 relative z-10"
              >
                <PiggyBank className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2 relative z-10">
                Start Your Savings Journey
              </h3>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto text-sm relative z-10">
                Set a target for a holiday, emergency fund, or dream purchase and track your progress.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openSavingsModal("create")}
                className="relative z-10 bg-white text-black font-black text-sm px-8 py-3.5 rounded-2xl shadow-[0_8px_24px_rgba(255,255,255,0.12)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.2)] transition-all"
              >
                Create Financial Goal
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── SECTION 6: RECENT ACTIVITY (EXPANDABLE) ── */}
        <motion.div variants={sectionVariants}>
          <div className="glass rounded-[2rem] overflow-hidden border border-[var(--border)]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border)]">
              <div>
                <h3 className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight">
                  Recent Activity
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                  {expenses.length} total transaction{expenses.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href="/expenses"
                className="hidden sm:flex text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] items-center gap-1 group transition-colors"
              >
                All Expenses <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Activity List */}
            <div className="p-4 md:p-6">
              {expenses.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center mb-5"
                  >
                    <Wallet className="w-8 h-8 text-[var(--text-secondary)]" />
                  </motion.div>
                  <p className="font-extrabold text-[var(--text-primary)] text-lg mb-1">No Activity Yet</p>
                  <p className="text-sm text-[var(--text-secondary)] max-w-[220px]">
                    Add your first expense to get started.
                  </p>
                </div>
              ) : (
                <>
                  {/* Always-visible preview items */}
                  <motion.div
                    variants={{ show: { transition: { staggerChildren: 0.07 } } }}
                    initial="hidden"
                    animate="show"
                    className="space-y-1"
                  >
                    {displayedExpenses.map((expense) => (
                      <motion.div key={expense.id} variants={listItemVariants}>
                        <ExpenseCard expense={expense} currency={currency} />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Expand / Collapse toggle */}
                  {hasMore && (
                    <motion.button
                      onClick={() => setActivityExpanded((prev) => !prev)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[var(--border)] text-sm font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                    >
                      {activityExpanded ? (
                        <>
                          Show Less <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          View All {expenses.length} Transactions <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── FLOATING ACTIONS ── */}
      <QuickActions onAddGoal={() => openSavingsModal("create")} />

      <SavingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currency={currency}
        userId={user.id}
        mode={modalMode}
        initialData={modalData}
      />
    </div>
  );
}
