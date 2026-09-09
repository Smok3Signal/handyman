"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Shield, Users, Gavel, Wrench, LogOut, LayoutDashboard,
  MessageSquare, Briefcase, ChevronDown, ChevronUp,
  Search, XCircle, CheckCircle, Clock, AlertTriangle,
  Ban, DollarSign, CalendarDays, Mail, Phone,
  ArrowRight, Loader2,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:           { label: "Pending",        color: "text-amber-400" },
  ACCEPTED:          { label: "Accepted",       color: "text-sky-400" },
  COUNTERED:         { label: "Countered",      color: "text-purple-400" },
  EMPLOYER_COUNTERED:{ label: "Countered",      color: "text-purple-400" },
  ON_THE_WAY:        { label: "On the Way",     color: "text-blue-400" },
  ARRIVED:           { label: "Arrived",        color: "text-blue-300" },
  IN_PROGRESS:       { label: "In Progress",    color: "text-orange-400" },
  REDO_REQUESTED:    { label: "Redo Requested", color: "text-rose-400" },
  COMPLETED:         { label: "Completed",      color: "text-emerald-400" },
  SATISFIED:         { label: "Satisfied",      color: "text-emerald-300" },
  DISPUTED:          { label: "Disputed",       color: "text-red-400" },
  CANCELLED:         { label: "Cancelled",      color: "text-stone-400" },
  DECLINED:          { label: "Declined",       color: "text-stone-400" },
};

const CANCELLABLE = [
  "PENDING", "ACCEPTED", "COUNTERED", "EMPLOYER_COUNTERED",
  "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "REDO_REQUESTED",
];

type Job = {
  id: string; status: string; description: string;
  offeredPrice: number | null; createdAt: string;
  technician: {
    id: string; name: string; email: string;
    technicianProfile?: { businessName?: string; serviceCategory?: string; averageRating?: number } | null;
  };
};
type Employer = {
  id: string; name: string; email: string; phone?: string | null;
  suspended: boolean; createdAt: string;
};
type Summary = {
  total: number; pending: number; active: number;
  completed: number; disputed: number; cancelled: number; totalSpend: number;
};
type EmployerDetail = { employer: Employer; jobs: Job[]; summary: Summary };

type EmployerListItem = {
  id: string; name: string; email: string; phone?: string | null;
  suspended: boolean; createdAt: string; role: string;
  _count?: { jobRequestsAsEmployer?: number };
};

