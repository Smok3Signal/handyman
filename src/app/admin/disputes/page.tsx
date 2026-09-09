"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Spinner from "@/components/Spinner";
import {
  Shield, Users, Gavel, Search, ChevronDown, LogOut, Inbox,
  CheckCircle, Clock, AlertCircle, Wrench, MessageSquare,
  Star, Briefcase, Camera, Image as ImageIcon, XCircle,
  LayoutDashboard,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

type FilterKey = "ALL" | "OPEN" | "IN_REVIEW" | "RESOLVED" | "WITHDRAWN";

const TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "All" },
  { key: "OPEN",      label: "Open" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "RESOLVED",  label: "Resolved" },
  { key: "WITHDRAWN", label: "Withdrawn" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  OPEN:                { bg:"bg-red-500/10",     text:"text-red-300",     label:"Open",              icon:AlertCircle },
  IN_REVIEW:           { bg:"bg-amber-500/10",   text:"text-amber-300",   label:"In Review",         icon:Clock },
  DEFENDING:           { bg:"bg-orange-500/10",  text:"text-orange-300",  label:"Defense Submitted", icon:Clock },
  RESOLVED_TECHNICIAN: { bg:"bg-emerald-500/10", text:"text-emerald-300", label:"Tech Won",          icon:CheckCircle },
  RESOLVED_EMPLOYER:   { bg:"bg-sky-500/10",     text:"text-sky-300",     label:"Employer Won",      icon:CheckCircle },
  WITHDRAWN:           { bg:"bg-stone-500/10",   text:"text-stone-400",   label:"Withdrawn",         icon:XCircle },
};

function isResolved(status: string) {
  return status === "RESOLVED_TECHNICIAN" || status === "RESOLVED_EMPLOYER";
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

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0,2).map((p)=>p[0]?.toUpperCase()).join("");
}

