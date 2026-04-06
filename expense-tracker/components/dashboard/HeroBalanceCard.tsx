"use client";

import { motion, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Wallet } from "lucide-react";

interface HeroBalanceCardProps {
  balance: number;
  currency: string;
  trendData: { amount: number }[];
}

export function HeroBalanceCard({ balance, currency, trendData }: HeroBalanceCardProps) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    const controls = animate(0, balance, {
      duration: 2,
      ease: "easeOut",
      onUpdate(v) {
        setDisplayValue(v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      },
    });
    return () => controls.stop();
  }, [balance]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 200, damping: 25 }}
      whileHover={{ scale: 1.01 }}
      className="relative w-full overflow-hidden rounded-[2.5rem] glass-card p-1 cursor-default group"
    >
      {/* Dynamic Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)]/10 via-transparent to-[var(--accent-secondary)]/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Core Content Container */}
      <div className="relative border border-[var(--border)] bg-[#111318]/60 backdrop-blur-3xl rounded-[2.25rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between overflow-hidden shadow-2xl">
        
        {/* Left Side: Balance Info */}
        <div className="flex flex-col relative z-20 w-full md:w-1/2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20 shadow-[0_0_15px_rgba(76,175,80,0.1)]">
              <Wallet className="w-6 h-6 text-[var(--accent-primary)]" />
            </div>
            <span className="uppercase tracking-[0.2em] text-xs font-black text-[var(--text-secondary)] mix-blend-screen">
              Available Balance
            </span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl text-[var(--text-secondary)] font-light opacity-80">{currency}</span>
            <span className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-[var(--text-secondary)] tracking-tighter drop-shadow-sm">
              {displayValue}
            </span>
          </div>
        </div>

        {/* Right Side: Animated Sparkline Background/Foreground */}
        <div className="w-full md:w-1/2 h-[120px] md:h-[160px] relative z-10 mt-8 md:mt-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
           {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="heroSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--accent-primary)"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#heroSparkline)"
                  animationDuration={2500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
           ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[var(--border)] rounded-3xl opacity-30">
               <span className="text-[var(--text-secondary)] text-sm uppercase tracking-widest font-bold">No History</span>
            </div>
           )}
        </div>
        
        {/* Soft Radial Backlight over Sparkline */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[var(--accent-primary)]/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-[var(--accent-primary)]/20 transition-colors duration-1000" />
      </div>
    </motion.div>
  );
}