function NavBar({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
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
        {[
          { href: "/admin/dashboard",   icon: LayoutDashboard, label: "Dashboard"   },
          { href: "/admin/disputes",    icon: Gavel,           label: "Disputes"    },
          { href: "/admin/users",       icon: Users,           label: "Users"       },
          { href: "/admin/technicians", icon: Wrench,          label: "Technicians" },
          { href: "/admin/employers",   icon: Briefcase,       label: "Employers"   },
          { href: "/admin/support",     icon: MessageSquare,   label: "Support"     },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === href ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
      <motion.button onClick={onLogout} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
        className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 transition-colors shrink-0">
        <LogOut size={13} /> <span className="hidden sm:inline">Logout</span>
      </motion.button>
    </nav>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-2xl">{value}</p>
        <p className="text-white/40 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function CancelModal({ job, onConfirm, onClose, loading }: {
  job: Job; onConfirm: (reason: string) => void;
  onClose: () => void; loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1714] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Ban size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Cancel Job</p>
            <p className="text-white/40 text-xs">This will notify both parties immediately</p>
          </div>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-xl p-3 mb-4 text-xs text-white/60 line-clamp-2">
          {job.description}
        </div>
        <label className="block text-xs text-white/50 mb-1.5">Reason (optional — sent to both parties)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Fraudulent activity detected, Terms of service violation..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:text-white transition-colors disabled:opacity-50">
            Nevermind
          </button>
          <button onClick={() => onConfirm(reason)} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
            {loading ? "Cancelling…" : "Cancel Job"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function EmployerRow({ employer, onRefresh }: { employer: EmployerListItem; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<EmployerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Job | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (detail) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/employers/${employer.id}/jobs`, { credentials: "include" });
      if (res.ok) setDetail(await res.json());
    } finally {
      setDetailLoading(false);
    }
  }, [employer.id, detail]);

  const handleToggle = () => {
    if (!open) loadDetail();
    setOpen((v) => !v);
  };

  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${cancelTarget.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setToast("Job cancelled successfully");
        setDetail(null);
        loadDetail();
        setTimeout(() => setToast(null), 3000);
      } else {
        const err = await res.json();
        setToast(err.error ?? "Failed to cancel job");
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const jobCount = employer._count?.jobRequestsAsEmployer ?? detail?.summary.total ?? 0;

  return (
    <>
      {cancelTarget && (
        <CancelModal
          job={cancelTarget}
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1714] border border-white/10 rounded-xl px-4 py-3 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}

      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <button onClick={handleToggle}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
            {employer.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm truncate">{employer.name}</p>
              {employer.suspended && (
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-semibold shrink-0">
                  Suspended
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs truncate">{employer.email}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-white/30 text-xs">{jobCount} job{jobCount !== 1 ? "s" : ""}</span>
            {open ? <ChevronUp size={15} className="text-white/30" /> : <ChevronDown size={15} className="text-white/30" />}
          </div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/8">
              <div className="px-5 py-4 space-y-4">
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-white/30 text-sm py-4">
                    <Loader2 size={14} className="animate-spin" /> Loading jobs…
                  </div>
                ) : detail ? (
                  <>
                    {/* Employer info */}
                    <div className="flex flex-wrap gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1.5"><Mail size={11} /> {detail.employer.email}</span>
                      {detail.employer.phone && <span className="flex items-center gap-1.5"><Phone size={11} /> {detail.employer.phone}</span>}
                      <span className="flex items-center gap-1.5"><CalendarDays size={11} /> Joined {new Date(detail.employer.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Total",     value: detail.summary.total,     color: "text-white/60" },
                        { label: "Active",    value: detail.summary.active,    color: "text-sky-400" },
                        { label: "Completed", value: detail.summary.completed, color: "text-emerald-400" },
                        { label: "Pending",   value: detail.summary.pending,   color: "text-amber-400" },
                        { label: "Disputed",  value: detail.summary.disputed,  color: "text-red-400" },
                        { label: "Cancelled", value: detail.summary.cancelled, color: "text-stone-400" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white/4 rounded-xl px-3 py-2 text-center">
                          <p className={`font-bold text-sm ${color}`}>{value}</p>
                          <p className="text-white/30 text-[10px] mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Total spend */}
                    {detail.summary.totalSpend > 0 && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <DollarSign size={12} className="text-emerald-400" />
                        Total completed spend: <span className="text-emerald-400 font-semibold">₦{detail.summary.totalSpend.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Job list */}
                    {detail.jobs.length === 0 ? (
                      <p className="text-white/20 text-sm text-center py-4">No jobs yet</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.jobs.map((job) => {
                          const meta = STATUS_META[job.status] ?? { label: job.status, color: "text-white/40" };
                          const canCancel = CANCELLABLE.includes(job.status);
                          return (
                            <div key={job.id}
                              className="bg-white/3 border border-white/6 rounded-xl px-4 py-3 flex items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
                                  <span className="text-white/20 text-[10px]">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                  </span>
                                  {job.offeredPrice != null && (
                                    <span className="text-white/40 text-[10px]">₦{job.offeredPrice.toLocaleString()}</span>
                                  )}
                                </div>
                                <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{job.description}</p>
                                <p className="text-white/30 text-[10px] mt-1">
                                  Technician: {job.technician.name}
                                  {job.technician.technicianProfile?.serviceCategory && ` · ${job.technician.technicianProfile.serviceCategory}`}
                                </p>
                              </div>
                              {canCancel && (
                                <button onClick={() => setCancelTarget(job)}
                                  className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg px-2.5 py-1.5 transition-colors">
                                  <Ban size={11} /> Cancel
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-white/30 text-sm text-center py-4">Failed to load</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function AdminEmployersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [employers, setEmployers] = useState<EmployerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "suspended">("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users?role=EMPLOYER", { credentials: "include" });
        if (res.status === 401) { router.push("/admin/login"); return; }
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setEmployers(list.filter((u: EmployerListItem) => u.role === "EMPLOYER"));
      } catch {
        setEmployers([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, refreshKey]);

  const filtered = employers.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "suspended" ? e.suspended :
      !e.suspended;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: employers.length,
    active: employers.filter((e) => !e.suspended).length,
    suspended: employers.filter((e) => e.suspended).length,
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed top-0 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -left-32 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      <NavBar pathname={pathname} onLogout={handleLogout} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={mountEase} className="mb-8">
          <h1 className="text-3xl font-black text-white">Employer Controls</h1>
          <p className="text-white/40 text-sm mt-1">View job history and manage employer activity</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-6">
          <StatCard icon={Briefcase}   label="Total Employers" value={stats.total}     color="bg-linear-to-br from-sky-500 to-blue-600" />
          <StatCard icon={CheckCircle} label="Active"          value={stats.active}    color="bg-linear-to-br from-emerald-500 to-green-600" />
          <StatCard icon={XCircle}     label="Suspended"       value={stats.suspended} color="bg-linear-to-br from-red-500 to-rose-600" />
        </motion.div>

        {/* Search + filter */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.08 }}
          className="space-y-3 mb-6">
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-white/4 border border-white/8 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/20"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "suspended"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${filter === f ? "bg-red-500 text-white" : "bg-white/5 text-white/40 hover:text-white"}`}>
                {f} {f === "all" ? employers.length : f === "active" ? stats.active : stats.suspended}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/20 text-sm">No employers found</div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...mountEase, delay: 0.1 }}
            className="space-y-2">
            {filtered.map((employer) => (
              <EmployerRow key={employer.id} employer={employer} onRefresh={() => setRefreshKey((k) => k + 1)} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}