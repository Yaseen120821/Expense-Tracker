"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF6B6B', '#4ECDC4'];

export function PieChartComponent({ data, currency }: { data: { name: string, value: number }[], currency: string }) {
  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-[var(--text-secondary)]">No data for pie chart.</div>;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] p-3 rounded-xl shadow-lg">
          <p className="font-semibold text-[var(--text-primary)] mb-1">{`${payload[0].name}`}</p>
          <p className="text-[var(--text-secondary)]">{`${currency}${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationDuration={800}
            stroke="var(--bg-primary)"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