function PhotoStrip({ label, icon: Icon, photos, accent }: {
  label: string; icon: any; photos: string[]; accent: string;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!photos || photos.length === 0) return null;
  return (
    <div className={`rounded-xl p-3 ${accent}`}>
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
        <Icon size={10} /> {label} ({photos.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {photos.map((url, i) => (
          <button key={i} onClick={() => setLightbox(url)}
            className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-colors">
            <img src={url} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}>
            <motion.img initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              src={lightbox} alt="Evidence" onClick={(e)=>e.stopPropagation()}
              className="max-w-full max-h-full rounded-xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterKey>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/disputes", { credentials: "include" });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setDisputes(Array.isArray(data) ? data : []);
    } catch {
      console.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  const resolveDispute = async (disputeId: string, outcome: "TECHNICIAN_WINS" | "EMPLOYER_WINS") => {
    setActionLoading(disputeId + outcome);
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ disputeId, outcome }),
      });
      if (res.ok) {
        const newStatus = outcome === "TECHNICIAN_WINS" ? "RESOLVED_TECHNICIAN" : "RESOLVED_EMPLOYER";
        setDisputes((prev) =>
          prev.map((d) => d.id === disputeId ? { ...d, status: newStatus, outcome } : d)
        );
      }
    } catch {
      console.error("Failed to resolve dispute");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = disputes.filter((d) => {
    if (activeTab === "OPEN" && d.status !== "OPEN") return false;
    if (activeTab === "IN_REVIEW" && d.status !== "IN_REVIEW") return false;
    if (activeTab === "RESOLVED" && !isResolved(d.status)) return false;
    if (activeTab === "WITHDRAWN" && d.status !== "WITHDRAWN") return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        d.reason?.toLowerCase().includes(q) ||
        d.employer?.name?.toLowerCase().includes(q) ||
        d.technician?.name?.toLowerCase().includes(q) ||
        d.jobRequest?.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    ALL:       disputes.length,
    OPEN:      disputes.filter((d) => d.status === "OPEN").length,
    IN_REVIEW: disputes.filter((d) => d.status === "IN_REVIEW").length,
    RESOLVED:  disputes.filter((d) => isResolved(d.status)).length,
    WITHDRAWN: disputes.filter((d) => d.status === "WITHDRAWN").length,
  };

  const STAT_CARDS = [
    { key:"ALL",       label:"Total disputes", icon:Gavel,       gradient:"from-stone-500 to-stone-700",  ring:"ring-white/10" },
    { key:"OPEN",      label:"Open",           icon:AlertCircle, gradient:"from-red-500 to-rose-600",     ring:"ring-red-500/15" },
    { key:"IN_REVIEW", label:"In Review",      icon:Clock,       gradient:"from-amber-500 to-orange-500", ring:"ring-amber-500/15" },
    { key:"RESOLVED",  label:"Resolved",       icon:CheckCircle, gradient:"from-emerald-500 to-teal-600", ring:"ring-emerald-500/15" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0c0a09] relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage:"linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
      <div className="fixed top-0 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 -left-32 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

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
          <Link href="/admin/dashboard" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname==="/admin/dashboard"?"bg-red-500 text-white":"text-white/50 hover:text-white"}`}>
            <LayoutDashboard size={13} /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link href="/admin/disputes" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname==="/admin/disputes"?"bg-red-500 text-white":"text-white/50 hover:text-white"}`}>
            <Gavel size={13} /> <span className="hidden sm:inline">Disputes</span>
          </Link>
          <Link href="/admin/users" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname==="/admin/users"?"bg-red-500 text-white":"text-white/50 hover:text-white"}`}>
            <Users size={13} /> <span className="hidden sm:inline">Users</span>
          </Link>
          <Link href="/admin/technicians" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname==="/admin/technicians"?"bg-red-500 text-white":"text-white/50 hover:text-white"}`}>
            <Wrench size={13} /> <span className="hidden sm:inline">Technicians</span>
          </Link>
          <Link href="/admin/employers" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/employers" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <Briefcase size={13} /> <span className="hidden sm:inline">Employers</span>
          </Link>
          <Link href="/admin/support" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pathname === "/admin/support" ? "bg-red-500 text-white" : "text-white/50 hover:text-white"}`}>
            <MessageSquare size={13} /> <span className="hidden sm:inline">Support</span>
          </Link>
        </div>
        <motion.button onClick={handleLogout} whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
          className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 transition-colors shrink-0">
          <LogOut size={13} /> <span className="hidden sm:inline">Logout</span>
        </motion.button>
      </nav>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={mountEase} className="mb-6">
          <h1 className="text-3xl font-black text-white">Dispute Queue</h1>
          <p className="text-white/40 text-sm mt-1">Review evidence and resolve disputes between employers and technicians</p>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{...mountEase,delay:0.06}}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{...mountEase,delay:0.08}} className="mb-4">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search by name, reason, or job description"
              className="w-full bg-white/4 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/40 transition-colors" />
          </div>
        </motion.div>

        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{...mountEase,delay:0.1}}
          className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <motion.button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                className="relative px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5">
                {isActive && <motion.div layoutId="admin-disputes-tab-pill" transition={spring} className="absolute inset-0 bg-red-500 rounded-xl" />}
                <span className={`relative z-10 ${isActive?"text-white":"text-white/50"}`}>{tab.label}</span>
                {counts[tab.key] > 0 && (
                  <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive?"bg-white/25 text-white":"bg-white/10 text-white/50"}`}>
                    {counts[tab.key]}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i)=><div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} transition={mountEase}
            className="text-center py-16 bg-white/3 rounded-2xl border border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Inbox size={22} className="text-white/30" />
            </div>
            <p className="text-white/60 font-semibold text-base mb-1">No disputes found</p>
            <p className="text-white/30 text-sm">Try a different filter or search term</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((dispute, i) => {
                const statusCfg = STATUS_STYLES[dispute.status] ?? STATUS_STYLES.OPEN;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expanded === dispute.id;
                const resolved = isResolved(dispute.status);
                const withdrawn = dispute.status === "WITHDRAWN";
                const isActing = actionLoading?.startsWith(dispute.id);

                const arrivedPhotos: string[] = dispute.arrivedImages ?? [];
                const completedPhotos: string[] = dispute.completedImages ?? [];
                const defensePhotos: string[] = dispute.defenseImages ?? [];

                return (
                  <motion.div key={dispute.id} layout
                    initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
                    exit={{opacity:0,y:-8,scale:0.98}}
                    transition={{...mountEase,delay:i*0.03}}
                    className={`bg-white/4 border rounded-2xl overflow-hidden ${
                      dispute.status==="OPEN" ? "border-red-500/20"
                      : resolved ? "border-emerald-500/15"
                      : withdrawn ? "border-white/5 opacity-70"
                      : "border-white/10"
                    }`}>

                    <button onClick={()=>setExpanded(isExpanded?null:dispute.id)}
                      className="w-full text-left p-4 hover:bg-white/3 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center text-sm font-bold shrink-0 text-red-300">
                          {dispute.employer?.name ? initials(dispute.employer.name) : <Gavel size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                              <StatusIcon size={10} /> {statusCfg.label}
                            </span>
                            <span className="text-white/30 text-xs">{timeAgo(dispute.createdAt)}</span>
                          </div>
                          <p className="text-white font-semibold text-sm truncate">
                            {dispute.employer?.name ?? "Unknown"} vs {dispute.technician?.name ?? "Unknown"}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5 truncate">
                            {dispute.reason?.slice(0,80)}{dispute.reason?.length>80?"…":""}
                          </p>
                        </div>
                        <motion.div animate={{rotate:isExpanded?180:0}} transition={spring} className="text-white/30 shrink-0 mt-1">
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                          exit={{height:0,opacity:0}} transition={{duration:0.28,ease:[0.25,0.1,0.25,1]}}
                          className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">

                            <div className="bg-white/5 rounded-xl p-3">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <MessageSquare size={10} /> Reason filed
                              </p>
                              <p className="text-white/80 text-sm leading-relaxed">{dispute.reason ?? "No reason provided"}</p>
                            </div>

                            {dispute.jobRequest?.description && (
                              <div className="bg-white/5 rounded-xl p-3">
                                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <Briefcase size={10} /> Job description
                                </p>
                                <p className="text-white/70 text-sm leading-relaxed">{dispute.jobRequest.description}</p>
                                {dispute.jobRequest.offeredPrice && (
                                  <p className="text-white/40 text-xs mt-1.5">
                                    Offered: ₦{Number(dispute.jobRequest.offeredPrice).toLocaleString()}
                                    {dispute.jobRequest.counterPrice ? ` · Counter: ₦${Number(dispute.jobRequest.counterPrice).toLocaleString()}` : ""}
                                  </p>
                                )}
                              </div>
                            )}

                            <div className="space-y-2">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider flex items-center gap-1">
                                <Camera size={10} /> Evidence Photos
                              </p>
                              <PhotoStrip label="On Arrival" icon={Camera} photos={arrivedPhotos} accent="bg-sky-500/8 border border-sky-500/15" />
                              <PhotoStrip label="On Completion" icon={ImageIcon} photos={completedPhotos} accent="bg-emerald-500/8 border border-emerald-500/15" />
                              <PhotoStrip label="Defense Photos" icon={Camera} photos={defensePhotos} accent="bg-orange-500/8 border border-orange-500/15" />
                              {arrivedPhotos.length === 0 && completedPhotos.length === 0 && defensePhotos.length === 0 && (
                                <p className="text-white/20 text-xs italic">No photos submitted for this dispute.</p>
                              )}
                            </div>

                            {dispute.defenseStatement && (
                              <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-3">
                                <p className="text-orange-300 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Technician's defense</p>
                                <p className="text-white/70 text-sm leading-relaxed">{dispute.defenseStatement}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-sky-500/8 border border-sky-500/15 rounded-xl p-3">
                                <p className="text-sky-300 text-[10px] font-semibold uppercase tracking-wider mb-1">Employer (filer)</p>
                                <p className="text-white text-sm font-medium">{dispute.employer?.name ?? "—"}</p>
                                <p className="text-white/40 text-xs truncate">{dispute.employer?.email ?? ""}</p>
                              </div>
                              <div className="bg-orange-500/8 border border-orange-500/15 rounded-xl p-3">
                                <p className="text-orange-300 text-[10px] font-semibold uppercase tracking-wider mb-1">Technician</p>
                                <p className="text-white text-sm font-medium">{dispute.technician?.name ?? "—"}</p>
                                <p className="text-white/40 text-xs truncate">{dispute.technician?.email ?? ""}</p>
                                {dispute.technician?.technicianProfile?.serviceCategory && (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <Star size={10} className="text-amber-400" />
                                    <span className="text-white/50 text-[11px]">
                                      {dispute.technician.technicianProfile.averageRating?.toFixed(1) ?? "0.0"} · {dispute.technician.technicianProfile.rank} rank
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {withdrawn && (
                              <div className="bg-stone-500/10 border border-stone-500/20 rounded-xl p-3 flex items-center gap-2">
                                <XCircle size={14} className="text-stone-400" />
                                <p className="text-stone-400 text-sm">Employer withdrew this dispute. No action needed.</p>
                              </div>
                            )}

                            {resolved && (
                              <div className={`rounded-xl p-3 flex items-center gap-2 ${
                                dispute.status==="RESOLVED_TECHNICIAN"
                                  ? "bg-emerald-500/10 border border-emerald-500/20"
                                  : "bg-sky-500/10 border border-sky-500/20"
                              }`}>
                                <CheckCircle size={15} className={dispute.status==="RESOLVED_TECHNICIAN"?"text-emerald-400":"text-sky-400"} />
                                <p className={`text-sm font-semibold ${dispute.status==="RESOLVED_TECHNICIAN"?"text-emerald-300":"text-sky-300"}`}>
                                  {dispute.status==="RESOLVED_TECHNICIAN" ? "Technician won — rank restored" : "Employer won — technician rank docked"}
                                </p>
                              </div>
                            )}

                            {!resolved && !withdrawn && (
                              <div className="flex gap-2 pt-1">
                                <motion.button onClick={()=>resolveDispute(dispute.id,"EMPLOYER_WINS")}
                                  disabled={!!isActing}
                                  whileHover={{scale:1.02}} whileTap={{scale:0.97}} transition={hoverSpring}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-linear-to-br from-sky-500 to-blue-600 text-white disabled:opacity-50">
                                  {actionLoading===dispute.id+"EMPLOYER_WINS" ? <Spinner size="sm" /> : "Employer Wins"}
                                </motion.button>
                                <motion.button onClick={()=>resolveDispute(dispute.id,"TECHNICIAN_WINS")}
                                  disabled={!!isActing}
                                  whileHover={{scale:1.02}} whileTap={{scale:0.97}} transition={hoverSpring}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-linear-to-br from-emerald-500 to-teal-600 text-white disabled:opacity-50">
                                  {actionLoading===dispute.id+"TECHNICIAN_WINS" ? <Spinner size="sm" /> : "Technician Wins"}
                                </motion.button>
                              </div>
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