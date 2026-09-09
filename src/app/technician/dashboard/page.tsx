"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, animate } from "framer-motion";
import type { Transition } from "framer-motion";
import toast from "react-hot-toast";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import RatingStars from "@/components/RatingStars";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import AnalyticsChart from "@/components/AnalyticsChart";
import { usePlacesAutocomplete } from "@/hooks/usePlacesAutocomplete";
import {
  Clock,
  ChevronRight,
  Briefcase,
  Star,
  TrendingUp,
  Wrench,
  CheckCircle,
  ClipboardList,
  Image as ImageIcon,
  Wallet,
  User,
  Navigation,
  Loader2,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };
const LOCATION_FALLBACK_MS = 60_000;

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

const RANK_STYLES: Record<string, { emoji: string; text: string }> = {
  Bronze:   { emoji: "🥉", text: "text-orange-300" },
  Silver:   { emoji: "🥈", text: "text-stone-300" },
  Gold:     { emoji: "🥇", text: "text-yellow-300" },
  Platinum: { emoji: "💎", text: "text-sky-300" },
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  PENDING:           { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-100",   dot: "bg-amber-500",   label: "Pending" },
  ACCEPTED:          { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500", label: "Accepted" },
  DECLINED:          { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-100",     dot: "bg-red-500",     label: "Declined" },
  COUNTERED:         { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100",  dot: "bg-violet-500",  label: "Countered" },
  EMPLOYER_COUNTERED:{ bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-100",  dot: "bg-violet-500",  label: "New offer" },
  ON_THE_WAY:        { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-100",     dot: "bg-sky-500",     label: "On the way" },
  ARRIVED:           { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-100",    dot: "bg-teal-500",    label: "Arrived" },
  IN_PROGRESS:       { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-100",  dot: "bg-orange-500",  label: "In progress" },
  COMPLETED:         { bg: "bg-stone-100",  text: "text-stone-600",   border: "border-stone-200",   dot: "bg-stone-400",   label: "Completed" },
  REDO_REQUESTED:    { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-100",    dot: "bg-rose-500",    label: "Redo requested" },
  SATISFIED:         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500", label: "Satisfied" },
  DISPUTED:          { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-100",     dot: "bg-red-500",     label: "Disputed" },
};

export default function TechnicianDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<number[]>([]);
  const [cityLabel, setCityLabel] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const locationResolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track saved lat/lng for distress signal matching (persisted to DB)
  const savedLatRef = useRef<number | null>(null);
  const savedLngRef = useRef<number | null>(null);

  const userName = session?.user?.name?.split(" ")[0] || "there";

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data.address;
      return addr.city ?? addr.town ?? addr.village ?? addr.county ?? null;
    } catch {
      return null;
    }
  }, []);

  // FIX: now returns a boolean so callers (especially handleSaveLocation,
  // which previously did NOT call this at all) can tell whether the save
  // actually succeeded instead of assuming it always did.
  const persistLocation = useCallback(async (lat: number, lng: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
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

  // FIX: numeric geolocation error codes (1/2/3) instead of comparing
  // against err.PERMISSION_DENIED etc, which isn't reliably present on the
  // error instance across browsers/WebViews.
  const captureLocation = useCallback((silent = true) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation is not supported by your browser");
      return;
    }
    if (!silent) setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        savedLatRef.current = latitude;
        savedLngRef.current = longitude;
        locationResolvedRef.current = true;
        clearFallbackTimer();
        const city = await reverseGeocode(latitude, longitude);
        const label = city ?? "Current location";
        setCityLabel(label);
        if (locationInputRef.current) locationInputRef.current.value = label;
        const persisted = await persistLocation(latitude, longitude);
        if (!silent) {
          setDetectingLocation(false);
          if (!persisted) toast.error("Location detected but couldn't be saved — try again");
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        if (!silent) {
          setDetectingLocation(false);
          if (err.code === 1) {
            toast.error("Location permission denied — please allow location access in your browser settings");
          } else if (err.code === 2) {
            toast.error("Location unavailable — your device could not determine your position");
          } else {
            toast.error("Location request timed out — please try again");
          }
        }
      },
      { timeout: 10000 }
    );
  }, [reverseGeocode, persistLocation, clearFallbackTimer]);

  usePlacesAutocomplete(locationInputRef, ({ lat, lng, label }) => {
    setCityLabel(label);
    savedLatRef.current = lat;
    savedLngRef.current = lng;
    locationResolvedRef.current = true;
    clearFallbackTimer();
    persistLocation(lat, lng).then((ok) => {
      if (!ok) toast.error("Location picked but couldn't be saved — tap Save to retry");
    });
  });

  // FIX: this previously did NOT call persistLocation at all — it just
  // showed a success toast assuming the autocomplete/detect callback had
  // already saved it. That's not safe (that earlier save may have failed
  // silently, or the user may have only typed without ever triggering
  // place_changed). Save now explicitly re-persists savedLatRef/savedLngRef
  // and reports the real outcome.
  const handleSaveLocation = useCallback(async () => {
    if (!cityLabel) return;
    if (savedLatRef.current === null || savedLngRef.current === null) {
      toast.error("Please pick a location from the dropdown or use Auto detect first");
      return;
    }
    setSaving(true);
    locationResolvedRef.current = true;
    clearFallbackTimer();
    const persisted = await persistLocation(savedLatRef.current, savedLngRef.current);
    setSaving(false);
    if (persisted) {
      toast.success("Saved — you'll be visible to employers within or around this location");
    } else {
      toast.error("Couldn't save your location — please try again");
    }
  }, [cityLabel, persistLocation, clearFallbackTimer]);

  // FIX (Session XXIV): guard each response with res.ok before calling
  // .json(). A non-2xx or empty body (e.g. an employer account hitting this
  // technician-only endpoint) previously threw "Unexpected end of JSON
  // input" and broke the whole Promise.all. Now it degrades to null/empty
  // instead of crashing. This is a safety net — the real fix for that
  // scenario is the role guard below, which stops mismatched-role sessions
  // from ever reaching this fetch.
  const fetchAll = useCallback(async () => {
    try {
      const [jobsRes, analyticsRes, profileRes] = await Promise.all([
        fetch("/api/jobs"),
        fetch("/api/analytics/technician"),
        fetch("/api/profile"),
      ]);
      const [jobsData, analyticsData, profileData] = await Promise.all([
        jobsRes.ok ? jobsRes.json().catch(() => null) : null,
        analyticsRes.ok ? analyticsRes.json().catch(() => null) : null,
        profileRes.ok ? profileRes.json().catch(() => null) : null,
      ]);
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setAnalytics(analyticsData);
      setProfile(profileData);

      if (profileData?.id) {
        const avRes = await fetch(`/api/availability?userId=${profileData.id}`);
        const avData = avRes.ok ? await avRes.json().catch(() => null) : null;
        setAvailability(Array.isArray(avData) ? avData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ROLE GUARD: this page assumes a TECHNICIAN session. Without this check,
  // an employer account hitting this URL directly renders technician UI
  // and calls technician-only endpoints (/api/analytics/technician) that
  // have nothing to return for them — that's the empty-body JSON crash.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "TECHNICIAN") {
      router.push("/employer/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchAll();

      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .then(async (profileData) => {
          const pLat = profileData?.latitude;
          const pLng = profileData?.longitude;
          if (typeof pLat === "number" && typeof pLng === "number") {
            savedLatRef.current = pLat;
            savedLngRef.current = pLng;
            locationResolvedRef.current = true;
            return;
          }
          fallbackTimerRef.current = setTimeout(() => {
            if (!locationResolvedRef.current) captureLocation(true);
          }, LOCATION_FALLBACK_MS);
        })
        .catch(() => {
          fallbackTimerRef.current = setTimeout(() => {
            if (!locationResolvedRef.current) captureLocation(true);
          }, LOCATION_FALLBACK_MS);
        });
    }
    return () => clearFallbackTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, fetchAll]);

  const handleToggleAvailability = async (day: number) => {
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: day }),
    });
    const data = await res.json();
    setAvailability(Array.isArray(data) ? data : []);
  };

  const pendingJobs   = jobs.filter((j) => j.status === "PENDING");
  const activeJobs    = jobs.filter((j) => ["ACCEPTED","ON_THE_WAY","ARRIVED","IN_PROGRESS"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "SATISFIED");
  const recentJobs    = jobs.slice(0, 4);
  const techProfile   = profile?.technicianProfile;
  const recentReviews = profile?.reviewsReceived?.slice(0, 3) || [];

  const pipelineTotal = pendingJobs.length + activeJobs.length + completedJobs.length;
  const pendingPct    = pipelineTotal > 0 ? (pendingJobs.length  / pipelineTotal) * 100 : 0;
  const activePct     = pipelineTotal > 0 ? (activeJobs.length   / pipelineTotal) * 100 : 0;
  const completedPct  = pipelineTotal > 0 ? (completedJobs.length / pipelineTotal) * 100 : 0;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const rankKey  = techProfile?.rank || "Bronze";
  const rankStyle = RANK_STYLES[rankKey] || RANK_STYLES.Bronze;

  if (loading) {
    return (
      <Layout title="Dashboard" showBack={false}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl bg-stone-900 p-8 md:p-10 animate-pulse">
            <div className="h-3 w-24 bg-white/10 rounded mb-4" />
            <div className="h-8 w-64 bg-white/10 rounded mb-6" />
            <div className="h-3 w-32 bg-white/10 rounded mb-2" />
            <div className="h-12 w-56 bg-white/10 rounded" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-stone-100 mb-4" />
                <div className="h-6 w-12 bg-stone-100 rounded mb-2" />
                <div className="h-3 w-20 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
          <div className="flex justify-center py-12">
            <Spinner size="lg" text="Loading your dashboard..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" showBack={false}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 p-8 md:p-10"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
          <Wrench className="absolute -right-8 -bottom-8 text-white/5 pointer-events-none" size={200} strokeWidth={1} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">{greeting}</p>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                Welcome back, {userName}
              </h1>
              <p className="text-white/40 mt-2">Here's how your workshop is doing.</p>

              <div className="mt-4 flex items-center gap-2">
                {/* Location input pill */}
                <div
                  className="flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(6px)",
                  }}
                >
                  <input
                    ref={locationInputRef}
                    type="text"
                    defaultValue=""
                    placeholder="Where are you right now?"
                    className="bg-transparent text-xs font-semibold text-white/80 placeholder:text-white/40 outline-none min-w-0 w-44"
                  />
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={hoverSpring}
                    onClick={handleSaveLocation}
                    disabled={saving || !cityLabel}
                    className="flex items-center justify-center px-2.5 h-6 rounded-full shrink-0 text-[11px] font-bold text-orange-200 disabled:opacity-40"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                  </motion.button>
                </div>

                {/* Auto detect pill */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  transition={hoverSpring}
                  onClick={() => captureLocation(false)}
                  disabled={detectingLocation}
                  className="flex items-center gap-1.5 rounded-full pl-3.5 pr-1.5 py-1.5 shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span className="text-xs font-semibold text-white/80">Auto detect</span>
                  <span
                    className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    {detectingLocation
                      ? <Loader2 className="w-3 h-3 animate-spin text-orange-200" />
                      : <Navigation className="w-3 h-3 text-orange-200" />}
                  </span>
                </motion.button>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Total earnings</p>
                <h2 className="text-5xl md:text-6xl font-black bg-linear-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent">
                  <AnimatedNumber value={analytics?.summary?.totalEarnings || 0} prefix="₦" />
                </h2>
              </div>
            </div>

            {techProfile && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shrink-0">
                <div className="text-3xl">{rankStyle.emoji}</div>
                <div>
                  <p className={`font-bold text-sm ${rankStyle.text}`}>{rankKey} rank</p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {techProfile.averageRating?.toFixed(1) || "0.0"} ★ · {completedJobs.length} jobs done
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total jobs", value: jobs.length,          icon: Briefcase,    iconBg: "bg-stone-100 text-stone-600",   from: "from-stone-50" },
            { label: "Pending",    value: pendingJobs.length,   icon: Clock,        iconBg: "bg-amber-100 text-amber-600",   from: "from-amber-50" },
            { label: "Active",     value: activeJobs.length,    icon: Wrench,       iconBg: "bg-sky-100 text-sky-600",       from: "from-sky-50" },
            { label: "Completed",  value: completedJobs.length, icon: CheckCircle,  iconBg: "bg-emerald-100 text-emerald-600", from: "from-emerald-50" },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.label}
                onClick={() => router.push("/technician/jobs")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...mountEase, delay: 0.1 + i * 0.05 }}
                whileHover={{ y: -3, scale: 1.02, transition: hoverSpring }}
                whileTap={{ scale: 0.97 }}
                className={`bg-linear-to-br ${card.from} to-white rounded-2xl border border-stone-200 p-5 text-left`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconBg}`}>
                  <Icon size={20} />
                </div>
                <p className="text-2xl font-bold text-stone-800">{card.value}</p>
                <p className="text-sm text-stone-500">{card.label}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-3">Quick actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "My jobs",    desc: "View all requests",   icon: ClipboardList, href: "/technician/jobs",      iconBg: "bg-sky-50 text-sky-500" },
              { label: "Portfolio",  desc: "Showcase your work",  icon: ImageIcon,     href: "/technician/portfolio", iconBg: "bg-violet-50 text-violet-500" },
              { label: "Earnings",   desc: "Income analytics",    icon: Wallet,        href: "/technician/earnings",  iconBg: "bg-emerald-50 text-emerald-500" },
              { label: "My profile", desc: "Edit your profile",   icon: User,          href: "/profile",              iconBg: "bg-orange-50 text-orange-500" },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...mountEase, delay: 0.2 + i * 0.05 }}
                  whileHover={{ y: -3, scale: 1.02, transition: hoverSpring }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white border border-stone-200 rounded-2xl p-4 text-left"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${action.iconBg}`}>
                    <Icon size={18} />
                  </div>
                  <p className="font-semibold text-stone-800 text-sm">{action.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{action.desc}</p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Jobs pipeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-stone-800">Jobs pipeline</h2>
            <button
              onClick={() => router.push("/technician/jobs")}
              className="text-sm text-orange-600 hover:underline flex items-center gap-1"
            >
              Manage all <ChevronRight size={14} />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.3 }}
            className="bg-white rounded-2xl border border-stone-200 p-5 mb-4"
          >
            <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
              <span className="uppercase tracking-widest">Where your jobs stand</span>
              <span>{pipelineTotal} total</span>
            </div>
            <div className="h-2.5 rounded-full bg-stone-100 overflow-hidden flex">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pendingPct}%` }}   transition={{ ...mountEase, delay: 0.35 }} className="bg-amber-400" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${activePct}%` }}    transition={{ ...mountEase, delay: 0.45 }} className="bg-sky-400" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${completedPct}%` }} transition={{ ...mountEase, delay: 0.55 }} className="bg-emerald-400" />
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 text-stone-500"><span className="w-2 h-2 rounded-full bg-amber-400" /> {pendingJobs.length} pending</span>
              <span className="flex items-center gap-1.5 text-stone-500"><span className="w-2 h-2 rounded-full bg-sky-400" /> {activeJobs.length} active</span>
              <span className="flex items-center gap-1.5 text-stone-500"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {completedJobs.length} completed</span>
            </div>
          </motion.div>

          {recentJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No jobs yet — your requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job, i) => {
                const style = STATUS_STYLES[job.status] || STATUS_STYLES.PENDING;
                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...mountEase, delay: 0.4 + i * 0.05 }}
                    whileHover={{ y: -2, scale: 1.01, transition: hoverSpring }}
                    onClick={() => router.push("/technician/jobs")}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-4 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold shrink-0">
                      {job.employer?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">{job.employer?.name}</p>
                      <p className="text-xs text-stone-500 truncate">{job.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${style.bg} ${style.text} ${style.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {style.label}
                      </span>
                      <span className="text-xs text-stone-500">₦{(job.counterPrice || job.offeredPrice)?.toLocaleString()}</span>
                    </div>
                    <ChevronRight size={16} className="text-stone-300 shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Middle row: earnings chart + reviews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.45 }}
            className="bg-white rounded-2xl border border-stone-200 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Monthly earnings</h2>
              <button
                onClick={() => router.push("/technician/earnings")}
                className="text-xs text-orange-600 hover:underline flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <AnalyticsChart
              type="bar"
              data={analytics?.monthlyEarnings || []}
              xKey="month"
              dataKey="earned"
              color="#f97316"
              prefix="₦"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.5 }}
            className="bg-white rounded-2xl border border-stone-200 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-stone-800">Recent reviews</h2>
              <button onClick={() => router.push("/profile")} className="text-xs text-orange-600 hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </button>
            </div>

            {recentReviews.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-stone-400">
                <Star size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No reviews yet</p>
                <p className="text-xs mt-1 text-center px-4">Complete jobs to start receiving reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReviews.map((review: any) => (
                  <div key={review.id} className="flex items-start gap-3 border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-stone-800">{review.reviewer?.name}</p>
                        <RatingStars rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-xs text-stone-500 mt-0.5 truncate">{review.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Availability */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.55 }}
          className="bg-white rounded-2xl border border-stone-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-stone-800">My availability</h2>
              <p className="text-sm text-stone-500 mt-0.5">Toggle the days you're open for work</p>
            </div>
            <button onClick={() => router.push("/profile")} className="text-xs text-orange-600 hover:underline">
              Edit in profile →
            </button>
          </div>
          <AvailabilityCalendar
            availability={availability}
            editable
            onToggle={handleToggleAvailability}
          />
        </motion.div>
      </div>
    </Layout>
  );
}