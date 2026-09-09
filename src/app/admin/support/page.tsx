"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Headphones,
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  Bug,
  CreditCard,
  User,
  MessageCircle,
  Wrench,
  HardHat,
  Briefcase,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Shield,
  LogOut,
  LayoutDashboard,
  Gavel,
  Users,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  BUG_REPORT:        { label: "Bug Report",          icon: Bug,           color: "bg-red-900/40 text-red-400"     },
  PAYMENT_DISPUTE:   { label: "Payment Dispute",     icon: CreditCard,    color: "bg-amber-900/40 text-amber-400" },
  ACCOUNT_ISSUE:     { label: "Account Issue",       icon: User,          color: "bg-violet-900/40 text-violet-400"},
  GENERAL_ENQUIRY:   { label: "General Enquiry",     icon: MessageCircle, color: "bg-sky-900/40 text-sky-400"     },
  REPORT_TECHNICIAN: { label: "Report a Technician", icon: Wrench,        color: "bg-orange-900/40 text-orange-400"},
  REPORT_EMPLOYER:   { label: "Report an Employer",  icon: HardHat,       color: "bg-stone-700 text-stone-300"    },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:      { label: "Open",      color: "bg-sky-900/50 text-sky-400 border-sky-700",         icon: FileText     },
  IN_REVIEW: { label: "In Review", color: "bg-amber-900/50 text-amber-400 border-amber-700",   icon: Clock        },
  RESOLVED:  { label: "Resolved",  color: "bg-emerald-900/50 text-emerald-400 border-emerald-700", icon: CheckCircle2 },
  CLOSED:    { label: "Closed",    color: "bg-stone-700 text-stone-400 border-stone-600",       icon: XCircle      },
};

const STATUS_TABS = ["all", "OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-stone-800 rounded-2xl h-24" />
      ))}
    </div>
  );
}

// ── Ticket Card ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, onUpdate }: { ticket: any; onUpdate: (updated: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState(ticket.adminReply ?? "");
  const [selectedStatus, setSelectedStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);

  const cat = CATEGORIES[ticket.category] ?? { label: ticket.category, icon: HelpCircle, color: "bg-stone-700 text-stone-300" };
  const CatIcon = cat.icon;
  const statusCfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.CLOSED;
  const StatusIcon = statusCfg.icon;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, adminReply: replyText }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      onUpdate({ ...ticket, status: updated.status, adminReply: updated.adminReply });
      toast.success("Ticket updated");
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setSaving(false);
    }
  };

  const dirty = selectedStatus !== ticket.status || replyText !== (ticket.adminReply ?? "");

  return (
    <div className="bg-stone-800/60 border border-stone-700/50 rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-stone-700/30 transition-colors"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${cat.color}`}>
          <CatIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-stone-100 text-sm leading-snug truncate">{ticket.subject}</p>
            <span className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${statusCfg.color}`}>
              <StatusIcon size={11} />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {cat.label} · {ticket.user?.name ?? "Unknown"} ({ticket.user?.role ?? "?"}) · {new Date(ticket.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-stone-400 mt-1.5 line-clamp-1">{ticket.message}</p>
        </div>
        <div className="shrink-0 text-stone-500 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-stone-700/50 px-5 py-5 space-y-5">
          {/* User info */}
          <div className="flex items-center gap-3 bg-stone-900/40 rounded-xl px-4 py-3">
            <User size={14} className="text-stone-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-stone-200">{ticket.user?.name}</span>
              <span className="text-stone-500 ml-2">{ticket.user?.email}</span>
              <span className="ml-2 text-xs text-stone-500 capitalize">{ticket.user?.role?.toLowerCase()}</span>
            </div>
          </div>

          {/* Full message */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Message</p>
            <p className="text-sm text-stone-300 bg-stone-900/40 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {/* Existing admin reply (read-only view) */}
          {ticket.adminReply && (
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-2">Previous Reply</p>
              <p className="text-sm text-stone-300 bg-orange-950/30 border border-orange-900/40 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap">{ticket.adminReply}</p>
            </div>
          )}

          {/* Status selector */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedStatus(key)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                      selectedStatus === key
                        ? cfg.color + " ring-2 ring-offset-1 ring-offset-stone-800 ring-orange-500"
                        : "border-stone-600 text-stone-400 hover:border-stone-500"
                    }`}
                  >
                    <Icon size={11} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reply box */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              {ticket.adminReply ? "Update Reply" : "Add Reply"}
            </p>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply that will be visible to the user on their support page…"
              className="w-full bg-stone-900/60 border border-stone-600 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminSupportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleLogout = () => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/admin/login");
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support", { credentials: "include" });
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleUpdate = (updated: any) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
  };

  // Client-side filter (search + tab)
  const filtered = tickets.filter((t) => {
    const matchTab = activeTab === "all" || t.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.subject?.toLowerCase().includes(q) ||
      t.message?.toLowerCase().includes(q) ||
      t.user?.name?.toLowerCase().includes(q) ||
      t.user?.email?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Stats
  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inReview: tickets.filter((t) => t.status === "IN_REVIEW").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length,
  };

  const tabLabel = (s: string) => {
    if (s === "all") return `All (${tickets.length})`;
    const count = tickets.filter((t) => t.status === s).length;
    return `${STATUS_CONFIG[s]?.label ?? s}${count > 0 ? ` (${count})` : ""}`;
  };

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

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Headphones size={20} className="text-orange-400" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Support Queue</h1>
          </div>
          <p className="text-stone-400 text-sm ml-13">Review user tickets, update status, and send replies.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total",     value: counts.total,    color: "text-stone-200"   },
            { label: "Open",      value: counts.open,     color: "text-sky-400"     },
            { label: "In Review", value: counts.inReview, color: "text-amber-400"   },
            { label: "Resolved",  value: counts.resolved, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-stone-800/60 border border-stone-700/50 rounded-2xl px-4 py-4">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-stone-500 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search by subject, message, user name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-stone-800/60 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === s
                  ? "bg-orange-500 text-white"
                  : "bg-stone-800 border border-stone-700 text-stone-400 hover:text-white"
              }`}
            >
              {tabLabel(s)}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="bg-stone-800/60 border border-stone-700/50 rounded-2xl p-12 text-center">
            <AlertCircle size={32} className="text-stone-600 mx-auto mb-3" />
            <p className="font-semibold text-stone-400">No tickets found</p>
            <p className="text-sm text-stone-600 mt-1">
              {search ? "Try a different search term" : "No tickets in this category"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}