"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, animate } from "framer-motion";
import type { Transition } from "framer-motion";
import Layout from "@/components/Layout";
import AnalyticsChart from "@/components/AnalyticsChart";
import {
  Briefcase,
  TrendingUp,
  Wallet,
  LayoutGrid,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(`${prefix}0`);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(`${prefix}${Math.round(v).toLocaleString()}`),
    });
    return () => controls.stop();
  }, [value]);

  return <>{display}</>;
}

export default function EmployerAnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetch("/api/analytics/employer")
        .then((r) => r.json())
        .then(setData);
    }
  }, [status, router]);

  if (!data) {
    return (
      <Layout title="Analytics">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="rounded-3xl bg-stone-900 p-8 md:p-10 mb-6 animate-pulse">
            <div className="h-3 w-24 bg-white/10 rounded mb-4" />
            <div className="h-12 w-64 bg-white/10 rounded mb-8" />
            <div className="h-2.5 w-full bg-white/5 rounded-full mb-3" />
            <div className="h-3 w-72 bg-white/10 rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-stone-100 mb-4" />
                <div className="h-6 w-16 bg-stone-100 rounded mb-2" />
                <div className="h-3 w-20 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-6 animate-pulse">
                <div className="h-3 w-32 bg-stone-100 rounded mb-6" />
                <div className="h-52 w-full bg-stone-50 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const summary = data.summary || {};
  const total = summary.total || 0;
  const completed = summary.completed || 0;
  const active = summary.active || 0;
  const pending = summary.pending || 0;
  const totalSpent = summary.totalSpent || 0;

  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const activePct = total > 0 ? (active / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  const avgPerJob = completed > 0 ? Math.round(totalSpent / completed) : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const categoriesCount = data.jobsByCategory?.length || 0;

  const statCards = [
    {
      label: "Total jobs",
      value: total.toLocaleString(),
      icon: Briefcase,
      iconBg: "bg-stone-100 text-stone-600",
      from: "from-stone-50",
    },
    {
      label: "Completion rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      iconBg: "bg-emerald-100 text-emerald-600",
      from: "from-emerald-50",
    },
    {
      label: "Avg per job",
      value: `₦${avgPerJob.toLocaleString()}`,
      icon: Wallet,
      iconBg: "bg-orange-100 text-orange-500",
      from: "from-orange-50",
    },
    {
      label: "Categories worked",
      value: categoriesCount.toLocaleString(),
      icon: LayoutGrid,
      iconBg: "bg-sky-100 text-sky-600",
      from: "from-sky-50",
    },
  ];

  return (
    <Layout title="Analytics">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-stone-800">Analytics</h1>
          <p className="text-stone-500 mt-1">Track your spending and job history</p>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 p-8 md:p-10 mb-6"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Total spent</p>
            <div className="flex items-end gap-3 flex-wrap">
              <h2 className="text-5xl md:text-6xl font-black bg-linear-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                <AnimatedNumber value={totalSpent} prefix="₦" />
              </h2>
              {completed > 0 && (
                <p className="text-white/40 text-sm pb-2">
                  ≈ ₦{avgPerJob.toLocaleString()} per completed job
                </p>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                <span className="uppercase tracking-widest">Job pipeline</span>
                <span>{total.toLocaleString()} total</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completedPct}%` }}
                  transition={{ ...mountEase, delay: 0.25 }}
                  className="bg-emerald-400"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activePct}%` }}
                  transition={{ ...mountEase, delay: 0.35 }}
                  className="bg-sky-400"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pendingPct}%` }}
                  transition={{ ...mountEase, delay: 0.45 }}
                  className="bg-amber-400"
                />
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 text-white/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> {completed} completed
                </span>
                <span className="flex items-center gap-1.5 text-white/50">
                  <span className="w-2 h-2 rounded-full bg-sky-400" /> {active} active
                </span>
                <span className="flex items-center gap-1.5 text-white/50">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> {pending} pending
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...mountEase, delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -3, scale: 1.02, transition: hoverSpring }}
                className={`bg-linear-to-br ${card.from} to-white rounded-2xl border border-stone-200 p-5`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-stone-800">{card.value}</p>
                <p className="text-sm text-stone-500">{card.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.3 }}
            className="bg-white rounded-2xl border border-stone-200 p-6"
          >
            <AnalyticsChart
              type="bar"
              title="Monthly spending"
              data={data.monthlySpending}
              xKey="month"
              dataKey="spent"
              color="#f97316"
              prefix="₦"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.35 }}
            className="bg-white rounded-2xl border border-stone-200 p-6"
          >
            <AnalyticsChart
              type="bar"
              title="Jobs by category"
              data={data.jobsByCategory}
              xKey="category"
              dataKey="count"
              color="#0ea5e9"
            />
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}