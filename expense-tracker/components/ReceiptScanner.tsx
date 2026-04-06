"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Loader2,
  CheckCircle2,
  UploadCloud,
  FileImage,
  X,
  RotateCcw,
  Sparkles,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/instant";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "select" | "preview" | "processing" | "success" | "error";

export function ReceiptScanner({ userId }: { userId: string }) {
  const [isMobile, setIsMobile] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // ── Device Detection (client-only) ──
  useEffect(() => {
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
  }, []);

  // ── File Handling ──
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (PNG, JPG, WEBP).");
      setStage("error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image is too large. Please select an image under 10MB.");
      setStage("error");
      return;
    }

    // Simulate progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + 15;
      });
    }, 80);

    const reader = new FileReader();
    reader.onloadend = () => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setImagePreview(reader.result as string);
        setStage("preview");
        setResult(null);
        setErrorMsg(null);
        setUploadProgress(0);
      }, 300);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setImagePreview(null);
    setStage("select");
    setResult(null);
    setErrorMsg(null);
    setUploadProgress(0);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  // ── AI Processing ──
  const processReceipt = async () => {
    if (!imagePreview) return;
    setStage("processing");
    setErrorMsg(null);

    try {
      const base64Data = imagePreview.split(",")[1];
      const mimeTypeMatch = imagePreview.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "OCR failed");

      const parsedData = json.data;
      setResult(parsedData);

      const finalAmount = parseFloat(parsedData.amount) || 0;
      const finalMerchant = parsedData.merchant || "Unknown";
      const finalCategory = parsedData.category || "Others";
      const finalDate = parsedData.date
        ? new Date(parsedData.date).toISOString()
        : new Date().toISOString();
      const finalMonth = finalDate.slice(0, 7);
      const finalTitle =
        parsedData.title ||
        `${finalMerchant}-${finalDate.split("T")[0]}-${finalCategory}`;

      const expenseId = crypto.randomUUID();
      await db.transact([
        db.tx.expenses[expenseId].update({
          userId,
          amount: finalAmount,
          merchant: finalMerchant,
          category: finalCategory,
          date: finalDate,
          month: finalMonth,
          createdAt: new Date().toISOString(),
        }),
        db.tx.receipts[crypto.randomUUID()].update({
          userId,
          imageUrl: imagePreview,
          extractedText: JSON.stringify(parsedData),
          amount: finalAmount,
          merchant: finalMerchant,
          category: finalCategory,
          date: finalDate,
          month: finalMonth,
          title: finalTitle,
          processed: true,
          createdAt: new Date().toISOString(),
        }),
      ]);

      setStage("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process receipt. Please try again.");
      setStage("error");
    }
  };

  return (
    <div className="glass rounded-[2rem] border border-[var(--border)] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10 border border-[var(--accent-primary)]/25 flex items-center justify-center text-[var(--accent-primary)]">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight leading-none">
            Scan Receipt
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            {isMobile ? "Take a photo or upload an image" : "Upload or drag & drop a receipt image"}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          {/* ────────────────────────────────────────
              STAGE: SELECT
          ──────────────────────────────────────── */}
          {stage === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              {isMobile ? (
                /* ── MOBILE: Two-button layout ── */
                <div className="flex flex-col gap-4">
                  {/* Camera Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-6 rounded-[1.5rem] bg-gradient-to-br from-[var(--accent-primary)]/20 via-[var(--accent-primary)]/10 to-transparent border border-[var(--accent-primary)]/30 flex flex-col items-center gap-3 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 flex items-center justify-center relative z-10">
                      <Camera className="w-8 h-8 text-[var(--accent-primary)]" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="font-extrabold text-[var(--text-primary)] text-lg tracking-tight">Take Photo</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">Open camera & capture receipt</p>
                    </div>
                  </motion.button>

                  {/* Upload Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => uploadInputRef.current?.click()}
                    className="w-full py-5 rounded-[1.5rem] bg-[#1A1D24] border border-[var(--border)] flex items-center justify-center gap-4 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                      <ImagePlus className="w-6 h-6 text-[var(--text-secondary)]" />
                    </div>
                    <div className="text-left relative z-10">
                      <p className="font-extrabold text-[var(--text-primary)] tracking-tight">Upload Image</p>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">From your gallery</p>
                    </div>
                  </motion.button>

                  {/* Hidden inputs */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              ) : (
                /* ── DESKTOP: Drag & Drop ── */
                <div>
                  <motion.div
                    animate={{
                      borderColor: isDragging ? "var(--accent-primary)" : "var(--border)",
                      backgroundColor: isDragging ? "rgba(76,175,80,0.05)" : "transparent",
                    }}
                    transition={{ duration: 0.2 }}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onClick={() => uploadInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed rounded-[1.75rem] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all"
                  >
                    {/* Animated background grid */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

                    <motion.div
                      animate={isDragging ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="flex flex-col items-center gap-3 relative z-10"
                    >
                      <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center border transition-all duration-300 ${isDragging ? "bg-[var(--accent-primary)]/20 border-[var(--accent-primary)]/40" : "bg-white/5 border-white/10 group-hover:bg-white/8 group-hover:border-white/20"}`}>
                        <UploadCloud className={`w-9 h-9 transition-colors duration-300 ${isDragging ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-extrabold text-[var(--text-primary)] text-lg tracking-tight">
                          {isDragging ? "Drop it here!" : "Drop receipt or click to upload"}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                          PNG, JPG, WEBP · Max 10MB
                        </p>
                      </div>
                    </motion.div>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </motion.div>

                  {/* Upload Progress (when loading file) */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
                        <span>Loading image…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0F1115] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* ────────────────────────────────────────
              STAGE: ERROR
          ──────────────────────────────────────── */}
          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <p className="font-extrabold text-[var(--text-primary)] text-lg">Something went wrong</p>
                <p className="text-sm text-red-400 mt-1 font-medium max-w-xs mx-auto">{errorMsg}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1A1D24] border border-[var(--border)] font-bold text-[var(--text-primary)] text-sm hover:border-white/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </motion.button>
            </motion.div>
          )}

          {/* ────────────────────────────────────────
              STAGE: PREVIEW
          ──────────────────────────────────────── */}
          {stage === "preview" && imagePreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="space-y-5"
            >
              {/* Image Preview Card */}
              <div className="relative w-full rounded-[1.75rem] overflow-hidden border border-[var(--border)] bg-[#0F1115] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full max-h-80 object-contain"
                />
                {/* Retake overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={reset}
                    className="bg-white/15 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-white/25 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" /> Retake / Change
                  </button>
                </div>
              </div>

              {/* Caption */}
              <p className="text-xs text-center text-[var(--text-secondary)] font-medium">
                Hover image to change · Ready to extract data with AI
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="flex-1 py-4 rounded-2xl bg-[#1A1D24] border border-[var(--border)] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-white/30 transition-all flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={processReceipt}
                  className="flex-[2] py-4 rounded-2xl font-extrabold text-white flex items-center justify-center gap-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[#43a047] hover:from-[#43a047] hover:to-[var(--accent-primary)] shadow-[0_6px_24px_rgba(76,175,80,0.3)] transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Process with AI
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────
              STAGE: PROCESSING
          ──────────────────────────────────────── */}
          {stage === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-14 flex flex-col items-center gap-6"
            >
              {/* Animated spinner + glow */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-[var(--accent-primary)]/20 blur-xl animate-pulse" />
                <div className="w-20 h-20 rounded-full border-4 border-[var(--border)] border-t-[var(--accent-primary)] animate-spin relative z-10" />
                <Sparkles className="absolute inset-0 m-auto w-7 h-7 text-[var(--accent-primary)] z-20" />
              </div>
              <div className="text-center">
                <p className="font-extrabold text-[var(--text-primary)] text-xl tracking-tight">
                  Extracting Data…
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
                  Gemini AI is scanning your receipt
                </p>
              </div>
              {/* Animated pulsing dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2, ease: "easeInOut" }}
                    className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────
              STAGE: SUCCESS
          ──────────────────────────────────────── */}
          {stage === "success" && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="space-y-5"
            >
              {/* Success Header */}
              <div className="flex flex-col items-center gap-3 py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#43a047] flex items-center justify-center shadow-[0_8px_32px_rgba(76,175,80,0.4)]"
                >
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="font-extrabold text-xl text-[var(--text-primary)] tracking-tight">Receipt Added!</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">Your expense has been tracked automatically</p>
                </div>
              </div>

              {/* Extracted Data Card */}
              <div className="glass rounded-2xl overflow-hidden border border-[var(--accent-primary)]/20">
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--accent-primary)]/5">
                  <p className="text-xs font-black uppercase tracking-widest text-[var(--accent-primary)]">Extracted Details</p>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {[
                    { label: "Merchant", value: result.merchant || "—" },
                    { label: "Amount", value: `₹${(parseFloat(result.amount) || 0).toLocaleString()}`, bold: true },
                    { label: "Date", value: result.date ? new Date(result.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—" },
                    { label: "Category", value: result.category || "Others", badge: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-5 py-3.5">
                      <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">{row.label}</span>
                      {row.badge ? (
                        <span className="text-xs font-black uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-3 py-1 rounded-lg">
                          {row.value}
                        </span>
                      ) : (
                        <span className={`text-[var(--text-primary)] ${row.bold ? "font-black text-xl tabular-nums" : "font-bold"}`}>{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scan Another */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={reset}
                className="w-full py-4 rounded-2xl border border-[var(--border)] font-extrabold text-[var(--text-primary)] text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
              >
                <Camera className="w-4 h-4" /> Scan Another Receipt
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
