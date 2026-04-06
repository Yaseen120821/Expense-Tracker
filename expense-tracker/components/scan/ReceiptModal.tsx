"use client";

import { X, Trash2, Loader2, MapPin, Calendar, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ReceiptModal({ 
  receipt, 
  onClose, 
  onDelete, 
  currency,
  isDeleting = false
}: { 
  receipt: any, 
  onClose: () => void, 
  onDelete: (id: string) => void,
  currency: string,
  isDeleting?: boolean
}) {
  if (!receipt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[var(--card-bg)] rounded-[2rem] w-full max-w-xl overflow-hidden border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-5 md:p-6 border-b border-[var(--border)] font-semibold text-[var(--text-primary)] relative shrink-0">
            <h3 className="text-xl font-extrabold line-clamp-1 pr-8 text-[var(--text-primary)] tracking-tight">
              {receipt.title || receipt.merchant}
            </h3>
            <button 
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--text-primary)] transition-all absolute right-5 md:right-6"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto w-full p-6 md:p-8 flex flex-col space-y-8 flex-1 custom-scrollbar">
            {receipt.imageUrl && receipt.imageUrl !== "ocr_scanned" && (
              <div className="w-full bg-[var(--bg-secondary)] rounded-3xl overflow-hidden border border-[var(--border)] flex justify-center items-center p-2 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={receipt.imageUrl} 
                  alt="Scan Preview" 
                  className="max-h-[350px] w-auto object-contain rounded-2xl"
                />
              </div>
            )}

            <div className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border)] space-y-5 shadow-sm">
              <h4 className="font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border)] pb-3 mb-4">
                Transaction Details
              </h4>
              
              <div className="flex justify-between items-center group">
                <span className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
                   <Tag className="w-4 h-4 opacity-50" /> Amount
                </span>
                <span className="font-extrabold text-2xl text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {currency}{(receipt.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
                   <MapPin className="w-4 h-4 opacity-50" /> Merchant
                </span>
                <span className="font-bold text-[var(--text-primary)]">{receipt.merchant}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
                   <Tag className="w-4 h-4 opacity-50" /> Category
                </span>
                <span className="font-bold px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border)] shadow-sm rounded-xl text-[var(--accent-primary)] text-xs uppercase tracking-wider">
                  {receipt.category}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] font-medium text-sm flex items-center gap-2">
                   <Calendar className="w-4 h-4 opacity-50" /> Date
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {new Date(receipt.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6 border-t border-[var(--border)] flex justify-end gap-4 shrink-0 bg-[var(--bg-primary)]/50">
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-2xl font-bold text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--border)] transition-all shadow-sm flex-1 md:flex-none"
            >
              Close Viewer
            </button>
            <button 
              disabled={isDeleting}
              onClick={() => {
                if (confirm("Are you sure you want to delete this receipt permanently?")) {
                  onDelete(receipt.id);
                }
              }}
              className="px-6 py-3 rounded-2xl font-bold text-sm bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border dark:border-red-500/30 transition-all flex items-center justify-center min-w-[140px] shadow-sm flex-1 md:flex-none disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Receipt
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
