"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface StockWidgetProps {
  data: {
    ticker: string;
    price: number;
    trend: number[];
  };
}

export function StockWidget({ data }: StockWidgetProps) {
  if (!data || !data.ticker || !data.trend) return null;

  const currentPrice = data.price;
  const startPrice = data.trend[0];
  const isPositive = currentPrice >= startPrice;
  const percentChange = ((currentPrice - startPrice) / startPrice) * 100;

  // Format data for Recharts
  const chartData = data.trend.map((val, i) => ({
    day: `Day ${i + 1}`,
    value: val,
  }));

  const color = isPositive ? "#4CAF50" : "#F44336";
  const bgColor = isPositive ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="bg-[#1A1D24] border border-[var(--border)] rounded-2xl overflow-hidden mt-3 mb-2 max-w-sm shadow-sm"
    >
      <div className="p-4 flex justify-between items-start border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="font-black text-xs text-[var(--text-primary)] tracking-widest">{data.ticker.slice(0, 4)}</span>
            </div>
            <span className="font-extrabold text-[var(--text-primary)] text-lg tracking-tight">{data.ticker.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="font-black text-2xl text-[var(--text-primary)] flex items-center tabular-nums">
              <DollarSign className="w-5 h-5 text-[var(--text-secondary)] -mr-0.5" />
              {currentPrice.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div 
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs"
          style={{ 
            backgroundColor: bgColor, 
            borderColor: `${color}40`, 
            color: color 
          }}
        >
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? "+" : ""}{percentChange.toFixed(2)}%
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-32 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorBtn-${data.ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#1A1D24] border border-[var(--border)] p-2 rounded-lg shadow-xl text-xs font-bold text-[var(--text-primary)]">
                      ${Number(payload[0].value).toFixed(2)}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#colorBtn-${data.ticker})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] text-[9px] uppercase tracking-widest text-[var(--text-secondary)] font-bold text-center">
        Simulated AI Response (Not real-time)
      </div>
    </motion.div>
  );
}
