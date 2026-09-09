"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Layout from "@/components/Layout";
import ChatWindow from "@/components/ChatWindow";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import {
  Star,
  MessageSquare,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  TrendingUp,
  Search,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";

// ─── Motion constants ────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  PENDING:            { label: "Pending",           bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   icon: <Clock size={10} /> },
  ACCEPTED:           { label: "Accepted",          bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", icon: <CheckCircle size={10} /> },
  DECLINED:           { label: "Declined",          bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     icon: <XCircle size={10} /> },
  COUNTERED:          { label: "Counter Received",  bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400",  icon: <ArrowRight size={10} /> },
  EMPLOYER_COUNTERED: { label: "Counter Sent",      bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-400",  icon: <Clock size={10} /> },
  ON_THE_WAY:         { label: "On the Way",        bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400",     icon: <ArrowRight size={10} /> },
  ARRIVED:            { label: "Arrived",           bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-400",    icon: <CheckCircle size={10} /> },
  IN_PROGRESS:        { label: "In Progress",       bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  icon: <TrendingUp size={10} /> },
  COMPLETED:          { label: "Completed",         bg: "bg-stone-100",  text: "text-stone-600",   dot: "bg-stone-400",   icon: <CheckCircle size={10} /> },
  SATISFIED:          { label: "Satisfied",         bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", icon: <CheckCircle size={10} /> },
  REDO_REQUESTED:     { label: "Redo Requested",    bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-400",  icon: <AlertTriangle size={10} /> },
  DISPUTED:           { label: "Disputed",          bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400",     icon: <AlertTriangle size={10} /> },
};

const TABS = [
  { key: "ALL",               label: "All" },
  { key: "PENDING",           label: "Pending" },
  { key: "COUNTERED",         label: "Negotiating" },
  { key: "EMPLOYER_COUNTERED",label: "Awaiting Reply" },
  { key: "ACCEPTED",          label: "Accepted" },
  { key: "SATISFIED",         label: "Satisfied" },
  { key: "DISPUTED",          label: "Disputed" },
  { key: "DECLINED",          label: "Declined" },
];

// ─── Dispute outcome banner ──────────────────────────────────────────────────
function DisputeOutcomeBanner({ dispute }: { dispute: any }) {
  // Still pending admin review
  if (!dispute || dispute.status === "PENDING" || dispute.status === "IN_REVIEW") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AlertTriangle size={14} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700">Dispute Under Review</p>
        </div>
        <p className="text-xs text-red-600">
          Our admin team is reviewing this dispute. You'll be notified of the outcome.
        </p>
      </div>
    );
  }

  // Employer won
  if (dispute.status === "RESOLVED_EMPLOYER" || dispute.outcome === "EMPLOYER_WINS") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Dispute Resolved — You Won</p>
            <p className="text-xs text-emerald-600">
              Resolved {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </p>
          </div>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed">
          The admin reviewed the evidence and ruled in your favour. The technician's rank has been
          docked and a notice placed on their profile. We apologise for the inconvenience.
        </p>
      </div>
    );
  }

  // Technician won
  if (dispute.status === "RESOLVED_TECHNICIAN" || dispute.outcome === "TECHNICIAN_WINS") {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
            <ShieldOff size={16} className="text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-700">Dispute Resolved — Technician Won</p>
            <p className="text-xs text-stone-500">
              Resolved {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : ""}
            </p>
          </div>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed mb-2">
          After reviewing the evidence, the admin ruled in favour of the technician. If you believe
          this outcome is incorrect, please contact our support team.
        </p>
        <button
          onClick={() => window.location.href = "/support"}
          className="text-xs text-orange-600 underline hover:text-orange-700 font-medium"
        >
          Contact Support
        </button>
      </div>
    );
  }

  return null;
}

export default function EmployerJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [openRating, setOpenRating] = useState<string | null>(null);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [employerCounter, setEmployerCounter] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("ALL");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchJobs();
  }, [status, router]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleCounterResponse = async (jobId: string, newStatus: string) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success(newStatus === "ACCEPTED" ? "Job accepted!" : "Job declined.");
      fetchJobs();
    } else {
      toast.error("Something went wrong");
    }
  };

  const handleEmployerCounter = async (jobId: string, counterPrice: string) => {
    if (!counterPrice || isNaN(parseFloat(counterPrice))) {
      toast.error("Enter a valid counter price");
      return;
    }
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "EMPLOYER_COUNTERED", counterPrice }),
    });
    if (res.ok) {
      toast.success("Counter offer sent!");
      setEmployerCounter((prev) => ({ ...prev, [jobId]: "" }));
      fetchJobs();
    } else {
      toast.error("Failed to send counter offer");
    }
  };

  const submitReview = async (job: any) => {
    if (!rating[job.id]) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmittingReview(job.id);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRequestId: job.id,
          revieweeId: job.technicianId,
          rating: rating[job.id],
          comment: comment[job.id] || "",
        }),
      });
      if (res.ok) {
        toast.success("Review submitted!");
        setOpenRating(null);
        fetchJobs();
      } else {
        toast.error("Failed to submit review");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmittingReview(null);
    }
  };

  const filteredJobs =
    activeTab === "ALL" ? jobs : jobs.filter((j) => j.status === activeTab);

  const summaryCards = [
    { label: "Total",   value: jobs.length,                                                                               gradient: "from-stone-600 to-stone-800",   ring: "ring-stone-200" },
    { label: "Pending", value: jobs.filter((j) => j.status === "PENDING").length,                                        gradient: "from-amber-500 to-orange-600",  ring: "ring-amber-100" },
    { label: "Active",  value: jobs.filter((j) => ["ACCEPTED","ON_THE_WAY","ARRIVED","IN_PROGRESS"].includes(j.status)).length, gradient: "from-sky-500 to-blue-600", ring: "ring-sky-100" },
    { label: "Done",    value: jobs.filter((j) => ["SATISFIED","DISPUTED"].includes(j.status)).length,                   gradient: "from-emerald-500 to-teal-600",  ring: "ring-emerald-100" },
  ];

  return (
    <Layout title="Job Requests">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Page hero ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
              <Briefcase size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800">Job Requests</h1>
          </div>
          <p className="text-stone-500 text-sm ml-12">
            Track and manage all your service requests
          </p>
        </motion.div>

        {/* ── Summary cards ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.06 }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl p-4 ring-1 ${card.ring} bg-white`}
            >
              <div className={`absolute inset-0 bg-linear-to-br ${card.gradient} opacity-[0.06]`} />
              <p className="text-2xl font-black text-stone-800 relative">{card.value}</p>
              <p className="text-xs text-stone-500 mt-0.5 relative">{card.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...mountEase, delay: 0.1 }}
          className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none"
        >
          {TABS.map((tab) => {
            const count = tab.key === "ALL" ? jobs.length : jobs.filter((j) => j.status === tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={hoverSpring}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/25 text-white" : "bg-stone-100 text-stone-500"
                  }`}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Job list ────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" text="Loading jobs..." />
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={mountEase}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Search size={22} className="text-stone-400" />
            </div>
            <p className="text-stone-700 font-semibold text-base mb-1">No jobs here yet</p>
            <p className="text-stone-400 text-sm mb-5">Find a technician to send your first request</p>
            <motion.button
              onClick={() => router.push("/employer/find")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={hoverSpring}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Find a Technician
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, i) => {
                const cfg = STATUS_CONFIG[job.status] ?? { label: job.status, bg: "bg-stone-50", text: "text-stone-600", dot: "bg-stone-400", icon: null };
                const isExpanded = expandedJob === job.id;
                const isChatOpen = openChat === job.id;
                const isRatingOpen = openRating === job.id;

                // ── Dispute resolution helpers ──────────────────────────
                const dispute = job.dispute ?? null;
                const disputeResolved =
                  dispute?.status === "RESOLVED_EMPLOYER" ||
                  dispute?.status === "RESOLVED_TECHNICIAN";
                // Override badge label for resolved disputes still showing DISPUTED job status
                const resolvedBadgeCfg =
                  job.status === "DISPUTED" && dispute?.status === "RESOLVED_EMPLOYER"
                    ? { ...STATUS_CONFIG["SATISFIED"], label: "Dispute Won" }
                    : job.status === "DISPUTED" && dispute?.status === "RESOLVED_TECHNICIAN"
                    ? { ...STATUS_CONFIG["DECLINED"], label: "Dispute Lost" }
                    : null;
                const displayCfg = resolvedBadgeCfg ?? cfg;

                return (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ ...mountEase, delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
                  >
                    {/* ── Card header (always visible) ──────────────── */}
                    <button
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="w-full text-left p-4 hover:bg-stone-50/60 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                          {job.technician?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="font-semibold text-stone-800 text-sm truncate">
                              {job.technician?.name ?? "Unknown"}
                            </p>
                            {/* Status badge — shows resolved state if applicable */}
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${displayCfg.bg} ${displayCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${displayCfg.dot}`} />
                              {displayCfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 truncate">
                            {job.technician?.technicianProfile?.serviceCategory} ·{" "}
                            {job.technician?.technicianProfile?.businessName}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-stone-600">
                            <span className="font-semibold">₦{job.offeredPrice?.toLocaleString()} offered</span>
                            {job.counterPrice && (
                              <span className="text-violet-600 font-medium">↔ ₦{job.counterPrice?.toLocaleString()} counter</span>
                            )}
                          </div>
                        </div>

                        {/* Chevron */}
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={spring}
                          className="text-stone-400 shrink-0 mt-0.5"
                        >
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    </button>

                    {/* ── Expanded body ──────────────────────────────── */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">

                            {/* Description */}
                            <div className="bg-stone-50 rounded-xl p-3 text-sm text-stone-700 leading-relaxed">
                              {job.description}
                            </div>

                            {/* ── COUNTERED ──────────────────────────── */}
                            {job.status === "COUNTERED" && (
                              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                                <div>
                                  <p className="text-sm font-semibold text-violet-800 mb-0.5">Counter Offer Received</p>
                                  <p className="text-xs text-violet-600">
                                    The technician countered with{" "}
                                    <strong>₦{job.counterPrice?.toLocaleString()}</strong>.
                                    Accept, counter back, or decline.
                                  </p>
                                </div>
                                <motion.button
                                  onClick={() => handleCounterResponse(job.id, "ACCEPTED")}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  transition={hoverSpring}
                                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                                >
                                  Accept ₦{job.counterPrice?.toLocaleString()}
                                </motion.button>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder="Your counter offer (₦)"
                                    value={employerCounter[job.id] || ""}
                                    onChange={(e) =>
                                      setEmployerCounter((prev) => ({ ...prev, [job.id]: e.target.value }))
                                    }
                                    className="flex-1 border border-violet-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                  />
                                  <motion.button
                                    onClick={() => handleEmployerCounter(job.id, employerCounter[job.id])}
                                    disabled={!employerCounter[job.id]}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={hoverSpring}
                                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 whitespace-nowrap"
                                  >
                                    Send
                                  </motion.button>
                                </div>
                                <motion.button
                                  onClick={() => handleCounterResponse(job.id, "DECLINED")}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  transition={hoverSpring}
                                  className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-2 rounded-xl text-sm font-medium transition-colors"
                                >
                                  Decline
                                </motion.button>
                              </div>
                            )}

                            {/* ── EMPLOYER_COUNTERED ─────────────────── */}
                            {job.status === "EMPLOYER_COUNTERED" && (
                              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock size={14} className="text-indigo-500" />
                                  <p className="text-sm font-semibold text-indigo-800">Waiting for Response</p>
                                </div>
                                <p className="text-xs text-indigo-600">
                                  You sent a counter offer of{" "}
                                  <strong>₦{job.counterPrice?.toLocaleString()}</strong>.
                                  The technician will respond shortly.
                                </p>
                              </div>
                            )}

                            {/* ── DISPUTED — live outcome banner ─────── */}
                            {job.status === "DISPUTED" && (
                              <DisputeOutcomeBanner dispute={dispute} />
                            )}

                            {/* ── RATING ─────────────────────────────── */}
                            {(job.status === "SATISFIED" ||
                              (job.status === "DISPUTED" && disputeResolved)) && (
                              <div>
                                {job.review ? (
                                  <div className={`border rounded-xl p-3 ${
                                    job.review.comment?.startsWith("[AFTER_DISPUTE]")
                                      ? "bg-orange-50 border-orange-200"
                                      : "bg-emerald-50 border-emerald-200"
                                  }`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2">
                                        <p className={`text-xs font-semibold ${
                                          job.review.comment?.startsWith("[AFTER_DISPUTE]")
                                            ? "text-orange-700" : "text-emerald-700"
                                        }`}>Your Review</p>
                                        {job.review.comment?.startsWith("[AFTER_DISPUTE]") && (
                                          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                            After Dispute
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map((s) => (
                                          <Star
                                            key={s}
                                            size={12}
                                            className={s <= job.review.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    {job.review.comment && (
                                      <p className="text-stone-600 text-xs mt-1">
                                        {job.review.comment.replace("[AFTER_DISPUTE]", "")}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    <motion.button
                                      onClick={() => setOpenRating(isRatingOpen ? null : job.id)}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.97 }}
                                      transition={hoverSpring}
                                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                                    >
                                      <Star size={14} />
                                      {isRatingOpen ? "Hide Rating" : "Rate this Technician"}
                                    </motion.button>

                                    <AnimatePresence>
                                      {isRatingOpen && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                          className="overflow-hidden"
                                        >
                                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                            {job.status === "DISPUTED" && (
                                              <div className="flex items-start gap-2 bg-orange-100 border border-orange-200 rounded-lg px-3 py-2">
                                                <AlertTriangle size={13} className="text-orange-500 mt-0.5 shrink-0" />
                                                <p className="text-xs text-orange-700">
                                                  This review will be marked as <strong>After Dispute</strong> on the technician's profile.
                                                </p>
                                              </div>
                                            )}

                                            <p className="text-sm font-semibold text-amber-800">How was the service?</p>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1.5">
                                              {[1,2,3,4,5].map((s) => (
                                                <motion.button
                                                  key={s}
                                                  onClick={() => setRating((prev) => ({ ...prev, [job.id]: s }))}
                                                  whileHover={{ scale: 1.2 }}
                                                  whileTap={{ scale: 0.9 }}
                                                  transition={hoverSpring}
                                                >
                                                  <Star
                                                    size={24}
                                                    className={`transition-colors ${
                                                      (rating[job.id] || 0) >= s
                                                        ? "text-amber-400 fill-amber-400"
                                                        : "text-stone-200"
                                                    }`}
                                                  />
                                                </motion.button>
                                              ))}
                                              {rating[job.id] && (
                                                <span className="text-xs text-amber-700 font-medium ml-1">
                                                  {["","Poor","Fair","Good","Very Good","Excellent"][rating[job.id]]}
                                                </span>
                                              )}
                                            </div>

                                            {/* Comment */}
                                            <textarea
                                              rows={3}
                                              placeholder="Share your experience (optional)..."
                                              value={comment[job.id] || ""}
                                              onChange={(e) =>
                                                setComment((prev) => ({ ...prev, [job.id]: e.target.value }))
                                              }
                                              className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none bg-white"
                                            />

                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => setOpenRating(null)}
                                                className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm hover:bg-stone-50 transition-colors"
                                              >
                                                Cancel
                                              </button>
                                              <motion.button
                                                onClick={() => submitReview(job)}
                                                disabled={!rating[job.id] || submittingReview === job.id}
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                transition={hoverSpring}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center"
                                              >
                                                {submittingReview === job.id ? <Spinner size="sm" /> : "Submit Review"}
                                              </motion.button>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* ── Track active job ───────────────────── */}
                            {["ACCEPTED","ON_THE_WAY","ARRIVED","IN_PROGRESS"].includes(job.status) && (
                              <motion.button
                                onClick={() => router.push("/employer/ongoing")}
                                whileHover={{ scale: 1.02, x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                transition={hoverSpring}
                                className="w-full bg-sky-50 border border-sky-200 text-sky-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                              >
                                Track Job Progress
                                <ArrowRight size={14} />
                              </motion.button>
                            )}

                            {/* ── Chat ───────────────────────────────── */}
                            <motion.button
                              onClick={() => setOpenChat(isChatOpen ? null : job.id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={hoverSpring}
                              className="w-full border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare size={14} />
                              {isChatOpen ? "Hide Chat" : "Open Chat"}
                            </motion.button>

                            <AnimatePresence>
                              {isChatOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                                  className="overflow-hidden"
                                >
                                  <ChatWindow
                                    jobRequestId={job.id}
                                    initialMessages={job.messages || []}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
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
    </Layout>
  );
}