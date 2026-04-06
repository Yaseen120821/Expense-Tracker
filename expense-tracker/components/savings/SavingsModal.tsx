"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, TrendingUp } from "lucide-react";
import { SavingsGoal, db } from "@/lib/instant";

type Mode = "create" | "edit" | "add_funds";

interface SavingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  userId: string;
  mode: Mode;
  initialData?: SavingsGoal | null;
}

export function SavingsModal({ isOpen, onClose, currency, userId, mode, initialData }: SavingsModalProps) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" || mode === "add_funds") {
        setTitle(initialData?.title || "");
        setTargetAmount(String(initialData?.targetAmount || ""));
        setCurrentAmount(String(initialData?.currentAmount || ""));
        setDeadline(initialData?.deadline || "");
        setAddAmount("");
      } else {
        setTitle("");
        setTargetAmount("");
        setCurrentAmount("");
        setDeadline("");
        setAddAmount("");
      }
    }
  }, [isOpen, mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "add_funds" && initialData) {
        // Only updating currentAmount
        const addition = parseFloat(addAmount) || 0;
        const newTotal = (initialData.currentAmount || 0) + addition;
        
        await db.transact([
          db.tx.savings[initialData.id].update({
            currentAmount: newTotal,
          })
        ]);
      } else {
        // Create or Edit
        const payload = {
          userId,
          title,
          targetAmount: parseFloat(targetAmount) || 1000,
          currentAmount: parseFloat(currentAmount) || 0,
          deadline: deadline || undefined,
        };

        if (mode === "edit" && initialData) {
          await db.transact([db.tx.savings[initialData.id].update(payload)]);
        } else {
          const id = crypto.randomUUID();
          await db.transact([
            db.tx.savings[id].update({
              ...payload,
              id,
              createdAt: new Date().toISOString(),
            })
          ]);
        }
      }
      onClose();
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[var(--bg-primary)] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-[var(--border)]"
        >
          {/* Header */}
          <div className="bg-[var(--bg-secondary)] px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              {mode === "add_funds" && <TrendingUp className="w-5 h-5 text-green-500" />}
              {mode === "create" ? "Create Savings Goal" : mode === "add_funds" ? "Add Funds to Goal" : "Edit Goal"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {mode === "add_funds" && initialData ? (
              // ── ADD FUNDS VIEW ──
              <>
                <div className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--border)] mb-4">
                  <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">Goal: <span className="text-[var(--text-primary)]">{initialData.title}</span></p>
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    Current: <span className="text-[var(--text-primary)]">{currency}{initialData.currentAmount.toLocaleString()}</span> / {currency}{initialData.targetAmount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Amount to Deposit
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold">
                      {currency}
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] font-bold placeholder:font-normal"
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
              </>
            ) : (
              // ── CREATE / EDIT VIEW ──
              <>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)]"
                    placeholder="e.g. New Car, Vacation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Target Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold">
                        {currency}
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] font-bold"
                        placeholder="10000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Saved So Far
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold">
                        {currency}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] font-bold"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Target Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)]"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--text-secondary)] font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[var(--bg-primary)]/30 border-t-[var(--bg-primary)] rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === "create" ? "Create Goal" : mode === "add_funds" ? "Deposit Funds" : "Save Changes"}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
