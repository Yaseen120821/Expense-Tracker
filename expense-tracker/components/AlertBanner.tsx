"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export function AlertBanner({ message }: { message: string }) {
  if (!message) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center mb-6"
    >
      <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}
