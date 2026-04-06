"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, Variants } from "framer-motion";

export function ComparisonSummary({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="mt-8 space-y-4">
      <h4 className="text-xs uppercase tracking-widest font-bold text-[var(--text-secondary)] mb-4 px-2">
        Change Summary
      </h4>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {data.map((item) => {
          const isUp = item.diffPercent > 0;
          const isDown = item.diffPercent < 0;
          const isSame = item.diffPercent === 0;
          
          return (
            <motion.div 
              variants={itemVariants}
              key={item.category} 
              className="flex items-center justify-between p-5 bg-[var(--bg-secondary)] rounded-[1.5rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow group"
            >
              <span className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{item.category}</span>
              <div className="flex items-center gap-3">
                <span className={`text-base font-extrabold ${isUp ? "text-red-500" : isDown ? "text-green-500" : "text-gray-500"}`}>
                  {isUp ? "+" : ""}{item.diffPercent.toFixed(1)}%
                </span>
                <div className={`p-2 rounded-xl ${isUp ? "bg-red-500/10" : isDown ? "bg-green-500/10" : "bg-gray-500/10"}`}>
                  {isUp && <TrendingUp className="w-5 h-5 text-red-500 stroke-[2.5px]" />}
                  {isDown && <TrendingDown className="w-5 h-5 text-green-500 stroke-[2.5px]" />}
                  {isSame && <Minus className="w-5 h-5 text-gray-500 stroke-[2.5px]" />}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
