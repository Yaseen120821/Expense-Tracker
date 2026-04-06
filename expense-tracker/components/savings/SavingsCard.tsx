"use client";

import { motion } from "framer-motion";
import { Target, Pencil, Plus, Trash2, Clock, Flame } from "lucide-react";
import { SavingsGoal } from "@/lib/instant";

interface SavingsCardProps {
  goal: SavingsGoal;
  currency: string;
  onEdit: (goal: SavingsGoal) => void;
  onAddFunds: (goal: SavingsGoal) => void;
  onDelete: (id: string) => void;
}

export function SavingsCard({ goal, currency, onEdit, onAddFunds, onDelete }: SavingsCardProps) {
  const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  
  // Dynamic gradient based on progress
  const progressGradient = 
    percent >= 100 ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" :
    percent >= 50 ? "bg-gradient-to-r from-[var(--accent-secondary)] to-yellow-400 shadow-[0_0_15px_rgba(255,152,0,0.5)]" : 
    "bg-gradient-to-r from-orange-400 to-red-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
    
  // Days remaining calculation
  let daysRemainingText = "";
  let isUrgent = false;
  if (goal.deadline) {
    const targetDate = new Date(goal.deadline);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      daysRemainingText = `${diffDays} days left`;
      if (diffDays <= 7 && percent < 100) isUrgent = true;
    } else if (diffDays === 0) {
      daysRemainingText = "Due today";
      if (percent < 100) isUrgent = true;
    } else {
      daysRemainingText = "Overdue";
      if (percent < 100) isUrgent = true;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="glass rounded-[2rem] p-6 group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-[var(--border)]"
    >
      {/* Background Hover Glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1D24] border border-[var(--border)] shadow-inner flex items-center justify-center text-blue-400 group-hover:border-blue-500/30 transition-colors">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[var(--text-primary)] text-lg tracking-tight mb-0.5">{goal.title}</h3>
            {daysRemainingText && (
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${isUrgent ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                <Clock className="w-3.5 h-3.5" />
                {daysRemainingText}
              </div>
            )}
          </div>
        </div>

        {/* Hover Actions */}
        <div className="flex flex-col gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
          <button onClick={() => onEdit(goal)} className="p-2.5 bg-[#1F232C] hover:bg-[#2A2F3A] text-[var(--text-secondary)] hover:text-white rounded-xl transition-all border border-transparent hover:border-[var(--border)]" title="Edit Goal">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all border border-transparent hover:border-red-500/20" title="Delete Goal">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col relative z-10">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl text-[var(--text-secondary)] font-bold">{currency}</span>
            <span className="text-4xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-sm">
              {goal.currentAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
             {percent >= 50 && (
               <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-[#FF9800] bg-[#FF9800]/10 px-2 py-0.5 rounded-md mb-1 border border-[#FF9800]/20">
                 <Flame className="w-3 h-3" /> {Math.round(percent)}%
               </div>
             )}
             <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                Target: {currency}{goal.targetAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
             </span>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#111318] rounded-full h-3 mb-6 overflow-hidden shadow-inner border border-[var(--border)] relative z-10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.5, type: "spring", stiffness: 40, damping: 15 }}
          className={`h-full rounded-full ${progressGradient} relative`}
        >
           <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30" />
        </motion.div>
      </div>

      <button
        onClick={() => onAddFunds(goal)}
        disabled={percent >= 100}
        className="w-full py-4 rounded-2xl relative z-10 bg-gradient-to-b from-[#1F232C] to-[#15181E] border border-[var(--border)] hover:border-[var(--accent-secondary)]/50 hover:shadow-[0_0_20px_rgba(255,152,0,0.15)] text-[var(--text-primary)] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
        {percent >= 100 ? (
          <span className="text-emerald-400">Goal Reached! 🎉</span>
        ) : (
          <>
            <Plus className="w-4 h-4 text-[var(--accent-secondary)] group-hover/btn:rotate-90 group-hover/btn:scale-125 transition-transform duration-300" /> 
            Add Funds
          </>
        )}
      </button>
    </motion.div>
  );
}
