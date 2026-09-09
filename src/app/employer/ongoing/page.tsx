"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import ChatWindow from "@/components/ChatWindow";
import toast from "react-hot-toast";
import { estimateMinutesAway, calculateDistance } from "@/lib/utils";
import {
  MapPin, Clock, CheckCircle, RefreshCw, AlertTriangle,
  MessageSquare, Wrench, Car, Zap, ThumbsUp, Search,
  ShieldCheck, ShieldOff, XCircle, FileText,
} from "lucide-react";

const mountEase: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

const ACTIVE_STATUSES = [
  "ACCEPTED","ON_THE_WAY","ARRIVED","IN_PROGRESS",
  "COMPLETED","REDO_REQUESTED","DISPUTED",
];

const STEPS = [
  { key: "ACCEPTED",    label: "Accepted",  icon: CheckCircle },
  { key: "ON_THE_WAY", label: "On the Way",icon: Car },
  { key: "ARRIVED",    label: "Arrived",   icon: MapPin },
  { key: "IN_PROGRESS",label: "Working",   icon: Wrench },
  { key: "COMPLETED",  label: "Done",      icon: Zap },
];

const STATUS_STEP: Record<string, number> = {
  ACCEPTED:0,ON_THE_WAY:1,ARRIVED:2,IN_PROGRESS:3,COMPLETED:4,REDO_REQUESTED:3,DISPUTED:4,
};

const STATUS_HERO: Record<string, {
  from: string; to: string; accent: string; label: string;
  sublabel: (min: number | null) => string;
}> = {
  ACCEPTED:      { from:"#1e3a5f",to:"#0f2540",accent:"#60a5fa",label:"Job Accepted",        sublabel:()=>"Technician is preparing to head your way" },
  ON_THE_WAY:    { from:"#1e3a5f",to:"#0f1f40",accent:"#38bdf8",label:"Technician En Route", sublabel:(m)=>m?`~${m} min away`:"On the way to your location" },
  ARRIVED:       { from:"#064e3b",to:"#052e20",accent:"#34d399",label:"Technician Arrived",  sublabel:()=>"Ready to begin work at your location" },
  IN_PROGRESS:   { from:"#451a03",to:"#2a0f00",accent:"#fb923c",label:"Work in Progress",    sublabel:()=>"Your technician is on the job right now" },
  COMPLETED:     { from:"#2e1065",to:"#1a0940",accent:"#a78bfa",label:"Job Completed",       sublabel:()=>"Review the work and confirm satisfaction" },
  REDO_REQUESTED:{ from:"#451a03",to:"#2a0f00",accent:"#fb923c",label:"Redo Requested",      sublabel:()=>"Technician is addressing the issues" },
  DISPUTED:      { from:"#450a0a",to:"#290606",accent:"#f87171",label:"Dispute Filed",       sublabel:()=>"Admin is reviewing your case" },
};

