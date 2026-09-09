"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquare,
  Star,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  Info,
  ChevronDown,
} from "lucide-react";

// ── Transitions ───────────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const spring: Transition = { type: "spring", stiffness: 400, damping: 28 };

// ── Notification type config ──────────────────────────────────────────────────
const N_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; dot: string; ring: string; label: string; groupLabel: string }
> = {
  JOB_REQUEST:  { icon: Briefcase,     color: "bg-sky-100 text-sky-600",         dot: "bg-sky-500",     ring: "border-l-sky-400",     label: "Job Request",   groupLabel: "Job Requests"   },
  JOB_UPDATE:   { icon: RefreshCw,     color: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500", ring: "border-l-emerald-400", label: "Job Update",    groupLabel: "Job Updates"    },
  COUNTER_OFFER:{ icon: ArrowRight,    color: "bg-violet-100 text-violet-600",   dot: "bg-violet-500",  ring: "border-l-violet-400",  label: "Counter Offer", groupLabel: "Counter Offers" },
  MESSAGE:      { icon: MessageSquare, color: "bg-amber-100 text-amber-600",     dot: "bg-amber-500",   ring: "border-l-amber-400",   label: "Message",       groupLabel: "Messages"       },
  REVIEW:       { icon: Star,          color: "bg-pink-100 text-pink-600",       dot: "bg-pink-500",    ring: "border-l-pink-400",    label: "Review",        groupLabel: "Reviews"        },
  DISPUTE:      { icon: ShieldAlert,   color: "bg-red-100 text-red-600",         dot: "bg-red-500",     ring: "border-l-red-400",     label: "Dispute",       groupLabel: "Disputes"       },
};
const N_DEFAULT = {
  icon: Info, color: "bg-stone-100 text-stone-500",
  dot: "bg-stone-400", ring: "border-l-stone-300", label: "Notification", groupLabel: "Notifications",
};
function nConfig(type: string) { return N_CONFIG[type] ?? N_DEFAULT; }

// ── Relative time ─────────────────────────────────────────────────────────────
function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
const TABS = ["All", "Unread", "Jobs", "Messages", "Disputes"] as const;
type Tab = typeof TABS[number];

function filterNotifications(list: any[], tab: Tab) {
  switch (tab) {
    case "Unread":   return list.filter((n) => !n.read);
    case "Jobs":     return list.filter((n) => ["JOB_REQUEST", "JOB_UPDATE", "COUNTER_OFFER"].includes(n.type));
    case "Messages": return list.filter((n) => n.type === "MESSAGE");
    case "Disputes": return list.filter((n) => n.type === "DISPUTE");
    default:         return list;
  }
}

// ── Group by type ─────────────────────────────────────────────────────────────
type NotifGroup = {
  type: string;
  items: any[];
  unreadCount: number;
  latestAt: string;
};

function groupNotifications(list: any[]): NotifGroup[] {
  const map = new Map<string, any[]>();
  for (const n of list) {
    const key = n.type ?? "INFO";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return Array.from(map.entries())
    .map(([type, items]) => ({
      type,
      items, // already sorted newest-first from API
      unreadCount: items.filter((n) => !n.read).length,
      latestAt: items[0]?.createdAt ?? "",
    }))
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-20" />
      ))}
    </div>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ n, onClick }: { n: any; onClick: () => void }) {
  const cfg = nConfig(n.type);
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={mountEase}
      whileHover={{ x: 3, transition: spring }}
      onClick={onClick}
      className={`relative bg-white border border-stone-100 border-l-[3px] ${cfg.ring} rounded-xl px-4 py-3.5 cursor-pointer hover:shadow-sm transition-shadow flex items-start gap-3`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color}`}>
        <Icon size={15} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-800 leading-snug truncate">{n.title}</p>
          <span className="text-[11px] text-stone-400 shrink-0">{timeAgo(n.createdAt)}</span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${cfg.dot}`} />
      )}
    </motion.div>
  );
}

// ── Group card ────────────────────────────────────────────────────────────────
function GroupCard({
  group,
  onMarkGroupRead,
  onClickNotif,
}: {
  group: NotifGroup;
  onMarkGroupRead: (ids: string[]) => void;
  onClickNotif: (n: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = nConfig(group.type);
  const Icon = cfg.icon;
  const { items, unreadCount, latestAt } = group;
  const preview = items[0]; // most recent

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={mountEase}
      className="bg-white border border-stone-200 rounded-2xl overflow-hidden"
    >
      {/* Group header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3.5 px-4 py-4 hover:bg-stone-50 transition-colors text-left"
      >
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${cfg.color}`}>
          <Icon size={16} />
        </div>

        {/* Label + preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-stone-800">{cfg.groupLabel}</span>
            {unreadCount > 0 && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white ${cfg.dot}`}>
                {unreadCount} new
              </span>
            )}
          </div>
          {!open && preview && (
            <p className="text-xs text-stone-400 truncate leading-relaxed">{preview.message}</p>
          )}
        </div>

        {/* Right side */}
        <div className="shrink-0 flex items-center gap-2.5">
          <span className="text-[11px] text-stone-400">{timeAgo(latestAt)}</span>
          <span className="text-xs font-semibold text-stone-400 bg-stone-100 rounded-lg px-2 py-0.5">
            {items.length}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring}
          >
            <ChevronDown size={15} className="text-stone-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded notification list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-stone-100 px-3 py-3 space-y-2">
              {/* Mark group read button */}
              {unreadCount > 0 && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkGroupRead(items.filter((n) => !n.read).map((n) => n.id));
                    }}
                    className="text-[11px] font-semibold text-stone-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                  >
                    <CheckCheck size={12} />
                    Mark group as read
                  </button>
                </div>
              )}
              {items.map((n) => (
                <NotifRow
                  key={n.id}
                  n={n}
                  onClick={() => onClickNotif(n)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("All");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchNotifications();
  }, [status]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = async (ids: string[]) => {
    setNotifications((prev) =>
      prev.map((n) => ids.includes(n.id) ? { ...n, read: true } : n)
    );
    // Mark each one individually using existing API
    await Promise.all(
      ids.map((id) =>
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        })
      )
    );
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
  };

  const handleClickNotif = (n: any) => {
    if (!n.read) markRead([n.id]);
    if (n.link) router.push(n.link);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filterNotifications(notifications, activeTab);
  const groups = groupNotifications(filtered);

  return (
    <Layout title="Notifications">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 px-7 py-7 text-white"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <Bell size={16} className="text-orange-400" strokeWidth={2} />
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Inbox</p>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
              <p className="text-stone-400 text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="shrink-0 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Filter tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.08 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {TABS.map((tab) => {
            const count = filterNotifications(notifications, tab).filter((n) => !n.read).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {tab}
                {count > 0 && activeTab !== tab && (
                  <span className="ml-1.5 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Grouped list ── */}
        {loading ? (
          <Skeleton />
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-20 text-stone-400"
          >
            <Bell size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">
              {activeTab === "All" ? "No notifications yet" : `No ${activeTab.toLowerCase()} notifications`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard
                key={group.type}
                group={group}
                onMarkGroupRead={markRead}
                onClickNotif={handleClickNotif}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}