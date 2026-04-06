"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Plus, X, ArrowRight, ShieldCheck, Check, AlertCircle, Edit2, Loader2, Sparkles, MessageSquareText } from "lucide-react";
import { db } from "@/lib/instant";

type ParsedData = {
  amount: number;
  type: "credit" | "debit";
  merchant: string;
  category?: string;
  hash: string;
};

export function SmsParser({ userId }: { userId: string }) {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [smsText, setSmsText] = useState("");
  const [status, setStatus] = useState<"idle" | "parsing" | "confirm" | "saved" | "error" | "duplicate">("idle");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editMerchant, setEditMerchant] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"credit" | "debit">("debit");

  useEffect(() => {
    const consent = localStorage.getItem("sms_consent");
    setHasConsent(consent === "true");
  }, []);

  const handleConsent = (agree: boolean) => {
    localStorage.setItem("sms_consent", agree ? "true" : "false");
    setHasConsent(agree);
  };

  const calculateHash = (amount: number, dateStr: string, merchant: string) => {
    const s = `${amount}-${dateStr}-${merchant}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return String(h);
  };

  const handleParse = async () => {
    if (!smsText.trim()) return;

    setStatus("parsing");
    setErrorMsg("");

    const text = smsText.toLowerCase();

    // 1. FILTERING: Skip OTPs and Personal logic
    if (text.includes("otp") || text.includes("one time") || text.includes("verification")) {
      setErrorMsg("This looks like an OTP message. We only process transactions.");
      setStatus("error");
      return;
    }

    const isTransaction = /(debited|credited|sent|paid|spent|withdrawn|received|txn|upi)/.test(text);
    if (!isTransaction) {
      setErrorMsg("No transaction keywords found. Please paste a valid bank or UPI SMS.");
      setStatus("error");
      return;
    }

    // 2. PARSE TYPE
    const isCredit = /(credited|received|refund)/.test(text) && !/(debited|spent|paid)/.test(text);
    const type = isCredit ? "credit" : "debit";

    // 3. PARSE AMOUNT
    // Matches rs, inr, ₹ followed by spaces/dots and numbers formatting
    const amtMatch = text.match(/(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)/);
    if (!amtMatch) {
      setErrorMsg("Could not detect the transaction amount automatically.");
      setStatus("error");
      return;
    }
    const amount = parseFloat(amtMatch[1].replace(/,/g, ""));

    // 4. PARSE MERCHANT
    let merchant = "Unknown";
    const toMatch = text.match(/to\s+([a-z0-9\s@]+?)(?:\s+(?:on|via|ref|upi|from|$))/i);
    const atMatch = text.match(/at\s+([a-z0-9\s@]+?)(?:\s+(?:on|via|ref|upi|from|$))/i);
    const fromMatch = text.match(/from\s+([a-z0-9\s@]+?)(?:\s+(?:on|via|ref|upi|to|$))/i);

    if (toMatch && toMatch[1]) merchant = toMatch[1].trim();
    else if (atMatch && atMatch[1]) merchant = atMatch[1].trim();
    else if (fromMatch && fromMatch[1]) merchant = fromMatch[1].trim();
    
    // Clean UP UPI handles
    merchant = merchant.split(' a/c')[0].trim();

    // 5. SECURITY & DEDUP
    const today = new Date().toISOString().split('T')[0];
    const hash = calculateHash(amount, today, merchant);
    
    const storedHashes = JSON.parse(localStorage.getItem("sms_hashes") || "[]");
    if (storedHashes.includes(hash)) {
       setStatus("duplicate");
       return;
    }

    // 6. AI CATEGORIZATION (Only sending clean data)
    try {
      const res = await fetch("/api/parse-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, merchant, type }),
      });

      if (!res.ok) throw new Error("AI parsing failed");
      const data = await res.json();

      setParsedData({
        amount,
        type,
        merchant,
        category: data.category || "General",
        hash
      });

      // Pre-fill edit mode state
      setEditAmount(String(amount));
      setEditMerchant(merchant);
      setEditCategory(data.category || "General");
      setEditType(type);

      setStatus("confirm");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const handleSave = async () => {
    if (!parsedData || !userId) return;

    const finalAmount = editMode ? parseFloat(editAmount) : parsedData.amount;
    const finalMerchant = editMode ? editMerchant : parsedData.merchant;
    const finalCategory = editMode ? editCategory : parsedData.category;
    const finalType = editMode ? editType : parsedData.type;

    const expenseId = crypto.randomUUID();
    
    // Convert credit to negative, or assume all goes to expenses table.
    // Following typical patterns: we track expenses mostly. Income might be negative expense
    // or tracked in a separate column. Assuming 'expenses' collection handles both via 'amount' signs.
    // Usually: debit = positive expense, credit = positive income / negative expense.
    // Let's store absolute amount and clearly define receipt.
    const isIncome = finalType === "credit";

    await db.transact([
      db.tx.expenses[expenseId].update({
        userId,
        amount: finalAmount,
        title: finalMerchant.charAt(0).toUpperCase() + finalMerchant.slice(1),
        category: finalCategory || "General",
        merchant: finalMerchant,
        date: new Date().toISOString(),
        paymentMethod: "UPI/Bank",
        receiptUrl: null,
        notes: `Auto-generated via SMS Paste. Type: ${finalType.toUpperCase()}`,
        // Using negative to denote income if it's stored in tracking
        isIncome: isIncome
      }),
    ]);

    // Save hash to avoid duplicates
    const storedHashes = JSON.parse(localStorage.getItem("sms_hashes") || "[]");
    localStorage.setItem("sms_hashes", JSON.stringify([...storedHashes, parsedData.hash]));

    setStatus("saved");
    setSmsText("");
    setParsedData(null);
    setEditMode(false);
    
    setTimeout(() => {
      setStatus("idle");
    }, 3000);
  };

  const handleIgnore = () => {
    setSmsText("");
    setParsedData(null);
    setEditMode(false);
    setStatus("idle");
  };

  // --- CONSENT SCREEN ---
  if (hasConsent === null) return null; // loading from localstorage

  if (hasConsent === false) {
    return (
      <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-[var(--border)] text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[var(--accent-secondary)]/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mb-3">
          Enable Smart Tracker
        </h2>
        
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8 max-w-sm mx-auto font-medium">
          Paste your bank or UPI transaction messages. Our AI instantly extracts the amount, merchant, and category. <br /><br />
          <span className="text-[var(--text-primary)] font-semibold">We only analyze the texts you paste. We do not access your SMS inbox.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => handleConsent(true)}
            className="px-8 py-3.5 bg-[var(--accent-primary)] text-white hover:bg-[#388E3C] transition-colors rounded-2xl font-bold shadow-lg shadow-[var(--accent-primary)]/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Enable Feature
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN PARSER UI ---
  return (
    <div className="glass p-5 md:p-8 rounded-[2rem]">
      
      {/* Idle / Input state */}
      <AnimatePresence mode="wait">
        {(status === "idle" || status === "error" || status === "duplicate") && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border)]">
                <MessageSquareText className="w-5 h-5 text-[var(--text-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Paste Transaction SMS</h3>
            </div>

            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder="e.g. 'Rs 250.00 debited from a/c XXXXXX on 14-Aug to Swiggy'"
              className="w-full h-32 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl p-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all resize-none shadow-inner"
            />
            
            {status === "error" && (
              <div className="mt-3 flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {status === "duplicate" && (
              <div className="mt-3 flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                This message was already processed recently!
              </div>
            )}

            <button
              onClick={handleParse}
              disabled={!smsText.trim()}
              className="mt-4 w-full sm:w-auto px-8 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--text-secondary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              Parse Transaction <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Loading state */}
        {status === "parsing" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-primary)] mb-4" />
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Analyzing SMS...</h3>
            <p className="text-[var(--text-secondary)] text-sm font-medium">Running secure local extraction</p>
          </motion.div>
        )}

        {/* Success / Save check state */}
        {status === "saved" && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-12 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Saved Successfully!</h3>
            <p className="text-[var(--text-secondary)] text-sm font-medium">Transaction logged to your account.</p>
          </motion.div>
        )}

        {/* Confirmation Card */}
        {status === "confirm" && parsedData && (
           <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-amber-400" /> Discovered Transaction
               </h3>
               
               <button onClick={() => setEditMode(!editMode)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 text-sm font-medium transition-colors bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                 <Edit2 className="w-3.5 h-3.5" />
                 {editMode ? "Cancel Edit" : "Edit"}
               </button>
            </div>

            <div className="bg-[var(--bg-primary)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
              {!editMode ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase mb-2 border ${parsedData.type === 'debit' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                        {parsedData.type}
                      </span>
                      <h4 className="text-2xl font-black text-[var(--text-primary)]">{parsedData.merchant}</h4>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${parsedData.type === 'debit' ? 'text-[var(--text-primary)]' : 'text-emerald-500'}`}>
                        {parsedData.type === 'debit' ? '-' : '+'}₹{parsedData.amount}
                      </div>
                      <div className="text-[var(--text-secondary)] text-sm font-medium mt-1">{parsedData.category}</div>
                    </div>
                  </div>
                </>
              ) : (
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Amount</label>
                      <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Merchant</label>
                      <input type="text" value={editMerchant} onChange={(e) => setEditMerchant(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Category</label>
                      <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Type</label>
                      <select value={editType} onChange={(e) => setEditType(e.target.value as any)} className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none">
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                 </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--text-secondary)] transition-all rounded-xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" /> {editMode ? "Save Changes" : "Confirm & Log"}
              </button>
              <button
                onClick={handleIgnore}
                className="px-5 py-3.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all rounded-xl font-bold border border-[var(--border)]"
              >
                Ignore
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
