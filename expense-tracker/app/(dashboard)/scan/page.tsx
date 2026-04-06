"use client";

import { useState } from "react";
import { db } from "@/lib/instant";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { ReceiptGrid } from "@/components/scan/ReceiptGrid";
import { SmsParser } from "@/components/scan/SmsParser";
import { motion } from "framer-motion";
import { ScanLine, MessageSquareText } from "lucide-react";

export default function ScanPage() {
  const { user } = db.useAuth();
  const [activeTab, setActiveTab] = useState<"receipt" | "sms">("receipt");

  const { data: receiptsData } = db.useQuery({
    receipts: {
      $: { where: { userId: user?.id || "" } },
    },
  });

  const allReceipts = receiptsData?.receipts || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-2xl mx-auto pb-24"
    >
      {/* ── Page Header ── */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 md:mt-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-transparent border border-[var(--accent-primary)]/25 flex items-center justify-center text-[var(--accent-primary)] flex-shrink-0">
          {activeTab === "receipt" ? <ScanLine className="w-6 h-6" /> : <MessageSquareText className="w-6 h-6" />}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
            {activeTab === "receipt" ? "Scan Receipt" : "Paste SMS"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
            AI-powered extraction · automatic categorization
          </p>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div variants={itemVariants} className="flex p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full">
        <button
          onClick={() => setActiveTab("receipt")}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "receipt"
              ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
          }`}
        >
          <ScanLine className="w-4 h-4" /> Receipt
        </button>
        <button
          onClick={() => setActiveTab("sms")}
          className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "sms"
              ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
          }`}
        >
          <MessageSquareText className="w-4 h-4" /> SMS parsing
        </button>
      </motion.div>

      {/* ── Content Area ── */}
      <motion.div variants={itemVariants}>
        {activeTab === "receipt" ? (
          user?.id && <ReceiptScanner userId={user.id} />
        ) : (
          user?.id && <SmsParser userId={user.id} />
        )}
      </motion.div>

      {/* ── Receipt History (Only show for receipt tab conceptually) ── */}
      {activeTab === "receipt" && (
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Receipt History
            </h2>
            {allReceipts.length > 0 && (
              <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--border)] px-3 py-1.5 rounded-xl">
                {allReceipts.length} receipt{allReceipts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <ReceiptGrid receipts={allReceipts} />
        </motion.div>
      )}
    </motion.div>
  );
}
