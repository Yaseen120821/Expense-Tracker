"use client";

import { useState, useRef, useEffect } from "react";
import { db, Expense, SavingsGoal } from "@/lib/instant";
import { useSettings } from "@/lib/useSettings";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Bot, User, BarChart4, Lightbulb, Activity } from "lucide-react";
import { StockWidget } from "@/components/insights/StockWidget";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const SUGGESTIONS = [
  { icon: <BarChart4 className="w-4 h-4" />, text: "Analyze my expenses" },
  { icon: <Lightbulb className="w-4 h-4" />, text: "How can I save money?" },
  { icon: <Activity className="w-4 h-4" />, text: "TSLA stock trend" },
  { icon: <Sparkles className="w-4 h-4" />, text: "Investing basics" },
];

export default function InsightsChatPage() {
  const { user } = db.useAuth();
  const { currency, monthlyBudget } = useSettings();

  const { data: expensesData } = db.useQuery(
    user ? { expenses: { $: { where: { userId: user.id } } } } : null
  );
  const { data: savingsData } = db.useQuery(
    user ? { savings: { $: { where: { userId: user.id } } } } : null
  );

  const expenses = (expensesData?.expenses || []) as Expense[];
  const savings = (savingsData?.savings || []) as SavingsGoal[];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "ai",
      content: "Hello! I am your AI Financial Advisor. How can I help you optimize your budget, track expenses, or explore market trends today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    let finalPayloadText = text;
    if (text.toLowerCase() === "analyze my expenses") {
      const summaryObj = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
      }, {} as Record<string, number>);
      
      finalPayloadText = `Analyze this user's expenses: ${JSON.stringify(summaryObj)}. Provide: 1. Spending summary 2. Top categories 3. Overspending warning 4. 3 saving tips`;
    }

    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = [...messages, { role: "user", content: finalPayloadText }];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            budget: monthlyBudget,
            currency,
            expenses,
            savings
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", content: data.text }
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "ai", content: "⚠️ Unable to generate response. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const stockRegex = /\[STOCK_WIDGET:\s*(\{.*?\})\]/g;
    const parts = content.split(stockRegex);

    return parts.map((part, index) => {
      if (part.trim().startsWith('{') && part.trim().endsWith('}')) {
        try {
          const stockData = JSON.parse(part);
          if (stockData.ticker && stockData.price && stockData.trend) {
            return <StockWidget key={`widget-${index}`} data={stockData} />;
          }
        } catch (e) {
        }
      }
      
      if (!part) return null;
      
      const formattedLines = part.split('\n').map((line, lIndex) => {
        const lineWithBold = line.split(/(\*{2}.*?\*{2})/g).map((chunk, cIndex) => {
          if (chunk.startsWith("**") && chunk.endsWith("**")) {
            return <strong key={`bold-${cIndex}`} className="font-extrabold text-[var(--text-primary)]">{chunk.slice(2, -2)}</strong>;
          }
          return chunk;
        });

        return (
          <span key={`line-${lIndex}`} className="block min-h-[1.5rem] tracking-wide">
            {lineWithBold}
          </span>
        );
      });

      return <div key={`text-${index}`} className="space-y-1">{formattedLines}</div>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] max-w-4xl mx-auto md:pt-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6 flex-shrink-0"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-secondary)]/20 to-transparent border border-[var(--accent-secondary)]/30 flex items-center justify-center shadow-[0_0_15px_rgba(255,152,0,0.15)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="w-6 h-6 text-[var(--accent-secondary)] group-hover:scale-110 transition-transform" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
            AI Advisor
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
            Financial intelligence powered by Gemini
          </p>
        </div>
      </motion.div>

      <div className="flex-1 glass rounded-[2rem] border border-[var(--border)] overflow-hidden flex flex-col relative shadow-sm">
        
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 custom-scrollbar scroll-smooth">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  msg.role === "user" 
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20" 
                    : "bg-[#1A1D24] text-[var(--accent-secondary)] border-[var(--border)]"
                }`}>
                  {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`max-w-[85%] md:max-w-[75%] px-5 py-4 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-[var(--accent-primary)] to-[#43a047] text-white rounded-tr-sm shadow-[0_4px_20px_rgba(76,175,80,0.2)]"
                    : "bg-[#1A1D24] border border-[var(--border)] text-[var(--text-secondary)] rounded-tl-sm"
                }`}>
                  <div className="text-[15px] leading-relaxed syntax-root">
                    {msg.role === "user" ? msg.content : renderMessageContent(msg.content)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 flex-row"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1A1D24] text-[var(--accent-secondary)] border border-[var(--border)] flex items-center justify-center shadow-sm flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="px-5 py-4 rounded-2xl bg-[#1A1D24] border border-[var(--border)] rounded-tl-sm flex items-center gap-1.5 h-[56px] shadow-sm">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                    className="w-2 h-2 bg-[var(--accent-secondary)] rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={endOfMessagesRef} className="h-4" />
        </div>

        <div className="p-4 md:p-6 bg-[#0F1115] border-t border-[var(--border)] relative z-10 w-full">
          {messages.length < 3 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="flex overflow-x-auto pb-4 gap-2 no-scrollbar px-1"
            >
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug.text)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1D24] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-secondary)]/50 transition-all whitespace-nowrap group shadow-sm flex-shrink-0"
                >
                  <span className="text-[var(--accent-secondary)] group-hover:scale-110 transition-transform">{sug.icon}</span>
                  {sug.text}
                </button>
              ))}
            </motion.div>
          )}

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-secondary)]/20 to-[var(--accent-primary)]/20 rounded-[1.25rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask anything about your finances..."
              disabled={loading}
              className="w-full bg-[#1A1D24] border border-[var(--border)] rounded-[1.25rem] pl-5 pr-14 py-4 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-secondary)]/50 focus:bg-[#1C2028] transition-all shadow-inner disabled:opacity-50 relative z-10"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-br from-[var(--accent-primary)] to-[#43a047] rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:grayscale transition-all hover:shadow-[0_4px_15px_rgba(76,175,80,0.3)] active:scale-95 z-20"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
          <div className="text-center mt-3">
             <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-widest opacity-60">AI can make mistakes. Verify important financial info.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
