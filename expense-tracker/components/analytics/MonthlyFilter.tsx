"use client";

export function MonthlyFilter({
  months,
  selectedMonth,
  onChange,
  label = "Select Month"
}: {
  months: string[];
  selectedMonth: string;
  onChange: (month: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col mb-4">
      {label && <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{label}</label>}
      <select
        value={selectedMonth}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] w-full max-w-xs cursor-pointer shadow-sm"
      >
        {months.length === 0 && <option value="">No Data Available</option>}
        {months.map(m => {
          const [year, month] = m.split("-");
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
          return (
            <option key={m} value={m}>{monthName}</option>
          );
        })}
      </select>
    </div>
  );
}
