"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import Layout from "@/components/Layout";
import DistressSignalModal from "@/components/DistressSignalModal";
import DistressProposalsDrawer from "@/components/DistressProposalsDrawer";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  Star,
  Search,
  ListChecks,
  Activity,
  BarChart2,
  ChevronRight,
  Zap,
  TrendingUp,
  Siren,
  X,
  Loader2,
} from "lucide-react";

const hoverSpring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const LOCATION_FALLBACK_MS = 60_000;
const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;

// FIX-09: statuses considered "closed" for routing recent-job clicks.
// Closed -> /employer/jobs (history). Anything else -> /employer/ongoing.
const TERMINAL_JOB_STATUSES = ["COMPLETED", "SATISFIED", "DECLINED", "CANCELLED"];
const getJobRoute = (status: string) =>
  TERMINAL_JOB_STATUSES.includes(status) ? "/employer/jobs" : "/employer/ongoing";

function SpringCard({
  children,
  className = "",
  style = {},
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const content = (
    <motion.div
      animate={
        pressed ? { scale: 0.97, y: 0 } : hovered ? { scale: 1.02, y: -2 } : { scale: 1, y: 0 }
      }
      transition={hoverSpring}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
      className={`relative rounded-2xl overflow-hidden ${href || onClick ? "cursor-pointer" : ""} ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountEase, delay }}
    >
      <SpringCard
        style={{ background: gradient }}
        className="p-5 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
      >
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <TrendingUp className="w-4 h-4 text-white/40" />
        </div>
        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
        <div className="text-xs font-semibold text-white/70 mt-1 uppercase tracking-wide">{label}</div>
      </SpringCard>
    </motion.div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  color,
  delay = 0,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  color: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountEase, delay }}
    >
      <SpringCard href={onClick ? undefined : href} onClick={onClick}>
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: color }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-stone-600 text-center">{label}</span>
        </div>
      </SpringCard>
    </motion.div>
  );
}

type Job = {
  id: string;
  description: string;
  status: string;
  offeredPrice: number;
  createdAt: string;
  technician?: { name: string };
};

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

type Technician = {
  id: string;
  name: string;
  technicianProfile?: {
    serviceCategory: string;
    averageRating: number;
    rank: string;
  };
  distance?: number;
};

type ActiveSignal = {
  id: string;
  category: string;
  description: string;
  radiusKm: number;
  expiresAt: string;
  _count: { proposals: number };
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; text: string }> = {
  PENDING:            { label: "Pending",    color: "#ea580c", bg: "#fff7ed", text: "#9a3412" },
  ACCEPTED:           { label: "Accepted",   color: "#059669", bg: "#ecfdf5", text: "#065f46" },
  DECLINED:           { label: "Declined",   color: "#dc2626", bg: "#fef2f2", text: "#991b1b" },
  ON_THE_WAY:         { label: "On the way", color: "#2563eb", bg: "#eff6ff", text: "#1e40af" },
  IN_PROGRESS:        { label: "In progress",color: "#7c3aed", bg: "#f5f3ff", text: "#4c1d95" },
  COMPLETED:          { label: "Completed",  color: "#059669", bg: "#ecfdf5", text: "#065f46" },
  SATISFIED:          { label: "Satisfied",  color: "#059669", bg: "#ecfdf5", text: "#065f46" },
  DISPUTED:           { label: "Disputed",   color: "#d97706", bg: "#fffbeb", text: "#92400e" },
  EMPLOYER_COUNTERED: { label: "Countered",  color: "#0891b2", bg: "#ecfeff", text: "#164e63" },
  COUNTERED:          { label: "Countered",  color: "#0891b2", bg: "#ecfeff", text: "#164e63" },
};

export default function EmployerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nearbyTechs, setNearbyTechs] = useState<Technician[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showDistress, setShowDistress] = useState(false);
  const [showProposals, setShowProposals] = useState(false);
  const [activeSignal, setActiveSignal] = useState<ActiveSignal | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);

  const locationResolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ROLE GUARD: this page assumes an EMPLOYER session. Without this check,
  // a technician account hitting this URL directly would render employer
  // UI/data and crash on employer-only endpoints — same failure class as
  // the /technician/dashboard bug.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "EMPLOYER") {
      router.push("/technician/dashboard");
    }
  }, [status, router, session]);

  const fetchNearbyTechs = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`/api/technicians?lat=${latitude}&lng=${longitude}&radius=50`);
      const data = await res.json();
      setNearbyTechs(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch {
      setNearbyTechs([]);
    }
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const persistLocation = useCallback(async (latitude: number, longitude: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("persistLocation failed:", res.status, body);
        return false;
      }
      return true;
    } catch (err) {
      console.error("persistLocation network error:", err);
      return false;
    }
  }, []);

  // Background-only now: the manual Save/Detect/Autocomplete UI was removed
  // from the dashboard hero (location picking lives on /employer/find now).
  // This still runs silently once, ~60s after mount, if no saved profile
  // location was found — so "Technicians nearby" still has something to
  // work with for first-time users instead of staying on the Lagos default
  // forever.
  const detectLocationSilently = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        locationResolvedRef.current = true;
        clearFallbackTimer();
        await Promise.all([
          fetchNearbyTechs(latitude, longitude),
          persistLocation(latitude, longitude),
        ]);
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
      },
      { timeout: 10000 }
    );
  }, [fetchNearbyTechs, persistLocation, clearFallbackTimer]);

  const fetchActiveSignal = useCallback(async () => {
    try {
      const res = await fetch("/api/distress");
      const data = await res.json();
      if (Array.isArray(data)) {
        const active = data.find((s: ActiveSignal & { status: string; expiresAt: string }) =>
          s.status === "ACTIVE" && new Date(s.expiresAt) > new Date()
        );
        setActiveSignal(active ?? null);
      }
    } catch {
      // silently fail — non-critical
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "EMPLOYER") return;

    const baseDataPromise = Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/notifications").then((r) => r.json()),
    ]);

    fetch("/api/profile")
      .then((r) => r.json())
      .then(async (profileData) => {
        const savedLat = profileData?.latitude;
        const savedLng = profileData?.longitude;
        if (typeof savedLat === "number" && typeof savedLng === "number") {
          setLat(savedLat);
          setLng(savedLng);
          locationResolvedRef.current = true;
          await fetchNearbyTechs(savedLat, savedLng);
          return;
        }

        await fetchNearbyTechs(DEFAULT_LAT, DEFAULT_LNG);
        fallbackTimerRef.current = setTimeout(() => {
          if (!locationResolvedRef.current) detectLocationSilently();
        }, LOCATION_FALLBACK_MS);
      })
      .catch(async () => {
        await fetchNearbyTechs(DEFAULT_LAT, DEFAULT_LNG);
        fallbackTimerRef.current = setTimeout(() => {
          if (!locationResolvedRef.current) detectLocationSilently();
        }, LOCATION_FALLBACK_MS);
      });

    baseDataPromise.then(([j, n]) => {
      setJobs(Array.isArray(j) ? j : []);
      setNotifications(Array.isArray(n) ? n : []);
      setLoadingData(false);
    });

    fetchActiveSignal();

    return () => clearFallbackTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const handleSignalSent = useCallback((signalId: string) => {
    fetchActiveSignal();
    void signalId;
  }, [fetchActiveSignal]);

  const handleCancelSignal = async () => {
    if (!activeSignal) return;
    setCancelling(true);
    try {
      await fetch(`/api/distress/${activeSignal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setActiveSignal(null);
    } catch {
      // silently fail
    } finally {
      setCancelling(false);
    }
  };

  // FIX-09: clicking a notification marks it read (optimistic UI update +
  // PATCH to persist) and navigates to its `link` field, if present.
  const handleNotificationClick = useCallback(async (n: Notification) => {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id, read: true }),
        });
        if (!res.ok) console.error("Mark-read failed:", res.status);
      } catch (err) {
        console.error("Mark-read network error:", err);
      }
    }
    if (n.link) router.push(n.link);
  }, [router]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const activeJobs = jobs.filter((j) =>
    ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"].includes(j.status)
  ).length;
  const pendingJobs = jobs.filter((j) => j.status === "PENDING").length;
  const completedJobs = jobs.filter((j) =>
    ["SATISFIED", "COMPLETED"].includes(j.status)
  ).length;
  const totalSpent = jobs
    .filter((j) => ["SATISFIED", "COMPLETED"].includes(j.status))
    .reduce((sum, j) => sum + j.offeredPrice, 0);

  const unread = notifications.filter((n) => !n.read).length;

  if (status === "loading" || loadingData) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" showBack={false}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative rounded-2xl overflow-hidden p-7 shadow-[0_4px_24px_rgba(249,115,22,0.15)]"
          style={{
            background:
              "linear-gradient(135deg, #431407 0%, #7c2d12 45%, #c2410c 75%, #f97316 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 55%)",
            }}
          />
          <div
            className="pointer-events-none absolute -right-10 -top-10 w-52 h-52 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, #fb923c, transparent)" }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-orange-200" fill="#fed7aa" />
              <span className="text-orange-200/80 text-xs font-semibold uppercase tracking-wider">
                {greeting}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {session?.user?.name?.split(" ")[0] ?? "There"} 👋
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {activeJobs > 0
                ? `You have ${activeJobs} active job${activeJobs > 1 ? "s" : ""} in progress`
                : "Ready to find a technician?"}
            </p>

            {/* Active distress signal banner */}
            <AnimatePresence>
              {activeSignal && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer"
                  style={{ background: "rgba(220,38,38,0.35)", backdropFilter: "blur(6px)", border: "1px solid rgba(252,165,165,0.3)" }}
                  onClick={() => setShowProposals(true)}
                >
                  <Siren className="w-4 h-4 text-red-200 animate-pulse shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white">Distress signal active — tap to view proposals</p>
                    <p className="text-[11px] text-red-200/80 mt-0.5 truncate">
                      {activeSignal.category} · {activeSignal.radiusKm}km radius ·{" "}
                      {activeSignal._count.proposals} proposal{activeSignal._count.proposals !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancelSignal(); }}
                    disabled={cancelling}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white shrink-0 transition-opacity disabled:opacity-60"
                    style={{ background: "rgba(255,255,255,0.15)" }}
                  >
                    {cancelling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {cancelling ? "Cancelling…" : "Recall"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Distress Signal button + unread badge */}
            <div className="mt-4 flex items-center gap-3 flex-wrap">
              {!activeSignal && (
                <motion.button
                  onClick={() => setShowDistress(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={hoverSpring}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-white"
                  style={{ background: "rgba(220,38,38,0.75)", backdropFilter: "blur(6px)" }}
                >
                  <Siren className="w-3.5 h-3.5 animate-pulse" />
                  Distress Signal
                </motion.button>
              )}

              {unread > 0 && (
                <div
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                  style={{ background: "rgba(0,0,0,0.2)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-200 animate-pulse" />
                  {unread} unread notification{unread > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active jobs"  value={activeJobs}    icon={Activity}     gradient="linear-gradient(135deg, #92400e, #b45309, #d97706)" delay={0.05} />
          <StatCard label="Pending"      value={pendingJobs}   icon={Clock}        gradient="linear-gradient(135deg, #1e3a5f, #1d4ed8, #3b82f6)" delay={0.1}  />
          <StatCard label="Completed"    value={completedJobs} icon={CheckCircle2} gradient="linear-gradient(135deg, #064e3b, #059669, #34d399)" delay={0.15} />
          <StatCard label="Total spent"  value={`₦${totalSpent.toLocaleString()}`} icon={BarChart2} gradient="linear-gradient(135deg, #3b0764, #7e22ce, #a855f7)" delay={0.2} />
        </div>

        {/* Quick actions */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3"
          >
            Quick actions
          </motion.h2>
          <div className="grid grid-cols-5 gap-3">
            <QuickAction icon={Search}     label="Find Technician" href="/employer/find"      color="linear-gradient(135deg,#f97316,#ea580c)" delay={0.22} />
            <QuickAction icon={ListChecks} label="My Jobs"         href="/employer/jobs"      color="linear-gradient(135deg,#3b82f6,#1d4ed8)" delay={0.25} />
            <QuickAction icon={Activity}   label="Ongoing"         href="/employer/ongoing"   color="linear-gradient(135deg,#10b981,#059669)" delay={0.28} />
            <QuickAction icon={BarChart2}  label="Analytics"       href="/employer/analytics" color="linear-gradient(135deg,#8b5cf6,#6d28d9)" delay={0.31} />
            <QuickAction icon={Siren}      label="Distress Signal" color="linear-gradient(135deg,#dc2626,#b91c1c)" delay={0.34} onClick={() => setShowDistress(true)} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent jobs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.28 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Recent jobs
              </h2>
              <Link
                href="/employer/jobs"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white">
              {jobs.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <Briefcase className="w-8 h-8 text-stone-300" />
                  <p className="text-sm text-stone-400 font-medium">No jobs yet</p>
                  <Link
                    href="/employer/find"
                    className="text-xs font-semibold text-orange-500 hover:underline"
                  >
                    Find a technician →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {jobs.slice(0, 5).map((job, i) => {
                    const st = STATUS_STYLE[job.status] ?? {
                      label: job.status,
                      color: "#78716c",
                      bg: "#f5f5f4",
                      text: "#44403c",
                    };
                    return (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...mountEase, delay: 0.32 + i * 0.04 }}
                        onClick={() => router.push(getJobRoute(job.status))}
                        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50 transition-colors"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: st.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 truncate">
                            {job.description}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {job.technician?.name ?? "Unassigned"} · ₦
                            {job.offeredPrice.toLocaleString()}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-bold rounded-full px-2.5 py-1 shrink-0"
                          style={{ color: st.text, background: st.bg }}
                        >
                          {st.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Nearby technicians */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.32 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Technicians nearby
              </h2>
              <Link
                href="/employer/find"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                Find more <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {nearbyTechs.length === 0 ? (
                <div className="rounded-2xl py-12 flex flex-col items-center gap-3 border border-stone-200 bg-white">
                  <Search className="w-8 h-8 text-stone-300" />
                  <p className="text-sm text-stone-400 font-medium">No technicians found</p>
                </div>
              ) : (
                nearbyTechs.map((tech, i) => (
                  <motion.div
                    key={tech.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...mountEase, delay: 0.36 + i * 0.05 }}
                  >
                    <SpringCard href={`/technician/${tech.id}`}>
                      <div className="flex items-center gap-4 p-4 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0"
                          style={{ background: "linear-gradient(135deg,#fb923c,#ea580c)" }}
                        >
                          {tech.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-stone-800 truncate">
                            {tech.name}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {tech.technicianProfile?.serviceCategory ?? "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-400" fill="#fbbf24" />
                            <span className="text-xs font-bold text-stone-600">
                              {(tech.technicianProfile?.averageRating ?? 0).toFixed(1)}
                            </span>
                          </div>
                          <span
                            className="text-[10px] font-bold rounded-full px-2 py-0.5"
                            style={{ background: "#fff7ed", color: "#c2410c" }}
                          >
                            {tech.technicianProfile?.rank ?? "Bronze"}
                          </span>
                        </div>
                      </div>
                    </SpringCard>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Notifications preview */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.38 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Notifications
              </h2>
              <Link
                href="/notifications"
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white divide-y divide-stone-100">
              {notifications.slice(0, 4).map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.42 + i * 0.04, duration: 0.25 }}
                  onClick={() => handleNotificationClick(n)}
                  className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-stone-50/80 transition-colors"
                  style={!n.read ? { background: "#fff7ed" } : {}}
                >
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0 animate-pulse" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700">{n.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate">{n.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Distress Signal Modal */}
      {showDistress && (
        <DistressSignalModal
          onClose={() => setShowDistress(false)}
          onSent={(id) => {
            handleSignalSent(id);
            setShowDistress(false);
          }}
        />
      )}

      {/* Distress Proposals Drawer */}
      {showProposals && activeSignal && (
        <DistressProposalsDrawer
          signalId={activeSignal.id}
          onClose={() => setShowProposals(false)}
          onJobCreated={() => {
            setActiveSignal(null);
            setShowProposals(false);
          }}
        />
      )}
    </Layout>
  );
}