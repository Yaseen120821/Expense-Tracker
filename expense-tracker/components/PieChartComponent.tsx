"use client";

import { useMemo, useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Gradient definitions rather than solid colors
const GRADIENTS = [
  { id: "grad-0", from: "#4CAF50", to: "#8BC34A" }, // Green
  { id: "grad-1", from: "#FF9800", to: "#FFC107" }, // Orange
  { id: "grad-2", from: "#3B82F6", to: "#2DD4BF" }, // Blue/Teal
  { id: "grad-3", from: "#E91E63", to: "#F48FB1" }, // Pink
  { id: "grad-4", from: "#9C27B0", to: "#D500F9" }, // Purple
  { id: "grad-5", from: "#F44336", to: "#FF8A80" }, // Red
  { id: "grad-6", from: "#00BCD4", to: "#84FFFF" }, // Cyan
];

type DataItem = { name: string; value: number };

export function PieChartComponent({
  data,
  currency = "₹",
}: {
  data: DataItem[];
  currency?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [displayTotal, setDisplayTotal] = useState(0);

  const totalValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  // Animated Counter Effect
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s animation

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayTotal(totalValue * ease);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [totalValue]);

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border)] border-dashed rounded-[2rem]">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
          <p className="font-semibold text-sm tracking-wide">No expense data</p>
        </motion.div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const gradient = GRADIENTS[payload[0].name.length % GRADIENTS.length]; // Stable gradient assignment
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass px-5 py-4 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-w-[160px] border border-[var(--border)] relative overflow-hidden"
        >
          {/* Subtle glow behind tooltip */}
          <div className="absolute top-0 right-0 w-20 h-20 blur-2xl opacity-20 pointer-events-none" style={{ background: item.fill }} />
          
          <div className="flex items-center gap-2.5 mb-2 relative z-10">
            <div className="w-3.5 h-3.5 rounded-full shadow-inner border border-white/20" style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }} />
            <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">
              {item.name}
            </p>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tighter relative z-10">
            {currency}{item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <defs>
          <filter id={`glow-${fill.replace(/[^a-zA-Z0-9]/g, "")}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 12}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter={`url(#glow-${fill.replace(/[^a-zA-Z0-9]/g, "")})`}
          className="transition-all duration-300"
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 15}
          outerRadius={outerRadius + 22}
          fill={fill}
          opacity={0.2}
          className="transition-all duration-300"
        />
      </g>
    );
  };

  return (
    <div className="h-[350px] w-full relative">
      {/* Decorative Rotating Ring */}
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-[240px] h-[240px] rounded-full border border-[var(--border)] border-dashed opacity-30 pointer-events-none"
        style={{ marginTop: "-20px" }} // Align with cy="45%"
      />
      <motion.div 
        animate={{ rotate: -360 }} 
        transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-[280px] h-[280px] rounded-full border border-[var(--border)] opacity-10 pointer-events-none"
        style={{ marginTop: "-20px" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotate: -20 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, type: "spring", stiffness: 100, damping: 20 }}
        className="w-full h-full relative z-10"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {GRADIENTS.map((grad) => (
                <linearGradient key={grad.id} id={grad.id} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={grad.from} />
                  <stop offset="100%" stopColor={grad.to} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              {...({ activeIndex, activeShape: renderActiveShape } as any)}
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={75}
              outerRadius={105}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
              animationDuration={1500}
              animationEasing="ease-out"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              cornerRadius={6}
            >
              {data.map((entry, index) => {
                const gradientId = GRADIENTS[entry.name.length % GRADIENTS.length].id;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${gradientId})`}
                    className="hover:opacity-100 transition-all duration-300 cursor-pointer focus:outline-none drop-shadow-md"
                  />
                );
              })}
            </Pie>
            
            <Tooltip content={<CustomTooltip />} cursor={false} />
            
            {/* Custom Center Text */}
            <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="pointer-events-none">
              <tspan x="50%" dy="-12" fontSize="12" fill="var(--text-secondary)" fontWeight="800" letterSpacing="0.1em" className="uppercase">
                Total
              </tspan>
              <tspan x="50%" dy="26" fontSize="28" fill="var(--text-primary)" fontWeight="900" letterSpacing="-0.05em">
                {currency}{displayTotal >= 10000 ? (displayTotal / 1000).toFixed(1) + 'k' : displayTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </tspan>
            </text>

            <Legend
              verticalAlign="bottom"
              height={40}
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 700 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
