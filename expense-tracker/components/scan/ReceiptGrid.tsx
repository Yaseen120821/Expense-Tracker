"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "./SearchBar";
import { MonthGroup } from "./MonthGroup";
import { ReceiptModal } from "./ReceiptModal";
import { db } from "@/lib/instant";
import { useSettings } from "@/lib/useSettings";

export function ReceiptGrid({ receipts }: { receipts: any[] }) {
  const { currency } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredReceipts = useMemo(() => {
    if (!searchTerm) return receipts;
    const lower = searchTerm.toLowerCase();
    return receipts.filter(r => {
      return (r.title && r.title.toLowerCase().includes(lower)) ||
             (r.merchant && r.merchant.toLowerCase().includes(lower)) ||
             (r.category && r.category.toLowerCase().includes(lower));
    });
  }, [receipts, searchTerm]);

  // Group by YYYY-MM
  const groupedByMonth = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredReceipts.forEach(r => {
      // Ensure month string exists
      const monthStr = r.month || (r.date ? new Date(r.date).toISOString().slice(0, 7) : new Date().toISOString().slice(0, 7));
      if (!map.has(monthStr)) {
        map.set(monthStr, []);
      }
      map.get(monthStr)!.push(r);
    });

    // Sort entries descending
    const sortedEntries = Array.from(map.entries()).sort((a,b) => b[0].localeCompare(a[0]));
    
    // Sort items within each entry by date descending
    sortedEntries.forEach(entry => {
       entry[1].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return sortedEntries;
  }, [filteredReceipts]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await db.transact([
        db.tx.receipts[id].delete()
      ]);
      setSelectedReceipt(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full">
      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      {groupedByMonth.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded-3xl border border-[var(--border)] shadow-sm">
           <h3 className="font-medium text-lg mb-2">No Receipts Found</h3>
           <p className="text-sm">Try scanning a new receipt or clear your search term.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByMonth.map(([month, items]) => (
            <MonthGroup 
              key={month} 
              monthPrefix={month} 
              receipts={items} 
              onOpenReceipt={setSelectedReceipt} 
              currency={currency}
            />
          ))}
        </div>
      )}

      {selectedReceipt && (
        <ReceiptModal 
          receipt={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)}
          onDelete={handleDelete}
          isDeleting={deletingId === selectedReceipt.id}
          currency={currency}
        />
      )}
    </div>
  );
}
