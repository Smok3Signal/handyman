"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { ShieldCheck, User, Lock, AlertCircle } from "lucide-react";

// ─── Motion constants ────────────────────────────────────────────────────────
const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid credentials");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] relative overflow-hidden flex items-center justify-center px-4">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ambient blobs — red signals a restricted/admin zone */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring}
        className="relative w-full max-w-md rounded-3xl p-8 backdrop-blur-[32px] bg-white/5 border border-white/10"
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.4)" }}
      >
        {/* Glow border accent */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none bg-linear-to-br from-red-500/20 via-white/5 to-transparent opacity-50" />

        <div className="relative">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...spring, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40 mb-4"
            >
              <ShieldCheck size={24} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-white">
              Handy<span className="text-orange-400">Man</span>
            </h1>
            <p className="text-white/30 text-xs uppercase tracking-widest mt-1">Admin Console</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-5"
            >
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <motion.input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  whileFocus={{ scale: 1.012 }}
                  transition={spring}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/30 transition-colors"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <motion.input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  whileFocus={{ scale: 1.012 }}
                  transition={spring}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/30 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              transition={hoverSpring}
              className="w-full bg-linear-to-br from-red-500 to-red-700 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-red-900/30 disabled:opacity-50 transition-opacity mt-2"
            >
              {loading ? "Verifying..." : "Sign in to Admin"}
            </motion.button>
          </form>

          <p className="text-center text-[11px] text-white/20 mt-6 tracking-wide">
            Restricted access — authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  );
}