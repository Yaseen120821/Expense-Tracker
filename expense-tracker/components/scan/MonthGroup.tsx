"use client";

import { useMemo } from "react";
import { ReceiptCard } from "./ReceiptCard";

export function MonthGroup({ 
  monthPrefix, 
  receipts, 
  onOpenReceipt,
  currency 
}: { 
  monthPrefix: string, 
  receipts: any[],
  onOpenReceipt: (r: any) => void,
  currency: string
}) {
  const monthName = useMemo(() => {
    try {
      const [y, m] = monthPrefix.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    } catch {
      return monthPrefix;
    }
  }, [monthPrefix]);

  if (!receipts || receipts.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-4 mb-5">
        <h3 className="text-lg font-bold text-[var(--text-primary)] whitespace-nowrap">
          {monthName}
        </h3>
        <div className="h-px bg-[var(--border)] w-full flex-grow opacity-50" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {receipts.map(r => (
           <ReceiptCard key={r.id} receipt={r} onClick={() => onOpenReceipt(r)} currency={currency} />
        ))}
      </div>
    </div>
  );
}
