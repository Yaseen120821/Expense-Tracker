"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt, Target, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions({ onAddGoal }: { onAddGoal: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const actions = [
    {
      label: "Add Goal",
      icon: <Target className="w-5 h-5" />,
      onClick: () => {
        setIsOpen(false);
        onAddGoal();
      },
      color: "bg-gradient-to-tr from-blue-500 to-cyan-400 text-white shadow-blue-500/30",
    },
    {
      label: "Scan Receipt",
      icon: <Receipt className="w-5 h-5" />,
      onClick: () => {
        setIsOpen(false);
        router.push("/scan");
      },
      color: "bg-gradient-to-tr from-[#FF9800] to-[#FFC107] text-white shadow-orange-500/30",
    },
    {
      label: "Add Expense",
      icon: <PlusCircle className="w-5 h-5" />,
      onClick: () => {
        setIsOpen(false);
        router.push("/expenses");
      },
      color: "bg-gradient-to-tr from-[#4CAF50] to-emerald-400 text-white shadow-green-500/30",
    },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-[#0F1115]/60 backdrop-blur-xl z-40"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col gap-4 mb-6"
            >
              {actions.map((action, idx) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05, type: "spring", stiffness: 300 }}
                  className="flex items-center justify-end gap-4 group cursor-pointer"
                  onClick={action.onClick}
                >
                  <div className="glass px-4 py-2 rounded-2xl font-bold text-sm text-[var(--text-primary)] tracking-wide group-hover:scale-105 transition-transform duration-300 pointer-events-none">
                    {action.label}
                  </div>
                  <button
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 active:scale-95 ${action.color}`}
                  >
                    {action.icon}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative w-16 h-16 rounded-[2rem] flex items-center justify-center text-white bg-gradient-to-r from-[var(--accent-secondary)] to-[#E65100] hover:shadow-[0_0_30px_rgba(255,152,0,0.5)] transition-all duration-300 z-50 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <Plus className="w-8 h-8 relative z-10" />
        </motion.button>
      </div>
    </>
  );
}
