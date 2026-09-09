"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Shield, Users, Gavel, Wrench, LogOut, LayoutDashboard,
  AlertCircle, Clock, CheckCircle, XCircle, Briefcase,
  Star, ShieldOff, ArrowRight, MessageSquare,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [disputesRes, usersRes] = await Promise.all([
          fetch("/api/admin/disputes", { credentials: "include" }),
          fetch("/api/admin/users", { credentials: "include" }),
        ]);
        if (disputesRes.status === 401) { router.push("/admin/login"); return; }

        const disputes = await disputesRes.json();
        const users = await usersRes.json();

        const userList = Array.isArray(users) ? users : [];
        const disputeList = Array.isArray(disputes) ? disputes : [];

        setStats({
          disputes: {
            total: disputeList.length,
            open: disputeList.filter((d: any) => d.status === "OPEN").length,
            inReview: disputeList.filter((d: any) => d.status === "IN_REVIEW").length,
            defending: disputeList.filter((d: any) => d.status === "DEFENDING").length,
            resolved: disputeList.filter((d: any) => ["RESOLVED_EMPLOYER","RESOLVED_TECHNICIAN"].includes(d.status)).length,
            withdrawn: disputeList.filter((d: any) => d.status === "WITHDRAWN").length,
          },
          users: {
            total: userList.length,
            employers: userList.filter((u: any) => u.role === "EMPLOYER").length,
            technicians: userList.filter((u: any) => u.role === "TECHNICIAN").length,
            suspended: userList.filter((u: any) => u.suspended).length,
            topPerformers: userList.filter((u: any) => u.technicianProfile?.isTopPerformer).length,
          },
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0c0a09] relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -left-32 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative bg-white/3 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30">
            <Shield size={16} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-none">Handy<span className="text-orange-400">Man</span></p>
            <p className="text-white/30 text-[10px] uppercase tracking-widest mt-0.5">Admin Console</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <Link href="/admin/dashboard" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/dashboard" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <LayoutDashboard size={13} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/admin/disputes" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/disputes" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Gavel size={13} /> <span className="hidden sm:inline">Disputes</span>
          </Link>
          <Link href="/admin/users" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/users" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Users size={13} /> <span className="hidden sm:inline">Users</span>
          </Link>
          <Link href="/admin/technicians" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/technicians" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Wrench size={13} /> <span className="hidden sm:inline">Technicians</span>
          </Link>
          <Link href="/admin/employers" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/employers" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Briefcase size={13} /> <span className="hidden sm:inline">Employers</span>
          </Link>
          <Link href="/admin/support" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/support" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <MessageSquare size={13} /> <span className="hidden sm:inline">Support</span>
          </Link>
        </div>

        <motion.button onClick={handleLogout} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 transition-colors shrink-0">
          <LogOut size={13} /> <span className="hidden sm:inline">Logout</span>
        </motion.button>
      </nav>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={mountEase} className="mb-8">
          <h1 className="text-3xl font-black text-white">Overview</h1>
          <p className="text-white/40 text-sm mt-1">Platform health at a glance</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : stats ? (
          <div className="space-y-6">

            {/* Urgent alert */}
            {stats.disputes.open > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.04 }}>
                <Link href="/admin/disputes"
                  className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4 hover:bg-red-500/15 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle size={17} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-300 font-semibold text-sm">
                      {stats.disputes.open} open dispute{stats.disputes.open > 1 ? "s" : ""} need attention
                    </p>
                    <p className="text-red-400/60 text-xs mt-0.5">Click to review the dispute queue</p>
                  </div>
                  <ArrowRight size={16} className="text-red-400/50 group-hover:text-red-300 transition-colors" />
                </Link>
              </motion.div>
            )}

            {/* Section cards — 3 col */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Disputes */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.06 }}>
                <Link href="/admin/disputes"
                  className="block bg-white/4 border border-white/10 rounded-2xl p-5 hover:border-red-500/30 hover:bg-white/6 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                      <Gavel size={15} className="text-white" />
                    </div>
                    <ArrowRight size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                  <p className="text-white font-bold text-lg mb-0.5">Disputes</p>
                  <p className="text-white/30 text-xs mb-4">Review evidence and resolve cases</p>
                  <div className="space-y-2">
                    {[
                      { icon: AlertCircle, label: "Open",      value: stats.disputes.open,      color: "text-red-400" },
                      { icon: Clock,       label: "In Review", value: stats.disputes.inReview,  color: "text-amber-400" },
                      { icon: CheckCircle, label: "Resolved",  value: stats.disputes.resolved,  color: "text-emerald-400" },
                      { icon: XCircle,     label: "Withdrawn", value: stats.disputes.withdrawn, color: "text-stone-400" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-white/40"><Icon size={11} className={color} /> {label}</span>
                        <span className="text-white/70 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </Link>
              </motion.div>

              {/* Users */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.09 }}>
                <Link href="/admin/users"
                  className="block bg-white/4 border border-white/10 rounded-2xl p-5 hover:border-sky-500/30 hover:bg-white/6 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Users size={15} className="text-white" />
                    </div>
                    <ArrowRight size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                  <p className="text-white font-bold text-lg mb-0.5">Users</p>
                  <p className="text-white/30 text-xs mb-4">Manage accounts and suspensions</p>
                  <div className="space-y-2">
                    {[
                      { icon: Briefcase, label: "Employers",   value: stats.users.employers,   color: "text-sky-400" },
                      { icon: Wrench,    label: "Technicians", value: stats.users.technicians, color: "text-orange-400" },
                      { icon: ShieldOff, label: "Suspended",   value: stats.users.suspended,   color: "text-red-400" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-white/40"><Icon size={11} className={color} /> {label}</span>
                        <span className="text-white/70 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </Link>
              </motion.div>

              {/* Technicians */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.12 }}>
                <Link href="/admin/technicians"
                  className="block bg-white/4 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 hover:bg-white/6 transition-colors group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
                      <Wrench size={15} className="text-white" />
                    </div>
                    <ArrowRight size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                  <p className="text-white font-bold text-lg mb-0.5">Technicians</p>
                  <p className="text-white/30 text-xs mb-4">Ratings, badges and availability</p>
                  <div className="space-y-2">
                    {[
                      { icon: Star,   label: "Top Performers", value: stats.users.topPerformers, color: "text-amber-400" },
                      { icon: Wrench, label: "Total",          value: stats.users.technicians,   color: "text-orange-400" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-white/40"><Icon size={11} className={color} /> {label}</span>
                        <span className="text-white/70 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Bottom row — wide link cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Support Tickets */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.15 }}>
                <Link href="/admin/support"
                  className="flex items-center gap-3 bg-white/4 border border-white/10 rounded-2xl px-5 py-4 hover:border-orange-500/30 hover:bg-white/6 transition-colors group h-full">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                    <MessageSquare size={15} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Support Tickets</p>
                    <p className="text-white/30 text-xs mt-0.5">Review and respond to user-submitted tickets</p>
                  </div>
                  <ArrowRight size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </Link>
              </motion.div>

              {/* Employer Controls */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.18 }}>
                <Link href="/admin/employers"
                  className="flex items-center gap-3 bg-white/4 border border-white/10 rounded-2xl px-5 py-4 hover:border-sky-500/30 hover:bg-white/6 transition-colors group h-full">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Briefcase size={15} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Employer Controls</p>
                    <p className="text-white/30 text-xs mt-0.5">View job history and cancel jobs on behalf of employers</p>
                  </div>
                  <ArrowRight size={15} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </Link>
              </motion.div>

            </div>
          </div>
        ) : (
          <p className="text-white/30 text-sm">Failed to load stats.</p>
        )}
      </div>
    </div>
  );
}