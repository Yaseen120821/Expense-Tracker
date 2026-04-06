"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  trend?: {
    value: number; // percentage
    isPositive: boolean;
  };
  sparklineData?: number[]; // Array of last 5 days
  delay?: number;
}

export function SummaryCard({ title, value, currency, icon, trend, sparklineData, delay = 0 }: SummaryCardProps) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(v) {
        setDisplayValue(v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
      },
    });
    return () => controls.stop();
  }, [value]);

  // Generate simple SVG path for sparkline based on 5 points (0-4) mapped to 100x30 viewbox
  const generateSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const max = Math.max(...sparklineData) || 1;
    const min = Math.min(...sparklineData);
    const range = max - min || 1;
    const points = sparklineData.map((val, i) => {
      const x = (i / (sparklineData.length - 1)) * 100;
      const y = 30 - (((val - min) / range) * 20 + 5); // 5px padding, 20px height max
      return `${x},${y}`;
    });
    
    const d = `M ${points.join(' L ')}`;
    const color = trend?.isPositive ? "rgba(76, 175, 80, 0.8)" : "rgba(233, 30, 99, 0.8)";
    
    return (
      <svg viewBox="0 0 100 30" width="100%" height="auto" className="drop-shadow-sm opacity-80 mt-2">
        <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`${d} L 100,30 L 0,30 Z`} fill={`url(#sparkGradient-${title})`} stroke="none" />
        <defs>
          <linearGradient id={`sparkGradient-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative glass rounded-3xl p-6 transition-all duration-300 overflow-hidden group hover:shadow-2xl hover:glow-green flex flex-col justify-between h-full"
    >
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--border)] rounded-full blur-[50px] group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-500 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#262A35] flex items-center justify-center text-[var(--text-primary)] border border-[var(--border)] shadow-inner group-hover:border-[var(--accent-primary)]/40 transition-colors">
              {icon}
            </div>
          </div>
          
          {trend && (
            <div
              className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl glass ${
                trend.isPositive
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <h3 className="font-bold text-[var(--text-secondary)] text-xs tracking-widest uppercase mb-1.5 relative z-10">
          {title}
        </h3>
        
        <div className="relative z-10 flex items-baseline gap-1">
          <span className="text-xl font-bold text-[var(--text-secondary)]">{currency}</span>
          <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter truncate">
            {displayValue}
          </span>
        </div>
      </div>
      
      {/* Dynamic Sparkline Area */}
      <div className="relative z-0 h-8 -mx-2 -mb-2 mt-2">
        {generateSparkline()}
      </div>
    </motion.div>
  );
}
