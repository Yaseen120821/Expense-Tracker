import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Trash2, Tag, Coffee, Plane, ShoppingBag, Flashlight, PlusCircle, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { db, Expense } from "@/lib/instant";

const getCategoryConfig = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("food") || cat.includes("dining")) return { icon: <Coffee className="w-[22px] h-[22px]" />, color: "text-orange-400", bg: "bg-gradient-to-br from-orange-500/20 to-amber-500/10 shadow-[inset_0_2px_10px_rgba(249,115,22,0.15)]", border: "border-orange-500/30" };
  if (cat.includes("travel") || cat.includes("transport")) return { icon: <Plane className="w-[22px] h-[22px]" />, color: "text-blue-400", bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 shadow-[inset_0_2px_10px_rgba(59,130,246,0.15)]", border: "border-blue-500/30" };
  if (cat.includes("shop")) return { icon: <ShoppingBag className="w-[22px] h-[22px]" />, color: "text-pink-400", bg: "bg-gradient-to-br from-pink-500/20 to-rose-500/10 shadow-[inset_0_2px_10px_rgba(236,72,153,0.15)]", border: "border-pink-500/30" };
  if (cat.includes("bill") || cat.includes("utilit")) return { icon: <Flashlight className="w-[22px] h-[22px]" />, color: "text-yellow-400", bg: "bg-gradient-to-br from-yellow-500/20 to-amber-400/10 shadow-[inset_0_2px_10px_rgba(234,179,8,0.15)]", border: "border-yellow-500/30" };
  if (cat.includes("health") || cat.includes("medic")) return { icon: <PlusCircle className="w-[22px] h-[22px]" />, color: "text-red-400", bg: "bg-gradient-to-br from-red-500/20 to-rose-400/10 shadow-[inset_0_2px_10px_rgba(239,68,68,0.15)]", border: "border-red-500/30" };
  if (cat.includes("entertain")) return { icon: <Tag className="w-[22px] h-[22px]" />, color: "text-purple-400", bg: "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 shadow-[inset_0_2px_10px_rgba(168,85,247,0.15)]", border: "border-purple-500/30" };
  return { icon: <LayoutGrid className="w-[22px] h-[22px]" />, color: "text-[var(--accent-primary)]", bg: "bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 shadow-[inset_0_2px_10px_rgba(76,175,80,0.15)]", border: "border-[var(--accent-primary)]/30" };
};

export function ExpenseCard({ expense, currency = "₹" }: { expense: Expense; currency?: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const config = getCategoryConfig(expense.category);

  const handleDelete = async () => {
    setIsDeleting(true);
    await db.transact([db.tx.expenses[expense.id].delete()]);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="glass rounded-3xl p-5 md:p-6 flex items-center justify-between group relative mb-4 hover:border-[var(--text-secondary)]/40 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
    >
      {/* Background Hover Glow - Shifts gradient dynamically */}
      <motion.div 
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1.5 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className={`absolute top-0 right-0 w-64 h-64 ${config.bg.split(' ')[0]} rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/4`} 
      />

      <div className="flex items-center gap-5 flex-1 overflow-hidden relative z-10">
        <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 border ${config.border} ${config.bg} ${config.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          {config.icon}
        </div>
        <div className="min-w-0 pr-4">
          <h3 className="font-extrabold text-lg text-[var(--text-primary)] truncate tracking-tight mb-1 group-hover:text-white transition-colors">{expense.merchant || expense.category}</h3>
          <div className="flex items-center text-xs text-[var(--text-secondary)] gap-3">
            <span className="flex items-center gap-1.5 font-medium opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-lg border ${config.border.replace('30', '20')} bg-white/5 text-[10px] uppercase font-black tracking-widest ${config.color.replace('400', '300')}`}>
              {expense.category}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10 transition-transform duration-300" style={{ transform: isHovered ? 'translateX(-12px)' : 'translateX(0px)' }}>
        <div className="text-right flex flex-col items-end">
          <span className="font-black text-[22px] text-[var(--text-primary)] tracking-tighter tabular-nums drop-shadow-sm group-hover:text-white transition-colors">
            {currency}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`sm:hidden mt-1 text-[9px] uppercase font-black tracking-widest ${config.color.replace('400', '300')}`}>
             {expense.category}
          </span>
        </div>
      </div>

      {/* Swipe/Hover Delete Action Reveal */}
      <div className="absolute right-0 top-0 bottom-0 w-[4.5rem] flex items-center justify-end pr-5 pointer-events-none">
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ x: 30, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 30, opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={isDeleting}
              className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-[1rem] bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all shadow-lg disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