// ─── Dispute outcome / status banner ─────────────────────────────────────────
function DisputeOutcomeBanner({
  dispute, jobId, onGoToJobs, onWithdraw, withdrawing,
}: {
  dispute: any;
  jobId: string;
  onGoToJobs: () => void;
  onWithdraw: (jobId: string) => void;
  withdrawing: boolean;
}) {
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  // Withdrawn
  if (dispute?.status === "WITHDRAWN") {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <XCircle size={14} className="text-stone-400" />
          <p className="text-sm font-semibold text-stone-600">Dispute Withdrawn</p>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed">
          You withdrew this dispute. The job has been returned to Completed status — you can still mark it as satisfied.
        </p>
      </div>
    );
  }

  // Resolved — employer won
  if (dispute?.status === "RESOLVED_EMPLOYER" || dispute?.outcome === "EMPLOYER_WINS") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Dispute Resolved — You Won</p>
            <p className="text-xs text-emerald-600">
              {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : ""}
            </p>
          </div>
        </div>
        <p className="text-xs text-emerald-700 leading-relaxed mb-3">
          The admin ruled in your favour. The technician's rank has been docked.
        </p>
        <motion.button onClick={onGoToJobs} whileHover={{scale:1.02}} whileTap={{scale:0.97}} transition={hoverSpring}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
          View in Job History
        </motion.button>
      </div>
    );
  }

  // Resolved — technician won
  if (dispute?.status === "RESOLVED_TECHNICIAN" || dispute?.outcome === "TECHNICIAN_WINS") {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
            <ShieldOff size={16} className="text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-700">Dispute Resolved — Technician Won</p>
            <p className="text-xs text-stone-500">
              {dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleDateString("en-NG",{day:"numeric",month:"short",year:"numeric"}) : ""}
            </p>
          </div>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          The admin ruled in favour of the technician. If you believe this is incorrect, contact support.
        </p>
        <div className="flex gap-2">
          <button onClick={()=>window.location.href="/support"}
            className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm hover:bg-stone-100 transition-colors">
            Contact Support
          </button>
          <motion.button onClick={onGoToJobs} whileHover={{scale:1.02}} whileTap={{scale:0.97}} transition={hoverSpring}
            className="flex-1 bg-stone-700 hover:bg-stone-800 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
            View History
          </motion.button>
        </div>
      </div>
    );
  }

  // DEFENDING — technician has submitted their defense; withdrawal locked
  if (dispute?.status === "DEFENDING") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText size={14} className="text-red-500" />
          <p className="text-sm font-semibold text-red-700">Defense Submitted</p>
        </div>
        <p className="text-xs text-red-500 text-center leading-relaxed">
          The technician has submitted their defense. Admin is now reviewing both sides —
          withdrawal is no longer available at this stage.
        </p>
      </div>
    );
  }

  // Open / In Review — show review notice + withdraw option
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle size={14} className="text-red-500" />
        <p className="text-sm font-semibold text-red-700">Dispute Under Admin Review</p>
      </div>
      <p className="text-xs text-red-500 text-center">
        Our team is looking into this. You'll be notified of the outcome.
      </p>

      {!confirmWithdraw ? (
        <button
          onClick={() => setConfirmWithdraw(true)}
          className="w-full border border-red-200 text-red-500 hover:bg-red-100 py-2 rounded-xl text-xs font-semibold transition-colors"
        >
          Withdraw Dispute
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-red-700 text-center font-medium">
            Are you sure? This cannot be undone, and a warning will be added to your account.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmWithdraw(false)}
              className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-xs hover:bg-stone-50 transition-colors">
              Keep Dispute
            </button>
            <motion.button
              onClick={() => onWithdraw(jobId)}
              disabled={withdrawing}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={hoverSpring}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {withdrawing ? <Spinner size="sm" /> : <><XCircle size={12} /> Yes, Withdraw</>}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OngoingJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDisputeForm, setShowDisputeForm] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState<Record<string, string>>({});
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      const active = Array.isArray(data)
        ? data.filter((j: any) => {
            if (!ACTIVE_STATUSES.includes(j.status)) return false;
            if (j.status === "DISPUTED") {
              const ds = j.dispute?.status;
              if (ds === "RESOLVED_EMPLOYER" || ds === "RESOLVED_TECHNICIAN") return false;
            }
            return true;
          })
        : [];
      setJobs(active);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      fetchJobs();
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
      const interval = setInterval(() => fetchJobs(true), 30000);
      return () => clearInterval(interval);
    }
  }, [status, router, fetchJobs]);

  const updateJob = async (jobId: string, newStatus: string) => {
    setActionLoading(jobId + newStatus);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchJobs(true);
      if (newStatus === "SATISFIED") {
        toast.success("Job completed! Please rate the technician ⭐");
        router.push("/employer/jobs");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFileDispute = async (jobId: string) => {
    if (!disputeReason[jobId]?.trim()) {
      toast.error("Please describe your complaint");
      return;
    }
    setActionLoading(jobId + "DISPUTE");
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRequestId: jobId, reason: disputeReason[jobId] }),
      });
      if (res.ok) {
        toast.success("Dispute filed. Admin has been notified.");
        setShowDisputeForm(null);
        fetchJobs(true);
      } else {
        toast.error("Failed to file dispute");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawDispute = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job?.dispute?.id) return;
    setActionLoading(jobId + "WITHDRAW");
    try {
      const res = await fetch(`/api/disputes/${job.dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "WITHDRAW" }),
      });
      if (res.ok) {
        toast.success("Dispute withdrawn.");
        fetchJobs(true);
      } else {
        const data = await res.json();
        toast.error(data.error || "Could not withdraw dispute");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const getMinutesAway = (job: any) => {
    if (!userLocation || !job.technicianLat || !job.technicianLng) return null;
    const dist = calculateDistance(userLocation.lat, userLocation.lng, job.technicianLat, job.technicianLng);
    return estimateMinutesAway(dist);
  };

  return (
    <Layout title="Ongoing Jobs">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={mountEase}
          className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Live Jobs</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {jobs.length > 0 ? `${jobs.length} active job${jobs.length>1?"s":""} in progress` : "No active jobs right now"}
            </p>
          </div>
          <motion.button onClick={() => { setRefreshing(true); fetchJobs(true); }}
            whileHover={{scale:1.05}} whileTap={{scale:0.95}} transition={hoverSpring}
            className="flex items-center gap-2 text-sm text-stone-600 border border-stone-200 bg-white px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors">
            <motion.div animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 0.6 }}>
              <RefreshCw size={13} />
            </motion.div>
            Refresh
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" text="Loading active jobs..." /></div>
        ) : jobs.length === 0 ? (
          <motion.div initial={{ opacity:0,scale:0.97 }} animate={{ opacity:1,scale:1 }} transition={mountEase}
            className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Search size={22} className="text-stone-400" />
            </div>
            <p className="text-stone-700 font-semibold mb-1">No active jobs</p>
            <p className="text-stone-400 text-sm mb-5">Accepted jobs will appear here in real time</p>
            <div className="flex gap-3 justify-center">
              <motion.button onClick={() => router.push("/employer/find")}
                whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Find a Technician
              </motion.button>
              <motion.button onClick={() => router.push("/employer/jobs")}
                whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                View Completed Jobs
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {jobs.map((job, i) => {
                const minutes = getMinutesAway(job);
                const hero = STATUS_HERO[job.status] ?? STATUS_HERO["IN_PROGRESS"];
                const stepIndex = STATUS_STEP[job.status] ?? 0;
                const isDisputed = job.status === "DISPUTED";
                const isCompleted = job.status === "COMPLETED";
                const isChatOpen = openChat === job.id;
                const isDisputeOpen = showDisputeForm === job.id;
                const agreedPrice = (job.counterPrice || job.offeredPrice)?.toLocaleString();
                const dispute = job.dispute ?? null;

                return (
                  <motion.div key={job.id} layout
                    initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
                    exit={{ opacity:0,scale:0.97 }}
                    transition={{ ...mountEase, delay: i * 0.06 }}
                    className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">

                    {/* Hero */}
                    <div className="relative px-5 py-5 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${hero.from}, ${hero.to})` }}>
                      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 blur-2xl"
                        style={{ background: hero.accent }} />
                      <div className="flex items-center gap-3 mb-4 relative">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0"
                          style={{ background:`linear-gradient(135deg,${hero.accent}66,${hero.accent}33)`, border:`1px solid ${hero.accent}44` }}>
                          {job.technician?.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm leading-tight truncate">{job.technician?.name}</p>
                          <p className="text-white/50 text-xs truncate">
                            {job.technician?.technicianProfile?.serviceCategory} · ₦{agreedPrice}
                          </p>
                        </div>
                        {!isDisputed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: hero.accent }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: hero.accent }} />
                            </span>
                            <span className="text-xs font-semibold" style={{ color: hero.accent }}>LIVE</span>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <p className="text-white font-black text-xl leading-tight mb-0.5">{hero.label}</p>
                        <p className="text-white/60 text-sm">{hero.sublabel(minutes)}</p>
                      </div>
                      {minutes && ["ACCEPTED","ON_THE_WAY"].includes(job.status) && (
                        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={hoverSpring}
                          className="absolute bottom-4 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                          style={{ background:`${hero.accent}22`, border:`1px solid ${hero.accent}44`, color:hero.accent }}>
                          <Clock size={11} /> ~{minutes} min
                        </motion.div>
                      )}
                    </div>

                    {/* Progress */}
                    {!isDisputed && (
                      <div className="bg-stone-900 px-5 py-4">
                        <div className="flex items-center">
                          {STEPS.map((step, idx) => {
                            const Icon = step.icon;
                            const done = idx < stepIndex;
                            const active = idx === stepIndex;
                            return (
                              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                  <motion.div
                                    animate={active ? { scale:[1,1.15,1] } : {}}
                                    transition={{ repeat:Infinity, duration:2, ease:"easeInOut" }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                                    style={done ? {background:"#f97316"} : active ? {background:"#f97316",boxShadow:"0 0 0 4px rgba(249,115,22,0.25)"} : {background:"transparent",border:"1.5px solid rgba(255,255,255,0.15)"}}>
                                    <Icon size={14} className={done||active?"text-white":"text-white/20"} strokeWidth={done||active?2.5:1.5} />
                                  </motion.div>
                                  <p className="text-[9px] font-semibold tracking-wide uppercase whitespace-nowrap"
                                    style={{ color: done||active?"#f97316":"rgba(255,255,255,0.2)" }}>
                                    {step.label}
                                  </p>
                                </div>
                                {idx < STEPS.length - 1 && (
                                  <div className="flex-1 mx-1 mb-4">
                                    <div className="h-px w-full bg-white/10 relative overflow-hidden">
                                      {done && (
                                        <motion.div initial={{scaleX:0}} animate={{scaleX:1}}
                                          transition={{duration:0.5,ease:[0.25,0.1,0.25,1]}}
                                          className="absolute inset-0 bg-orange-500 origin-left" />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Body */}
                    <div className="bg-white p-5 space-y-3">
                      <div className="bg-stone-50 rounded-xl p-3 text-sm text-stone-700 leading-relaxed border border-stone-100">
                        {job.description}
                      </div>

                      {/* Completed — satisfaction decision */}
                      {isCompleted && (
                        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-3">
                          <p className="text-sm font-semibold text-violet-800 text-center">
                            Are you satisfied with the completed work?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <motion.button onClick={() => updateJob(job.id, "SATISFIED")}
                              disabled={actionLoading === job.id+"SATISFIED"}
                              whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                              {actionLoading === job.id+"SATISFIED" ? <Spinner size="sm" /> : <><ThumbsUp size={14} /> Yes, Satisfied</>}
                            </motion.button>
                            <motion.button onClick={() => setShowDisputeForm(isDisputeOpen ? null : job.id)}
                              whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
                              <AlertTriangle size={14} /> File Dispute
                            </motion.button>
                          </div>
                          <AnimatePresence>
                            {isDisputeOpen && (
                              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                                exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.25,0.1,0.25,1]}}
                                className="overflow-hidden">
                                <div className="pt-2 space-y-3">
                                  <div className="bg-red-100 border border-red-200 rounded-xl p-3">
                                    <p className="text-xs text-red-700 leading-relaxed">
                                      Payment will still be processed. The dispute will be reviewed by our admin team — the technician has a limited window to respond.
                                    </p>
                                  </div>
                                  <textarea rows={3} value={disputeReason[job.id]||""}
                                    onChange={(e) => setDisputeReason((p)=>({...p,[job.id]:e.target.value}))}
                                    placeholder="Describe why you're dissatisfied with the work done..."
                                    className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white" />
                                  <div className="flex gap-2">
                                    <button onClick={() => setShowDisputeForm(null)}
                                      className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm hover:bg-stone-50 transition-colors">
                                      Cancel
                                    </button>
                                    <motion.button onClick={() => handleFileDispute(job.id)}
                                      disabled={actionLoading === job.id+"DISPUTE"}
                                      whileHover={{scale:1.03}} whileTap={{scale:0.97}} transition={hoverSpring}
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center">
                                      {actionLoading === job.id+"DISPUTE" ? <Spinner size="sm" /> : "Submit Dispute"}
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Disputed — outcome banner with withdraw */}
                      {isDisputed && (
                        <DisputeOutcomeBanner
                          dispute={dispute}
                          jobId={job.id}
                          onGoToJobs={() => router.push("/employer/jobs")}
                          onWithdraw={handleWithdrawDispute}
                          withdrawing={actionLoading === job.id+"WITHDRAW"}
                        />
                      )}

                      {/* Chat */}
                      <motion.button onClick={() => setOpenChat(isChatOpen ? null : job.id)}
                        whileHover={{scale:1.02}} whileTap={{scale:0.98}} transition={hoverSpring}
                        className="w-full border border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <MessageSquare size={14} />
                        {isChatOpen ? "Hide Chat" : "Chat with Technician"}
                      </motion.button>
                      <AnimatePresence>
                        {isChatOpen && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                            exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.25,0.1,0.25,1]}}
                            className="overflow-hidden">
                            <ChatWindow jobRequestId={job.id} initialMessages={job.messages||[]} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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