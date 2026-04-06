"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function TrendChart({ data, currency }: { data: { date: string, amount: number }[], currency: string }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No data for trend chart.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-[var(--text-primary)] mb-1">{label}</p>
          <p className="text-[var(--accent-primary)] font-medium">
            {currency}{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.4 }} />
          <Bar 
            dataKey="amount" 
            fill="var(--accent-primary)" 
            radius={[4, 4, 0, 0]} 
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
