"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/instant";

type Tab = "login" | "signup";
type SignupStep = "form" | "otp";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  // Shared state
  const [tab, setTab] = useState<Tab>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupStep, setSignupStep] = useState<SignupStep>("form");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) router.replace("/dashboard");
  }, [user, authLoading, router]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const resetSignup = () => {
    setSignupStep("form");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setCountdown(0);
  };

  const switchTab = (newTab: Tab) => {
    setTab(newTab);
    setError("");
    resetSignup();
  };

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic navigation: go to dashboard immediately, then sign in.
      // The dashboard layout shows a spinner while InstantDB resolves,
      // which is much faster than blocking here on signInWithToken.
      router.replace("/dashboard");
      db.auth.signInWithToken(data.instantToken);
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // ─── SIGNUP: SEND OTP ─────────────────────────────────────────────────────
  const validatePassword = (p: string) =>
    PASSWORD_RULES.every((r) => r.test(p));

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword(signupPassword)) {
      setError(
        "Password must be at least 8 characters with uppercase, lowercase, and a number."
      );
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSignupStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── SIGNUP: VERIFY OTP & CREATE USER ─────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          code,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic navigation: same as login — navigate first, auth in background.
      router.replace("/dashboard");
      db.auth.signInWithToken(data.instantToken);
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      setLoading(false);
    }
  };

  // ─── OTP INPUT HANDLERS ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(Boolean)) setTimeout(() => handleVerifyOtp(), 100);
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const n = [...otp];
        n[index] = "";
        setOtp(n);
      } else if (index > 0) {
        const n = [...otp];
        n[index - 1] = "";
        setOtp(n);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = Array(6).fill("");
    pasted.split("").forEach((ch, i) => { if (i < 6) newOtp[i] = ch; });
    setOtp(newOtp);
    const next = newOtp.findIndex((d) => !d);
    setTimeout(() => inputRefs.current[next === -1 ? 5 : next]?.focus(), 50);
    if (newOtp.every(Boolean)) setTimeout(() => handleVerifyOtp(), 150);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setError("");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
        <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] px-4 py-12">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-[var(--text-primary)]">
          AI Expense Advisor
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="w-full max-w-md bg-[var(--bg-primary)] rounded-3xl shadow-sm border border-[var(--border)] overflow-hidden"
      >
        {/* ── Back button (OTP step only) ── */}
        {tab === "signup" && signupStep === "otp" && (
          <div className="px-8 pt-6 pb-0">
            <button
              onClick={resetSignup}
              className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to form
            </button>
          </div>
        )}

        <div className="p-8">
          {/* ── Tabs (shown on login tab or signup form step) ── */}
          {!(tab === "signup" && signupStep === "otp") && (
            <div className="flex bg-[var(--bg-secondary)] rounded-xl p-1 mb-8">
              {(["login", "signup"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                    tab === t
                      ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {t === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* ── Heading ── */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1.5">
              {tab === "login"
                ? "Welcome back"
                : signupStep === "form"
                ? "Create your account"
                : "Verify your email"}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {tab === "login"
                ? "Sign in with your email and password."
                : signupStep === "form"
                ? "Fill in your details to get started."
                : (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {signupEmail}
                    </span>
                  </>
                )}
            </p>
          </div>

          {/* ── Error ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-2 text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ════════════════════════════════════════════════
                TAB: LOGIN
            ════════════════════════════════════════════════ */}
            {tab === "login" && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[var(--accent-primary)] hover:bg-[#43a047] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center h-[52px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </motion.form>
            )}

            {/* ════════════════════════════════════════════════
                TAB: SIGNUP — STEP 1: Form
            ════════════════════════════════════════════════ */}
            {tab === "signup" && signupStep === "form" && (
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={signupEmail}
                      onChange={(e) => { setSignupEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signupPassword}
                      onFocus={() => setShowPasswordHints(true)}
                      onChange={(e) => { setSignupPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-[var(--bg-secondary)] border border-transparent focus:border-[var(--accent-primary)] focus:outline-none transition-colors text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength hints */}
                  <AnimatePresence>
                    {showPasswordHints && signupPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-[var(--bg-secondary)] rounded-xl grid grid-cols-2 gap-1"
                      >
                        {PASSWORD_RULES.map((rule) => {
                          const pass = rule.test(signupPassword);
                          return (
                            <div key={rule.label} className="flex items-center gap-1.5">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                  pass ? "text-[var(--accent-primary)]" : "text-[var(--border)]"
                                }`}
                              />
                              <span
                                className={`text-xs transition-colors ${
                                  pass ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                                }`}
                              >
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signupConfirm}
                      onChange={(e) => { setSignupConfirm(e.target.value); setError(""); }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border transition-colors focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] ${
                        signupConfirm && signupConfirm !== signupPassword
                          ? "border-red-300 focus:border-red-400"
                          : "border-transparent focus:border-[var(--accent-primary)]"
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {signupConfirm && signupConfirm !== signupPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[var(--accent-primary)] hover:bg-[#43a047] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 h-[52px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </motion.form>
            )}

            {/* ════════════════════════════════════════════════
                TAB: SIGNUP — STEP 2: OTP Verification
            ════════════════════════════════════════════════ */}
            {tab === "signup" && signupStep === "otp" && (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleVerifyOtp}
                className="space-y-7"
              >
                {/* 6-Box OTP */}
                <div>
                  <div
                    className="flex gap-2 justify-center"
                    onPaste={handleOtpPaste}
                  >
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoComplete="one-time-code"
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] ${
                          digit
                            ? "border-[var(--accent-primary)] bg-[#E8F5E9] dark:bg-green-500/10"
                            : "border-[var(--border)] focus:border-[var(--accent-primary)]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="w-full bg-[var(--accent-primary)] hover:bg-[#43a047] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center h-[52px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify & Create Account"
                  )}
                </button>

                {/* Resend timer */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Resend code in{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-primary)] hover:underline disabled:opacity-50"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend code
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="mt-6 text-xs text-[var(--text-secondary)] text-center max-w-sm">
        Signup uses OTP email verification for security. Login is instant with your password.
      </p>
    </div>
  );
}
