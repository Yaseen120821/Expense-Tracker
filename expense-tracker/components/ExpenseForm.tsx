"use client";

import { useState } from "react";
import { db } from "@/lib/instant";
import { useSettings } from "@/lib/useSettings";
import { PlusCircle, Loader2, CheckCircle2 } from "lucide-react";

export function ExpenseForm({
  userId,
  prefill,
}: {
  userId: string;
  prefill?: { amount?: number; merchant?: string; date?: string };
}) {
  const { currency, categories } = useSettings();
  const [amount, setAmount] = useState(prefill?.amount ? String(prefill.amount) : "");
  const [merchant, setMerchant] = useState(prefill?.merchant || "");
  const [category, setCategory] = useState(categories[0] || "Others");
  const [date, setDate] = useState(
    prefill?.date || new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !merchant || !userId) return;

    setLoading(true);
    try {
      const id = crypto.randomUUID();
      await db.transact([
        db.tx.expenses[id].update({
          userId,
          amount: parseFloat(amount),
          merchant,
          category,
          date: new Date(date).toISOString(),
          month: new Date(date).toISOString().slice(0, 7),
          createdAt: new Date().toISOString(),
        }),
      ]);
      setAmount("");
      setMerchant("");
      setCategory(categories[0] || "Others");
      setDate(new Date().toISOString().split("T")[0]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm mb-6 max-w-2xl transition-all focus-within:shadow-md focus-within:border-[var(--accent-primary)]/50 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--accent-primary)]/5 to-transparent rounded-bl-full pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)] border border-[var(--border)]">
          <PlusCircle className="w-5 h-5" />
        </div>
        <h3 className="font-extrabold text-xl text-[var(--text-primary)]">Log Transaction</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 pl-1">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-[var(--text-secondary)] text-lg">
              {currency}
            </span>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-5 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/10 focus:outline-none transition-all text-2xl font-bold text-[var(--text-primary)] shadow-inner"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 pl-1">
            Merchant / Title
          </label>
          <input
            type="text"
            required
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/10 focus:outline-none transition-all text-[var(--text-primary)] font-medium"
            placeholder="Coffee, Uber, Amazon..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 pl-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/10 focus:outline-none transition-all text-[var(--text-primary)] font-medium appearance-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 pl-1">
            Date
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-5 py-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/10 focus:outline-none transition-all text-[var(--text-primary)] font-medium"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full font-bold py-4 rounded-2xl transition-all flex justify-center items-center shadow-md active:scale-[0.98] ${
          success 
            ? "bg-green-500 text-white shadow-green-500/20" 
            : "bg-[var(--accent-primary)] hover:bg-[#43a047] text-white shadow-[var(--accent-primary)]/20"
        }`}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : success ? (
          <>
             <CheckCircle2 className="w-5 h-5 mr-2" /> Transaction Added Complete
          </>
        ) : (
          "Save Transaction"
        )}
      </button>
    </form>
  );
}
