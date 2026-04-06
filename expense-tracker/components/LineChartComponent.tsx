"use client";

import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { Expense } from "@/lib/instant";

type TimeRange = "Daily" | "Weekly" | "Monthly";

export function LineChartComponent({
  expenses,
  currency = "₹",
}: {
  expenses: Expense[];
  currency?: string;
}) {
  const [timeRange, setRange] = useState<TimeRange>("Daily");

  // Aggregate Data based on selected toggle
  const chartData = useMemo(() => {
    if (!expenses.length) return [];
    
    // Sort oldest to newest
    const sorted = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const aggregated = sorted.reduce((acc, curr) => {
      const d = new Date(curr.date);
      let key = "";
      
      if (timeRange === "Daily") {
        key = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      } else if (timeRange === "Weekly") {
        // Simple week grouping: find start of week
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        key = `Week of ${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
      } else {
        key = d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
      }
      
      acc[key] = (acc[key] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(aggregated).map((key) => ({ date: key, amount: aggregated[key] }));
  }, [expenses, timeRange]);

  if (!expenses || expenses.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] border-dashed rounded-[2rem]">
        <p className="font-semibold text-sm tracking-wide">No spending data</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass px-5 py-4 rounded-2xl min-w-[160px]">
          <p className="text-[11px] font-black uppercase tracking-widest text-[var(--accent-secondary)] mb-1.5">
            {label}
          </p>
          <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter drop-shadow-md">
            {currency}{payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="h-[350px] w-full relative flex flex-col"
    >
      <div className="absolute top-0 right-0 z-10 hidden sm:flex bg-[#111318]/50 backdrop-blur-md p-1 rounded-full border border-[var(--border)] shadow-sm">
        {(["Daily", "Weekly", "Monthly"] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
              timeRange === r 
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md translate-y-[-1px]" 
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="flex-1 mt-4 sm:mt-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="premiumGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="var(--border)" 
              strokeOpacity={0.5} 
            />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 700 }}
              dy={15}
              minTickGap={30}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--text-secondary)", fontWeight: 700 }}
              tickFormatter={(value) => `${currency}${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              dx={-10}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: "4 4" }} 
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--accent-primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#premiumGlow)"
              activeDot={{ r: 6, fill: "var(--bg-primary)", stroke: "var(--accent-primary)", strokeWidth: 3 }}
              animationDuration={2000}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Mobile Toggles */}
      <div className="flex sm:hidden justify-center items-center mt-4 bg-[#111318]/50 backdrop-blur-md p-1 rounded-full border border-[var(--border)] shadow-sm">
        {(["Daily", "Weekly", "Monthly"] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 px-3 py-2 text-xs font-bold rounded-full transition-all duration-300 ${
              timeRange === r 
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md" 
                : "text-[var(--text-secondary)]"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
