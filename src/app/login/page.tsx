"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, WifiOff } from "lucide-react";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const bouncySpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

function GlassInput({
  label, type, value, onChange, placeholder, suffix,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder?: string; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-orange-300/80">{label}</label>
      <motion.div animate={focused ? { scale: 1.015 } : { scale: 1 }} transition={spring} className="relative">
        <div
          className={`relative flex items-center rounded-2xl border transition-all duration-200 overflow-hidden ${
            focused
              ? "border-orange-400/60 shadow-[0_0_0_3px_rgba(249,115,22,0.18),inset_0_1px_0_rgba(255,255,255,0.12)]"
              : "border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          }`}
          style={{ background: focused ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.04)" }}
        >
          <input
            type={type} value={value} onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none"
          />
          {suffix && <div className="pr-3">{suffix}</div>}
        </div>
      </motion.div>
    </div>
  );
}

function SpringButton({ children, onClick, loading }: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <motion.button
      type="button" onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      animate={pressed ? { scale: 0.95 } : { scale: 1 }}
      whileHover={{ scale: 1.03 }} transition={bouncySpring}
      className="relative w-full overflow-hidden rounded-2xl py-4 font-bold text-white text-sm tracking-wide shadow-[0_4px_24px_rgba(249,115,22,0.45)] disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)" }}
      disabled={loading}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 60%)" }} />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{children}<ArrowRight className="w-4 h-4" /></>}
      </span>
    </motion.button>
  );
}

type ErrorType = "auth" | "network" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    setErrorType(null);
    try {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Invalid email or password");
        setErrorType("auth");
      } else {
        const meRes = await fetch("/api/profile");
        const me = await meRes.json();
        if (me.role === "EMPLOYER") router.push("/employer/dashboard");
        else router.push("/technician/dashboard");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Network timed out. Please check your connection and try again.");
        setErrorType("network");
      } else {
        setError("Something went wrong. Please try again.");
        setErrorType("auth");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#0c0a09" }}>
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-150 h-150 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #f97316 0%, #ea580c 40%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-20 w-125 h-125 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #fb923c 0%, #f97316 50%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #fed7aa 0%, transparent 70%)" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-px rounded-3xl"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.4) 0%, rgba(255,255,255,0.06) 50%, rgba(249,115,22,0.2) 100%)" }} />

        <div className="relative rounded-3xl p-8 flex flex-col gap-7"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <motion.div whileHover={{ scale: 1.12, rotate: -5 }} transition={bouncySpring}
              className="w-14 h-14 rounded-2xl flex items-center justify-center">
              <img src="/icon.png" alt="HandyMan" className="w-full h-full object-contain" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight"
                style={{ background: "linear-gradient(135deg, #fff 0%, #fed7aa 60%, #f97316 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                HandyMan
              </h1>
              <p className="text-xs text-white/35 mt-0.5">Work flows here</p>
            </div>
          </div>

          <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent)" }} />

          <div className="flex flex-col gap-4">
            <GlassInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <GlassInput
              label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} placeholder="••••••••"
              suffix={
                <motion.button type="button" onClick={() => setShowPassword(!showPassword)}
                  whileTap={{ scale: 0.85 }} transition={bouncySpring}
                  className="text-white/30 hover:text-orange-400 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </motion.button>
              }
            />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={bouncySpring}
              className="rounded-xl px-4 py-3 text-xs font-medium border flex items-start gap-2.5"
              style={{
                background: errorType === "network" ? "rgba(234,179,8,0.08)" : "rgba(239,68,68,0.08)",
                borderColor: errorType === "network" ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)",
                color: errorType === "network" ? "#fde047" : "#fca5a5",
              }}
            >
              {errorType === "network" && <WifiOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
              {error}
            </motion.div>
          )}

          <SpringButton onClick={handleLogin} loading={loading}>Sign in</SpringButton>

          <p className="text-center text-xs text-white/30">
            No account?{" "}
            <motion.a href="/register" whileHover={{ color: "#f97316" }} className="text-orange-400 font-semibold hover:underline">
              Create one
            </motion.a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}