"use client";

import { useState } from "react";
import { Loader2, Lightbulb, RefreshCw, AlertCircle, Wifi, Sparkles, TrendingUp } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-6 bg-white/5 rounded-full w-1/3 animate-pulse" />
      <div className="space-y-3">
         <div className="h-4 bg-white/5 rounded-full w-full animate-pulse" />
         <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
         <div className="h-4 bg-white/5 rounded-full w-4/6 animate-pulse" />
      </div>
      <div className="h-24 bg-white/5 rounded-2xl w-full animate-pulse" />
    </div>
  );
}

export function InsightsPanel({ userId }: { userId: string }) {
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiUnavailable, setIsAiUnavailable] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    setIsAiUnavailable(false);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (data.insight) {
        setInsight(data.insight);
        if (!data.success) setIsAiUnavailable(true);
      } else {
        throw new Error(data.error || "Failed to generate insights");
      }
    } catch (err: any) {
      setError("Unable to generate AI insights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 15 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <div className="glass p-6 md:p-8 rounded-[2rem] relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--accent-secondary)]/10 to-transparent rounded-bl-full pointer-events-none mix-blend-screen" />
      
      <div className="flex justify-between items-center mb-6 relative z-10 flex-shrink-0">
        <h3 className="font-extrabold text-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-secondary)]/10 flex items-center justify-center border border-[var(--accent-secondary)]/20 shadow-[0_0_15px_rgba(255,152,0,0.15)]">
             <Sparkles className="w-5 h-5 text-[var(--accent-secondary)]" />
          </div>
          <span className="text-[var(--text-primary)]">AI Insights</span>
        </h3>
        {insight && (
          <button
            onClick={generateInsights}
            disabled={loading}
            className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-white bg-[#2A2F3A] hover:bg-[#323845] border border-[var(--border)] px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-secondary)]" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden md:inline">Regen</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {!insight && !loading && !error && (
          <div className="text-center py-10 my-auto flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-[var(--accent-secondary)]/5 rounded-[2rem] flex items-center justify-center mb-6 border border-[var(--accent-secondary)]/10 group-hover:scale-110 transition-transform duration-500 shadow-inner">
               <Lightbulb className="w-10 h-10 text-[var(--accent-secondary)]" />
            </div>
            <p className="font-black text-xl text-[var(--text-primary)] mb-2 tracking-tight">Financial Intelligence</p>
            <p className="text-sm font-medium mb-8 max-w-xs mx-auto text-[var(--text-secondary)]">
              Unlock personalized strategies, anomaly detection, and savings opportunities.
            </p>
            <button
              onClick={generateInsights}
              className="bg-gradient-to-r from-[#FF9800] to-[#E65100] text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,152,0,0.4)] active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Analyze Finances
            </button>
          </div>
        )}

        {loading && (
          <div className="py-10">
            <Skeleton />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-10">
            <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start gap-4 text-sm mb-6 inline-flex text-left">
              <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <p className="font-medium leading-relaxed">{error}</p>
            </div>
            <br />
            <button
              onClick={generateInsights}
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent-secondary)] hover:text-[#FFB74D] transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {insight && !loading && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              
              {isAiUnavailable && (
                <motion.div variants={itemVariants} className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl">
                  <Wifi className="w-5 h-5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Offline Mode</span>
                    <span className="text-xs font-medium opacity-80">Showing fallback statistical tips.</span>
                  </div>
                </motion.div>
              )}

              {insight.warning && (
                <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  <AlertCircle className="w-6 h-6 flex-shrink-0 opacity-80 mt-1" />
                  <div>
                    <p className="font-black text-[10px] uppercase tracking-widest opacity-70 mb-1">Risk Detected</p>
                    <p className="font-medium text-sm leading-relaxed">{insight.warning}</p>
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="bg-[#1C2028] border border-[var(--border)] p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-[var(--accent-primary)]/10 blur-2xl" />
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-[var(--accent-primary)]">Executive Summary</h4>
                </div>
                <div className="text-[var(--text-primary)] font-medium text-sm leading-relaxed relative z-10">
                  {insight.summary}
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-4 pl-1">
                  <Lightbulb className="w-4 h-4 text-[var(--accent-secondary)]" />
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-[var(--accent-secondary)]">Strategic Action Plan</h4>
                </div>
                <div className="space-y-3">
                  {(insight.tips || []).map((tip: string, idx: number) => (
                    <motion.div 
                      variants={itemVariants}
                      key={idx} 
                      className="flex gap-4 p-4 bg-[#181B22] border border-[var(--border)] rounded-2xl shadow-sm hover:border-[var(--accent-secondary)]/30 transition-colors group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] flex items-center justify-center flex-shrink-0 font-black text-[10px] border border-[var(--accent-secondary)]/20 shadow-inner group-hover:scale-110 transition-transform">
                        0{idx + 1}
                      </div>
                      <p className="font-medium text-[13px] leading-relaxed text-[var(--text-primary)] pt-0.5">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
