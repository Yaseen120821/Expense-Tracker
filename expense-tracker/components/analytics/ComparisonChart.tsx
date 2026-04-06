"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function ComparisonChart({ 
  data, 
  m1Label, 
  m2Label, 
  currency 
}: { 
  data: any[],
  m1Label: string,
  m2Label: string,
  currency: string
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-[var(--text-secondary)] rounded-3xl bg-[var(--bg-secondary)]/50 border border-dashed border-[var(--border)]">
        <span className="text-3xl mb-2">📊</span>
        <span className="font-medium">No common categories to compare.</span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--card-bg)] border border-[var(--border)] p-4 rounded-2xl shadow-xl min-w-[150px]">
          <p className="font-extrabold text-[var(--text-primary)] mb-3 pb-2 border-b border-[var(--border)]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center mt-1.5 gap-4">
              <span style={{ color: entry.color }} className="text-sm font-bold">
                {entry.name}
              </span>
              <span className="font-semibold text-[var(--text-primary)]">
                {currency}{entry.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis 
            dataKey="category" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--text-secondary)", fontWeight: 600 }}
            tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5, radius: 8 }} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "14px", fontWeight: 600, color: 'var(--text-primary)' }} />
          <Bar dataKey="month1" name={m1Label} fill="var(--accent-primary)" radius={[6, 6, 0, 0]} animationDuration={1500} barSize={24} />
          <Bar dataKey="month2" name={m2Label} fill="var(--highlight)" radius={[6, 6, 0, 0]} animationDuration={1500} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
