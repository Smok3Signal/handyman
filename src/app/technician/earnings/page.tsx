"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import Layout from "@/components/Layout";
import AnalyticsChart from "@/components/AnalyticsChart";
import Spinner from "@/components/Spinner";
import {
  TrendingUp,
  Briefcase,
  Star,
  BarChart3,
  PieChart,
  Wallet,
  CheckCircle2,
} from "lucide-react";

// ── Animated count-up ────────────────────────────────────────────────────────
function AnimatedNumber({
  target,
  prefix = "",
  suffix = "",
  duration = 1400,
  decimals = 0,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(eased * target);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {decimals ? display.toFixed(decimals) : Math.round(display).toLocaleString()}
      {suffix}
    </span>
  );
}

const mountEase: Transition = { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse rounded-3xl bg-stone-800 h-48 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-64" />
        ))}
      </div>
    </div>
  );
}

export default function TechnicianEarningsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/analytics/technician")
        .then((r) => r.json())
        .then(setData);
    }
  }, [status, router]);

  const totalEarned: number = data?.summary?.totalEarned ?? 0;
  const totalJobs: number = data?.summary?.total ?? 0;
  const completed: number = data?.summary?.completed ?? 0;
  const avgPerJob: number = completed > 0 ? Math.round(totalEarned / completed) : 0;
  const avgRating: number = data?.summary?.averageRating ?? 0;
  const completionRate: number = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;

  const statCards = [
    { label: "Total Jobs",       value: totalJobs,       icon: Briefcase,   color: "stone",   prefix: "",  suffix: "",   decimals: 0 },
    { label: "Completion Rate",  value: completionRate,  icon: CheckCircle2, color: "emerald", prefix: "",  suffix: "%",  decimals: 0 },
    { label: "Avg per Job",      value: avgPerJob,       icon: Wallet,      color: "orange",  prefix: "₦", suffix: "",   decimals: 0 },
    { label: "Avg Rating",       value: avgRating,       icon: Star,        color: "sky",     prefix: "",  suffix: "/5", decimals: 1 },
  ];

  const CARD_TINTS: Record<string, string> = {
    stone:   "from-stone-50 to-white border-stone-200",
    emerald: "from-emerald-50 to-white border-emerald-100",
    orange:  "from-orange-50 to-white border-orange-100",
    sky:     "from-sky-50 to-white border-sky-100",
  };

  const ICON_TINTS: Record<string, string> = {
    stone:   "bg-stone-100 text-stone-500",
    emerald: "bg-emerald-100 text-emerald-600",
    orange:  "bg-orange-100 text-orange-500",
    sky:     "bg-sky-100 text-sky-500",
  };

  return (
    <Layout title="Earnings">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!data ? (
          <Skeleton />
        ) : (
          <>
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={mountEase}
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 p-8 text-white"
            >
              <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 w-40 h-40 rounded-full bg-orange-400/8 blur-2xl" />

              <p className="text-stone-400 text-sm font-medium uppercase tracking-widest mb-1">
                Total Earned
              </p>
              <h2 className="text-5xl font-extrabold tracking-tight mb-1 bg-linear-to-r from-white via-orange-100 to-orange-300 bg-clip-text text-transparent">
                <AnimatedNumber target={totalEarned} prefix="₦" duration={1400} />
              </h2>
              <p className="text-stone-400 text-sm mt-1">
                across {totalJobs} job{totalJobs !== 1 ? "s" : ""}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-sm font-semibold text-white">
                  {completionRate}% completion rate
                </span>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...mountEase, delay: i * 0.06 }}
                    whileHover={{ y: -3, scale: 1.02, transition: hoverSpring }}
                    className={`bg-linear-to-br ${CARD_TINTS[card.color]} border rounded-2xl p-5`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${ICON_TINTS[card.color]}`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-2xl font-bold text-stone-800">
                      {card.prefix}
                      {card.decimals
                        ? Number(card.value).toFixed(card.decimals)
                        : Number(card.value).toLocaleString()}
                      {card.suffix}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">{card.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...mountEase, delay: 0.28 }}
                className="bg-white border border-stone-200 rounded-2xl p-6"
              >
                <AnalyticsChart
                  type="bar"
                  title="Monthly Earnings"
                  data={data.monthlyEarnings}
                  xKey="month"
                  dataKey="earned"
                  color="#f97316"
                  prefix="₦"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...mountEase, delay: 0.34 }}
                className="bg-white border border-stone-200 rounded-2xl p-6"
              >
                <AnalyticsChart
                  type="bar"
                  title="Jobs by Category"
                  data={data.jobsByCategory}
                  xKey="category"
                  dataKey="count"
                  color="#0ea5e9"
                />
              </motion.div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}