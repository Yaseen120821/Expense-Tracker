"use client";

import { MapPin, Calendar, Tag, Image as ImageIcon } from "lucide-react";

export function ReceiptCard({ receipt, onClick, currency }: { receipt: any, onClick: () => void, currency: string }) {
  // Format the date assuming ISO string
  const displayDate = new Date(receipt.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div 
      onClick={onClick}
      className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-[var(--accent-primary)]/40 group flex flex-col h-full transform hover:-translate-y-1"
    >
      <div className="h-36 bg-[var(--bg-secondary)] relative border-b border-[var(--border)] overflow-hidden">
        {receipt.imageUrl && receipt.imageUrl !== "ocr_scanned" ? (
          <>
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent z-10 transition-colors" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={receipt.imageUrl} 
              alt={receipt.title || receipt.merchant} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)]">
            <div className="bg-[var(--bg-primary)] p-3 rounded-2xl shadow-sm border border-[var(--border)] mb-2 group-hover:scale-110 transition-transform">
               <ImageIcon className="w-6 h-6 opacity-60" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-70">No Image</span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 bg-[var(--card-bg)]">
        <div className="flex justify-between items-start mb-4">
          <h4 className="font-extrabold text-lg text-[var(--text-primary)] line-clamp-1 flex-1 pr-3" title={receipt.title}>
            {receipt.title || receipt.merchant}
          </h4>
          <span className="font-black text-lg text-[var(--text-primary)] tracking-tight">
            {currency}{(receipt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        
        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-xs font-medium text-[var(--text-secondary)]">
            <MapPin className="w-4 h-4 mr-2 opacity-60 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors" />
            <span className="truncate">{receipt.merchant}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs font-semibold text-[var(--text-secondary)]">
              <Calendar className="w-4 h-4 mr-2 opacity-60 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors" />
              <span>{displayDate}</span>
            </div>
            <div className="flex items-center text-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)] font-extrabold uppercase tracking-wider">
              <Tag className="w-3 h-3 mr-1 opacity-70" />
              <span className="truncate max-w-[80px]">{receipt.category}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
