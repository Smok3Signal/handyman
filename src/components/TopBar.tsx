"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Bell,
  LogOut,
  ChevronDown,
  User,
  Settings,
  X,
  ArrowRight,
  Briefcase,
  MessageSquare,
  Star,
  RefreshCw,
  ShieldAlert,
  Info,
  AlertTriangle,
} from "lucide-react";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const popEase: Transition = { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] };

const N_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; dot: string; label: string }
> = {
  JOB_REQUEST:     { icon: Briefcase,     color: "bg-sky-100 text-sky-600",        dot: "bg-sky-500",     label: "Job Request"     },
  JOB_UPDATE:      { icon: RefreshCw,     color: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500", label: "Job Update"      },
  COUNTER_OFFER:   { icon: ArrowRight,    color: "bg-violet-100 text-violet-600",   dot: "bg-violet-500",  label: "Counter Offer"   },
  MESSAGE:         { icon: MessageSquare, color: "bg-amber-100 text-amber-600",     dot: "bg-amber-500",   label: "Message"         },
  REVIEW:          { icon: Star,          color: "bg-pink-100 text-pink-600",       dot: "bg-pink-500",    label: "Review"          },
  DISPUTE:         { icon: ShieldAlert,   color: "bg-red-100 text-red-600",         dot: "bg-red-500",     label: "Dispute"         },
  DISTRESS_SIGNAL: { icon: AlertTriangle, color: "bg-orange-100 text-orange-600",   dot: "bg-orange-500",  label: "Distress Signal" },
};
const N_DEFAULT = { icon: Info, color: "bg-stone-100 text-stone-500", dot: "bg-stone-400", label: "Notification" };

function nConfig(type: string) {
  return N_CONFIG[type] ?? N_DEFAULT;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Click-outside hook ────────────────────────────────────────────────────────
function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const listener = (e: MouseEvent) => {
      if (refs.some((r) => r.current?.contains(e.target as Node))) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [enabled, handler, ...refs]);
}

// ── Notification detail modal ─────────────────────────────────────────────────
function NotificationDetailModal({
  n, onClose, onMarkRead,
}: {
  n: any; onClose: () => void; onMarkRead: (id: string) => void;
}) {
  const router = useRouter();
  const cfg = nConfig(n.type);
  const Icon = cfg.icon;

  const handleAction = (href: string) => {
    onMarkRead(n.id);
    onClose();
    router.push(href);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="card"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="fixed z-70 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-2rem))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-stone-100">
          <div className="relative bg-linear-to-br from-stone-900 via-stone-900 to-stone-800 px-6 pt-6 pb-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={13} className="text-white" />
            </button>
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${cfg.color}`}>
              <Icon size={20} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">{cfg.label}</p>
            <h3 className="text-white font-bold text-lg leading-snug">{n.title}</h3>
          </div>
          <div className="-mt-3 bg-white rounded-t-3xl px-6 pt-5 pb-6 space-y-5">
            <p className="text-stone-600 text-sm leading-relaxed">{n.message}</p>
            <p className="text-stone-400 text-xs">{timeAgo(n.createdAt)}</p>
            <div className="flex flex-col gap-2.5">
              {n.link && (
                <button
                  onClick={() => handleAction(n.link)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Go to {pageName(n.link)}
                  <ArrowRight size={15} />
                </button>
              )}
              <button
                onClick={() => handleAction("/notifications")}
                className="w-full border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium text-sm py-3 rounded-xl transition-colors"
              >
                View all notifications
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function pageName(link: string) {
  const seg = link?.split("/").filter(Boolean);
  if (!seg?.length) return "page";

  // Distress signal detail: /technician/distress/[id]
  if (seg[0] === "technician" && seg[1] === "distress" && seg.length === 3) return "Distress Signal";

  const last = seg[seg.length - 1];
  const map: Record<string, string> = {
    disputes:      "Disputes",
    jobs:          "Jobs",
    earnings:      "Earnings",
    portfolio:     "Portfolio",
    dashboard:     "Dashboard",
    notifications: "Notifications",
    profile:       "Profile",
    support:       "Support",
    leaderboard:   "Leaderboard",
    distress:      "Distress Feed",
  };
  return map[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}

// ── Bell dropdown ─────────────────────────────────────────────────────────────
function NotificationDropdown({
  notifications, onSelect, onClose, onMarkAllRead,
}: {
  notifications: any[];
  onSelect: (n: any) => void;
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  const preview = notifications.slice(0, 3);
  const hasMore = notifications.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={popEase}
      className="absolute right-0 top-12 w-80 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl shadow-stone-200/70 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-stone-500" />
          <span className="text-sm font-semibold text-stone-800">Notifications</span>
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </div>
        {notifications.filter((n) => !n.read).length > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-orange-500 font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {preview.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-2 text-stone-400">
          <Bell size={24} strokeWidth={1.5} />
          <p className="text-sm">You're all caught up</p>
        </div>
      ) : (
        <div className="divide-y divide-stone-50">
          {preview.map((n) => {
            const cfg = nConfig(n.type);
            const Icon = cfg.icon;
            return (
              <motion.button
                key={n.id}
                whileHover={{ backgroundColor: "#fafaf9" }}
                onClick={() => { onClose(); onSelect(n); }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${!n.read ? "bg-orange-50/50" : ""}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${cfg.color}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">{n.title}</p>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-stone-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${cfg.dot}`} />}
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="border-t border-stone-100 px-4 py-2.5">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors py-0.5"
        >
          {hasMore ? `See all ${notifications.length} notifications` : "View all notifications"}
          <ArrowRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export default function TopBar({ title }: { title?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showBell, setShowBell] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeN, setActiveN] = useState<any>(null);
  const user = session?.user as any;

  // Refs for click-outside
  const bellRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close bell on outside click
  useClickOutside([bellRef], useCallback(() => setShowBell(false), []), showBell);
  // Close menu on outside click
  useClickOutside([menuRef], useCallback(() => setShowMenu(false), []), showMenu);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch {}
  }, [session]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  const handleSelectNotification = (n: any) => {
    if (!n.read) markRead(n.id);
    setActiveN(n);
    setShowBell(false);
  };

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-stone-200/80 flex items-center justify-between px-5 sticky top-0 z-30">
        <h1 className="text-[15px] font-bold text-stone-800 tracking-tight">
          {title || "HandyMan"}
        </h1>

        <div className="flex items-center gap-1">

          {/* Bell */}
          <div className="relative" ref={bellRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={spring}
              onClick={() => { setShowBell((v) => !v); setShowMenu(false); }}
              className="relative w-9 h-9 flex items-center justify-center hover:bg-stone-100 rounded-xl transition-colors"
            >
              <Bell size={18} className="text-stone-500" strokeWidth={1.8} />
              <AnimatePresence>
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={spring}
                    className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold leading-none"
                  >
                    {unread > 9 ? "9+" : unread}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <AnimatePresence>
              {showBell && (
                <NotificationDropdown
                  notifications={notifications}
                  onSelect={handleSelectNotification}
                  onClose={() => setShowBell(false)}
                  onMarkAllRead={markAllRead}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-5 bg-stone-200 mx-1" />

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={() => { setShowMenu((v) => !v); setShowBell(false); }}
              className="flex items-center gap-2 hover:bg-stone-100 rounded-xl pl-1 pr-2.5 py-1.5 transition-colors"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user?.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-orange-100"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-semibold text-stone-700 hidden md:block">
                {user?.name?.split(" ")[0]}
              </span>
              <motion.div
                animate={{ rotate: showMenu ? 180 : 0 }}
                transition={spring}
                className="hidden md:block"
              >
                <ChevronDown size={13} className="text-stone-400" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={popEase}
                  className="absolute right-0 top-12 bg-white border border-stone-200 rounded-2xl shadow-xl shadow-stone-200/60 w-52 py-1.5 z-50 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user?.name}
                          className="w-8 h-8 rounded-full object-cover border border-orange-100 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-800 truncate leading-tight">{user?.name}</p>
                        <p className="text-xs text-stone-400 truncate leading-tight">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link href="/profile" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                      <User size={14} strokeWidth={2} /> My Profile
                    </Link>
                    <button
                      onClick={() => { setShowMenu(false); setShowBell(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                    >
                      <Bell size={14} strokeWidth={2} />
                      Notifications
                      {unread > 0 && (
                        <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none">
                          {unread}
                        </span>
                      )}
                    </button>
                    <Link href="/support" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                      <Settings size={14} strokeWidth={2} /> Support
                    </Link>
                  </div>

                  <div className="border-t border-stone-100 py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} strokeWidth={2} /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notification detail modal */}
      <AnimatePresence>
        {activeN && (
          <NotificationDetailModal
            n={activeN}
            onClose={() => setActiveN(null)}
            onMarkRead={markRead}
          />
        )}
      </AnimatePresence>
    </>
  );
}