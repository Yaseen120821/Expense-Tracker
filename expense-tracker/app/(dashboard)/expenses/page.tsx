"use client";

import { useMemo, useState, useEffect } from "react";
import { db, Expense } from "@/lib/instant";
import { useSettings } from "@/lib/useSettings";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseCard } from "@/components/ExpenseCard";
import { MonthlyFilter } from "@/components/analytics/MonthlyFilter";
import { PieChartComponent } from "@/components/analytics/PieChartComponent";
import { TrendChart } from "@/components/analytics/TrendChart";
import { ComparisonChart } from "@/components/analytics/ComparisonChart";
import { ComparisonSummary } from "@/components/analytics/ComparisonSummary";
import { motion, Variants } from "framer-motion";

// Helper to get YYYY-MM
const getMonthString = (dateInput: string) => {
  return new Date(dateInput).toISOString().slice(0, 7);
};

export default function ExpensesPage() {
  const { user } = db.useAuth();
  const { currency } = useSettings();

  const { data: expensesData } = db.useQuery({
    expenses: {
      $: { where: { userId: user?.id || "" } }
    }
  });

  const allExpenses = expensesData?.expenses || [];

  // Derive unique months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allExpenses.forEach(exp => {
      const m = exp.month || getMonthString(exp.date);
      months.add(m);
    });
    // Sort descending
    return Array.from(months).sort().reverse();
  }, [allExpenses]);

  const [currentMonth, setCurrentMonth] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [compareMonth, setCompareMonth] = useState("");

  useEffect(() => {
    if (availableMonths.length > 0) {
      if (!currentMonth) setCurrentMonth(availableMonths[0]);
      if (!compareMonth && availableMonths.length > 1) {
        setCompareMonth(availableMonths[1]);
      }
    }
  }, [availableMonths, currentMonth, compareMonth]);

  // Derived datasets
  const monthData = useMemo(() => {
    const data = allExpenses.filter(e => (e.month || getMonthString(e.date)) === currentMonth);
    const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Pie data
    const catMap: Record<string, number> = {};
    // Trend data
    const dateMap: Record<string, number> = {};

    sorted.forEach(exp => {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
      
      const dayStr = exp.date.split("T")[0]; // YYYY-MM-DD
      const dayNum = parseInt(dayStr.split("-")[2], 10);
      const label = `Day ${dayNum}`;
      dateMap[label] = (dateMap[label] || 0) + exp.amount;
    });

    const pieData = Object.keys(catMap).map(name => ({ name, value: catMap[name] })).sort((a,b) => b.value - a.value);
    
    // Sorted trend data by day number
    const trendData = Object.keys(dateMap).map(date => ({ date, amount: dateMap[date] }))
      .sort((a,b) => {
         const dayA = parseInt(a.date.split(" ")[1], 10);
         const dayB = parseInt(b.date.split(" ")[1], 10);
         return dayA - dayB;
      });

    return { list: sorted, pieData, trendData };
  }, [allExpenses, currentMonth]);

  const monthCompareData = useMemo(() => {
    const data2 = allExpenses.filter(e => (e.month || getMonthString(e.date)) === compareMonth);
    const catMap2: Record<string, number> = {};
    data2.forEach(exp => {
      catMap2[exp.category] = (catMap2[exp.category] || 0) + exp.amount;
    });

    const catMap1: Record<string, number> = {};
    monthData.list.forEach(exp => {
      catMap1[exp.category] = (catMap1[exp.category] || 0) + exp.amount;
    });

    const allCategories = new Set([...Object.keys(catMap1), ...Object.keys(catMap2)]);
    const chartData: any[] = [];
    const summaryData: any[] = [];

    allCategories.forEach(cat => {
      const v1 = catMap1[cat] || 0;
      const v2 = catMap2[cat] || 0;
      chartData.push({
        category: cat,
        month1: v1,
        month2: v2
      });
      
      if (v2 > 0 || v1 > 0) {
        let diffPercent = 0;
        if (v2 === 0 && v1 > 0) {
            // v1 (currentMonth) relative to v2 (compareMonth) -> going from 0 to v1 is technically infinity
            diffPercent = 100; 
        } else if (v2 > 0) {
            diffPercent = ((v1 - v2) / v2) * 100;
        }
        
        summaryData.push({
            category: cat,
            month1: v1,
            month2: v2,
            diffPercent
        });
      }
    });

    return { chartData, summaryData: summaryData.sort((a,b) => b.diffPercent - a.diffPercent) };
  }, [allExpenses, compareMonth, monthData]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-center md:mt-2">
        <motion.h1 variants={itemVariants} className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Expenses
        </motion.h1>
        {availableMonths.length > 1 && (
          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsComparing(!isComparing)}
            className={`text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all border ${
              isComparing 
                ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]" 
                : "bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent-primary)]/50"
            }`}
          >
            {isComparing ? "Exit Comparison" : "Compare Months"}
          </motion.button>
        )}
      </div>

      <motion.div variants={itemVariants}>
        {user?.id && !isComparing && <ExpenseForm userId={user.id} />}
      </motion.div>

      {!isComparing ? (
        <>
          <motion.div variants={itemVariants} className="flex justify-between items-end mb-4">
             <MonthlyFilter 
               months={availableMonths} 
               selectedMonth={currentMonth} 
               onChange={setCurrentMonth} 
             />
          </motion.div>

          {monthData.list.length > 0 ? (
            <>
              {/* Analytics Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <motion.div variants={itemVariants} className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] mb-6">Category Breakdown</h3>
                  <PieChartComponent data={monthData.pieData} currency={currency} />
                </motion.div>
                <motion.div variants={itemVariants} className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] mb-6">Daily Trends</h3>
                  <TrendChart data={monthData.trendData} currency={currency} />
                </motion.div>
              </div>

              {/* Expense List */}
              <motion.div variants={itemVariants} className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm">
                <h3 className="font-bold text-xl tracking-tight text-[var(--text-primary)] mb-6 px-1">Log for {currentMonth}</h3>
                <div className="space-y-4">
                  {monthData.list.map((expense: Expense) => (
                    <ExpenseCard key={expense.id} expense={expense} currency={currency} />
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div variants={itemVariants} className="text-center p-12 bg-[var(--card-bg)] border border-[var(--border)] rounded-[2rem] text-[var(--text-secondary)] shadow-sm mt-6">
              <p className="text-4xl mb-4">💸</p>
              <p className="font-bold text-lg text-[var(--text-primary)]">No expenses this month</p>
              <p className="text-sm mt-1">Start tracking to see analytics.</p>
            </motion.div>
          )}
        </>
      ) : (
        /* Comparison View */
        <motion.div variants={itemVariants} className="bg-[var(--card-bg)] p-6 md:p-8 rounded-[2rem] border border-[var(--border)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MonthlyFilter 
              label="Month 1"
              months={availableMonths} 
              selectedMonth={currentMonth} 
              onChange={setCurrentMonth} 
            />
            <MonthlyFilter 
              label="Month 2"
              months={availableMonths.filter(m => m !== currentMonth)} 
              selectedMonth={compareMonth} 
              onChange={setCompareMonth} 
            />
          </div>

          <h3 className="font-bold text-xl text-[var(--text-primary)] mb-4 mt-8">Comparison View</h3>
          <ComparisonChart 
             data={monthCompareData.chartData} 
             m1Label={currentMonth} 
             m2Label={compareMonth} 
             currency={currency} 
          />

          <ComparisonSummary data={monthCompareData.summaryData} />
        </motion.div>
      )}
    </motion.div>
  );
}
