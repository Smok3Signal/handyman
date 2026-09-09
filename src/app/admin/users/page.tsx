"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Spinner from "@/components/Spinner";
import {
  Shield,
  Users,
  Gavel,
  Search,
  ChevronDown,
  LogOut,
  Inbox,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  ShieldOff,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  X,
  Wrench,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

// ─── Motion constants ────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

type FilterKey = "ALL" | "EMPLOYER" | "TECHNICIAN" | "SUSPENDED";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "EMPLOYER", label: "Employers" },
  { key: "TECHNICIAN", label: "Technicians" },
  { key: "SUSPENDED", label: "Suspended" },
];

const ROLE_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  EMPLOYER: { bg: "bg-sky-500/10", text: "text-sky-300", dot: "bg-sky-400", label: "Employer" },
  TECHNICIAN: { bg: "bg-orange-500/10", text: "text-orange-300", dot: "bg-orange-400", label: "Technician" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function joinedOn(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function AdminUsersPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterKey>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  const toggleSuspend = async (user: any) => {
    const action = user.suspended ? "unsuspend" : "suspend";
    setActionLoading(user.id + action);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? { ...u, suspended: action === "suspend", isAvailable: action === "suspend" ? false : u.isAvailable }
              : u
          )
        );
      }
    } catch {
      console.error("Failed to update suspension state");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setDeleteTarget(null);
        setExpanded(null);
      } else {
        setDeleteError(data.error || "Something went wrong.");
      }
    } catch {
      setDeleteError("Something went wrong. Try again.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (activeTab === "EMPLOYER") list = list.filter((u) => u.role === "EMPLOYER");
    if (activeTab === "TECHNICIAN") list = list.filter((u) => u.role === "TECHNICIAN");
    if (activeTab === "SUSPENDED") list = list.filter((u) => u.suspended);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, activeTab, search]);

  const counts = useMemo(
    () => ({
      ALL: users.length,
      EMPLOYER: users.filter((u) => u.role === "EMPLOYER").length,
      TECHNICIAN: users.filter((u) => u.role === "TECHNICIAN").length,
      SUSPENDED: users.filter((u) => u.suspended).length,
    }),
    [users]
  );

  const STAT_CARDS = [
    { key: "ALL", label: "Total users", icon: Users, gradient: "from-stone-500 to-stone-700", ring: "ring-white/10" },
    { key: "EMPLOYER", label: "Employers", icon: Briefcase, gradient: "from-sky-500 to-blue-600", ring: "ring-sky-500/15" },
    { key: "TECHNICIAN", label: "Technicians", icon: Star, gradient: "from-orange-500 to-amber-600", ring: "ring-orange-500/15" },
    { key: "SUSPENDED", label: "Suspended", icon: ShieldOff, gradient: "from-red-500 to-rose-600", ring: "ring-red-500/15" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0c0a09] relative">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="fixed top-0 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -left-32 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
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
          </Link><Link href="/admin/employers" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/employers" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={mountEase} className="mb-6">
          <h1 className="text-3xl font-black text-white">Account Viewer</h1>
          <p className="text-white/40 text-sm mt-1">Search every employer and technician, and manage account access</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.06 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
        >
          {STAT_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className={`relative overflow-hidden rounded-2xl p-4 ring-1 ${card.ring} bg-white/4`}>
                <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-[0.10]`} />
                <div className={`relative w-8 h-8 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center shadow-sm mb-2`}>
                  <Icon size={14} className="text-white" />
                </div>
                <p className="relative text-2xl font-black text-white">{counts[card.key as FilterKey]}</p>
                <p className="relative text-xs text-white/40 mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...mountEase, delay: 0.08 }} className="mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40 transition-colors"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...mountEase, delay: 0.1 }}
          className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={hoverSpring}
                className="relative px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"
              >
                {isActive && (
                  <motion.div layoutId="admin-users-tab-pill" transition={spring} className="absolute inset-0 bg-red-500 rounded-xl" />
                )}
                <span className={`relative z-10 ${isActive ? "text-white" : "text-white/50"}`}>{tab.label}</span>
                {counts[tab.key] > 0 && (
                  <span
                    className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/25 text-white" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={mountEase}
            className="text-center py-16 bg-white/3 rounded-2xl border border-white/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Inbox size={22} className="text-white/30" />
            </div>
            <p className="text-white/60 font-semibold text-base mb-1">No matching accounts</p>
            <p className="text-white/30 text-sm">Try a different search or filter</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((user, i) => {
                const roleCfg = ROLE_STYLES[user.role] ?? ROLE_STYLES.EMPLOYER;
                const isExpanded = expanded === user.id;
                const isSuspending = actionLoading === user.id + "suspend";
                const isUnsuspending = actionLoading === user.id + "unsuspend";
                const tp = user.technicianProfile;

                return (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ ...mountEase, delay: i * 0.03 }}
                    className={`bg-white/4 border rounded-2xl overflow-hidden ${
                      user.suspended ? "border-red-500/20" : "border-white/10"
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : user.id)}
                      className="w-full text-left p-4 hover:bg-white/3 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            user.role === "TECHNICIAN" ? "bg-orange-500/15 text-orange-300" : "bg-sky-500/15 text-sky-300"
                          }`}
                        >
                          {initials(user.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dot}`} />
                              {roleCfg.label}
                            </span>
                            {user.suspended && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300">
                                <ShieldOff size={10} /> Suspended
                              </span>
                            )}
                            <span className="text-white/30 text-xs">Joined {timeAgo(user.createdAt)}</span>
                          </div>
                          <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                          <p className="text-white/30 text-xs mt-0.5 truncate">{user.email}</p>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={spring} className="text-white/30 shrink-0 mt-1">
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Mail size={10} /> Email
                                </p>
                                <p className="text-white text-sm truncate">{user.email}</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Phone size={10} /> Phone
                                </p>
                                <p className="text-white text-sm truncate">{user.phone || "Not provided"}</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <MapPin size={10} /> Location
                                </p>
                                <p className="text-white text-sm truncate">{user.address || "Not provided"}</p>
                              </div>
                              <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Calendar size={10} /> Joined
                                </p>
                                <p className="text-white text-sm truncate">{joinedOn(user.createdAt)}</p>
                              </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                              <Briefcase size={13} className="text-white/40" />
                              <p className="text-white/70 text-sm">
                                {user.role === "EMPLOYER"
                                  ? `${user._count?.jobRequestsAsEmployer ?? 0} job${user._count?.jobRequestsAsEmployer === 1 ? "" : "s"} posted`
                                  : `${user._count?.jobRequestsAsTechnician ?? 0} job${user._count?.jobRequestsAsTechnician === 1 ? "" : "s"} taken`}
                              </p>
                            </div>

                            {tp && (
                              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                <p className="text-orange-300 text-[10px] font-semibold uppercase tracking-wider mb-2">Technician Profile</p>
                                <p className="text-white text-sm font-medium">{tp.businessName}</p>
                                <p className="text-white/50 text-xs mt-0.5">
                                  {tp.serviceCategory} · {tp.yearsOfExperience} yrs experience · {tp.rank} rank
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                                  <span className="flex items-center gap-1">
                                    <Star size={11} className="text-amber-400" /> {tp.averageRating?.toFixed(1) ?? "0.0"} ({tp.totalReviews} reviews)
                                  </span>
                                  <span>₦{Number(tp.basePrice).toLocaleString()} base price</span>
                                </div>
                                {!user.isAvailable && (
                                  <p className="text-white/30 text-[11px] mt-2">Currently marked unavailable</p>
                                )}
                              </div>
                            )}

                            <div className="flex gap-3 pt-1">
                              <motion.button
                                onClick={() => toggleSuspend(user)}
                                disabled={isSuspending || isUnsuspending}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                transition={hoverSpring}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors ${
                                  user.suspended
                                    ? "bg-linear-to-br from-emerald-500 to-teal-600 text-white"
                                    : "bg-linear-to-br from-amber-500 to-orange-600 text-white"
                                }`}
                              >
                                {isSuspending || isUnsuspending ? (
                                  <Spinner size="sm" />
                                ) : user.suspended ? (
                                  <><ShieldCheck size={15} /> Unsuspend</>
                                ) : (
                                  <><ShieldOff size={15} /> Suspend</>
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => { setDeleteError(null); setDeleteTarget(user); }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                transition={hoverSpring}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-white/5 border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={15} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={mountEase}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#13110f] border border-white/10 rounded-2xl max-w-sm w-full p-5 relative"
            >
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center mb-3">
                <AlertTriangle size={19} className="text-red-400" />
              </div>
              <h3 className="text-white font-bold text-base mb-1">Permanently delete this account?</h3>
              <p className="text-white/50 text-sm mb-4">
                This removes <span className="text-white font-medium">{deleteTarget.name}</span>'s account entirely.
                This can't be undone. If the account has job history, the delete will be blocked — suspend it instead.
              </p>
              {deleteError && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                  <p className="text-amber-300 text-xs">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-br from-red-500 to-rose-600 text-white disabled:opacity-50"
                >
                  {deleting ? <Spinner size="sm" /> : "Delete permanently"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}