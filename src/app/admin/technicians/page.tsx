"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Spinner from "@/components/Spinner";
import {
  Shield,
  Users,
  Gavel,
  Wrench,
  ChevronDown,
  LogOut,
  Briefcase,
  Inbox,
  Search,
  Star,
  Award,
  WifiOff,
  Trash2,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  MessageSquare,
} from "lucide-react";

// ─── Motion constants ─────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

// ─── Types ────────────────────────────────────────────────────────────────────
interface TechSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  suspended: boolean;
  isAvailable: boolean;
  technicianProfile: {
    serviceCategory: string;
    averageRating: number;
    totalReviews: number;
    rank: string;
    basePrice: number;
    isTopPerformer: boolean;
    isAvailable: boolean;
    yearsOfExperience: number;
    businessName: string;
  } | null;
  _count: { jobRequestsAsEmployer: number; jobRequestsAsTechnician: number };
}

interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

interface TechDetail extends TechSummary {
  portfolioItems: PortfolioItem[];
}

// ─── Star Picker ──────────────────────────────────────────────────────────────
function StarPicker({ current, onRate }: { current: number; onRate: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onRate(s)}
          className="focus:outline-none"
        >
          <Star
            size={22}
            className={s <= (hovered || current) ? "fill-amber-400 text-amber-400" : "text-white/20"}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-white/40">{current.toFixed(1)}</span>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminTechniciansPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [techs, setTechs] = useState<TechSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "suspended" | "available" | "top">("all");
  const [stats, setStats] = useState({ total: 0, available: 0, suspended: 0, topPerformers: 0 });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<Record<string, TechDetail>>({});
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ id: string; msg: string } | null>(null);

  // ── Fetch list ─────────────────────────────────────────────────────────────
  const fetchTechs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: "TECHNICIAN" });
      if (search) params.set("search", search);
      if (filter === "suspended") params.set("suspended", "true");

      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      const list: TechSummary[] = data.users ?? (Array.isArray(data) ? data : []);

      let filtered = list.filter((u) => u.technicianProfile !== null);
      if (filter === "available") filtered = filtered.filter((t) => t.technicianProfile?.isAvailable);
      if (filter === "top") filtered = filtered.filter((t) => t.technicianProfile?.isTopPerformer);
      if (filter === "suspended") filtered = filtered.filter((t) => t.suspended);

      setTechs(filtered);
      setStats({
        total: list.length,
        available: list.filter((t) => t.technicianProfile?.isAvailable).length,
        suspended: list.filter((t) => t.suspended).length,
        topPerformers: list.filter((t) => t.technicianProfile?.isTopPerformer).length,
      });
    } catch { console.error("Failed to load technicians"); }
    finally { setLoading(false); }
  }, [search, filter, router]);

  useEffect(() => { fetchTechs(); }, [fetchTechs]);

  // ── Load detail ────────────────────────────────────────────────────────────
  const loadDetail = async (techId: string) => {
    if (expandedData[techId]) return;
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/technicians/${techId}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: TechDetail = await res.json();
      setExpandedData((prev) => ({ ...prev, [techId]: data }));
    } catch (err) { console.error("Failed to load detail", err); }
    finally { setIsLoadingDetail(false); }
  };

  const toggleExpand = (techId: string) => {
    if (expandedId === techId) { setExpandedId(null); return; }
    setExpandedId(techId);
    loadDetail(techId);
  };

  // ── Patch helper ───────────────────────────────────────────────────────────
  const patchTechnician = (techId: string, body: object) =>
    fetch(`/api/admin/technicians/${techId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });

  const flash = (id: string, msg: string) => {
    setActionMsg({ id, msg });
    setTimeout(() => setActionMsg(null), 3000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleRate = async (techId: string, rating: number) => {
    const res = await patchTechnician(techId, { action: "adjust_rating", rating });
    if (res.ok) {
      setExpandedData((prev) => !prev[techId] ? prev : {
        ...prev, [techId]: { ...prev[techId], technicianProfile: prev[techId].technicianProfile
          ? { ...prev[techId].technicianProfile!, averageRating: rating } : prev[techId].technicianProfile }
      });
      flash(techId, `Rating updated to ${rating}★`);
    }
  };

  const handleToggleBadge = async (techId: string, current: boolean) => {
    const res = await patchTechnician(techId, { action: "toggle_badge", isTopPerformer: !current });
    if (res.ok) {
      setExpandedData((prev) => !prev[techId] ? prev : {
        ...prev, [techId]: { ...prev[techId], technicianProfile: prev[techId].technicianProfile
          ? { ...prev[techId].technicianProfile!, isTopPerformer: !current } : prev[techId].technicianProfile }
      });
      flash(techId, !current ? "Top Performer badge granted" : "Badge revoked");
      fetchTechs();
    }
  };

  const handleForceOffline = async (techId: string) => {
    const res = await patchTechnician(techId, { action: "force_offline" });
    if (res.ok) {
      setExpandedData((prev) => !prev[techId] ? prev : {
        ...prev, [techId]: { ...prev[techId], technicianProfile: prev[techId].technicianProfile
          ? { ...prev[techId].technicianProfile!, isAvailable: false } : prev[techId].technicianProfile }
      });
      flash(techId, "Technician forced offline");
      fetchTechs();
    }
  };

  const handleRemovePortfolio = async (techId: string, itemId: string) => {
    const res = await patchTechnician(techId, { action: "remove_portfolio_item", portfolioItemId: itemId });
    if (res.ok) {
      setExpandedData((prev) => !prev[techId] ? prev : {
        ...prev, [techId]: { ...prev[techId], portfolioItems: prev[techId].portfolioItems.filter((p) => p.id !== itemId) }
      });
      flash(techId, "Portfolio item removed");
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  const FILTERS: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "top", label: "Top Performers" },
    { key: "suspended", label: "Suspended" },
  ];

  const STAT_CARDS = [
    { label: "Total", value: stats.total, gradient: "from-stone-500 to-stone-700", ring: "ring-white/10" },
    { label: "Available", value: stats.available, gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/15" },
    { label: "Top Performers", value: stats.topPerformers, gradient: "from-amber-500 to-orange-600", ring: "ring-amber-500/15" },
    { label: "Suspended", value: stats.suspended, gradient: "from-red-500 to-rose-600", ring: "ring-red-500/15" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0a09] relative">
      {/* Grid texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
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
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={mountEase} className="mb-6">
          <h1 className="text-3xl font-black text-white">Technician Controls</h1>
          <p className="text-white/40 text-sm mt-1">Manage ratings, badges, availability and portfolio for every technician</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...mountEase, delay: 0.06 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {STAT_CARDS.map((card) => (
            <div key={card.label} className={`relative overflow-hidden rounded-2xl p-4 ring-1 ${card.ring} bg-white/4`}>
              <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-[0.10]`} />
              <p className="relative text-2xl font-black text-white">{card.value}</p>
              <p className="relative text-xs text-white/40 mt-0.5">{card.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Search + filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...mountEase, delay: 0.08 }} className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <motion.button
                key={f.key}
                onClick={() => setFilter(f.key)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === f.key ? "bg-red-500 text-white" : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/3 animate-pulse" />)}
          </div>
        ) : techs.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={mountEase} className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Inbox size={22} className="text-white/30" />
            </div>
            <p className="text-white/60 font-semibold text-base mb-1">No technicians found</p>
            <p className="text-white/30 text-sm">Try a different search or filter</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {techs.map((tech, i) => {
                const isExpanded = expandedId === tech.id;
                const detail = expandedData[tech.id];
                const profile = detail?.technicianProfile ?? tech.technicianProfile;

                return (
                  <motion.div
                    key={tech.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ ...mountEase, delay: i * 0.03 }}
                    className={`bg-white/4 border rounded-2xl overflow-hidden ${tech.suspended ? "border-red-500/20" : "border-white/10"}`}
                  >
                    {/* Card header */}
                    <button
                      onClick={() => toggleExpand(tech.id)}
                      className="w-full text-left p-4 hover:bg-white/3 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/15 flex items-center justify-center text-sm font-bold text-orange-300 shrink-0">
                          {initials(tech.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {tech.suspended && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300">Suspended</span>
                            )}
                            {profile?.isTopPerformer && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                                <Award size={10} /> Top Performer
                              </span>
                            )}
                            <span className="text-white/30 text-xs">Joined {timeAgo(tech.createdAt)}</span>
                          </div>
                          <p className="text-white font-semibold text-sm truncate">{tech.name}</p>
                          <p className="text-white/30 text-xs mt-0.5 truncate">
                            {tech.email} · {profile?.serviceCategory ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-white/30 hidden sm:inline">
                            ★ {profile?.averageRating?.toFixed(1) ?? "0.0"} · {profile?.rank ?? "Bronze"}
                          </span>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={spring} className="text-white/30">
                            <ChevronDown size={16} />
                          </motion.div>
                        </div>
                      </div>
                    </button>

                    {/* Expanded panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                            {isLoadingDetail && !detail ? (
                              <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-orange-400" size={22} />
                              </div>
                            ) : (
                              <>
                                {/* Flash */}
                                {actionMsg?.id === tech.id && (
                                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm px-3 py-2 rounded-xl">
                                    <AlertCircle size={14} /> {actionMsg.msg}
                                  </div>
                                )}

                                {/* Meta grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {[
                                    { label: "Phone", value: tech.phone || "—" },
                                    { label: "Address", value: tech.address || "—" },
                                    { label: "Joined", value: new Date(tech.createdAt).toLocaleDateString() },
                                    { label: "Base Price", value: profile?.basePrice ? `₦${Number(profile.basePrice).toLocaleString()}` : "—" },
                                    { label: "Reviews", value: profile?.totalReviews ?? 0 },
                                    { label: "Jobs", value: tech._count?.jobRequestsAsTechnician ?? 0 },
                                  ].map((item) => (
                                    <div key={item.label} className="bg-white/5 rounded-xl p-3">
                                      <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">{item.label}</p>
                                      <p className="text-white text-sm font-medium truncate">{item.value}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Rating */}
                                <div className="bg-white/5 rounded-xl p-4">
                                  <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-3">Adjust Rating</p>
                                  <StarPicker
                                    current={profile?.averageRating ?? 0}
                                    onRate={(r) => handleRate(tech.id, r)}
                                  />
                                </div>

                                {/* Badge + offline */}
                                <div className="flex flex-wrap gap-3">
                                  <motion.button
                                    onClick={() => handleToggleBadge(tech.id, profile?.isTopPerformer ?? false)}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                      profile?.isTopPerformer
                                        ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                                        : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
                                    }`}
                                  >
                                    <Award size={15} />
                                    {profile?.isTopPerformer ? "Revoke Top Badge" : "Grant Top Badge"}
                                  </motion.button>

                                  <motion.button
                                    onClick={() => handleForceOffline(tech.id)}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 transition-colors"
                                  >
                                    <WifiOff size={15} /> Force Offline
                                  </motion.button>
                                </div>

                                {/* Portfolio */}
                                <div>
                                  <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-3">
                                    Portfolio ({detail?.portfolioItems?.length ?? 0} items)
                                  </p>
                                  {!detail?.portfolioItems?.length ? (
                                    <p className="text-white/30 text-sm italic">No portfolio items.</p>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {detail.portfolioItems.map((item) => (
                                        <div key={item.id} className="relative group rounded-xl overflow-hidden border border-white/10">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={item.imageUrl} alt={item.title} className="w-full h-28 object-cover" />
                                          <div className="p-2 bg-white/5">
                                            <p className="text-xs text-white/60 truncate">{item.title}</p>
                                          </div>
                                          <button
                                            onClick={() => handleRemovePortfolio(tech.id, item.id)}
                                            className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
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
    </div>
  );
}