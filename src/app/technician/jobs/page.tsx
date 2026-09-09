"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import ChatWindow from "@/components/ChatWindow";
import JobTimeline from "@/components/JobTimeline";
import RatingStars from "@/components/RatingStars";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, MessageCircle, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Navigation, MapPin, Camera, X,
  Upload, AlertTriangle, Image as ImageIcon, Ban, TriangleAlert,
} from "lucide-react";

// ─── Photo Capture Modal ─────────────────────────────────────────────────────
function PhotoCaptureModal({
  mode, jobId, jobDescription, onSave, onSkip,
}: {
  mode: "arrived" | "completed";
  jobId: string;
  jobDescription: string;
  onSave: (images: string[]) => void;
  onSkip?: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isArrived = mode === "arrived";

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (images.length === 0) { toast.error("Please add at least one photo"); return; }
    setSaving(true);
    await onSave(images);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className={`px-6 py-5 ${isArrived ? "bg-amber-50 border-b border-amber-100" : "bg-green-50 border-b border-green-100"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isArrived ? "bg-amber-100" : "bg-green-100"}`}>
              <Camera size={20} className={isArrived ? "text-amber-600" : "text-green-600"} />
            </div>
            <div>
              <h2 className="font-bold text-stone-800 text-base">
                {isArrived ? "Document the Current State" : "Document the Completed Work"}
              </h2>
              <p className="text-sm text-stone-500 mt-0.5">
                {isArrived
                  ? "Take photos before starting — these protect you if a dispute is raised."
                  : "Take photos of the finished work — they'll be saved to your portfolio."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-600 border border-stone-100">
            <span className="font-medium text-stone-700">Job: </span>{jobDescription}
          </div>

          {isArrived ? (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>Stored as dispute evidence only — not visible in your public portfolio.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
              <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
              <span>These photos will be added to your public portfolio as a completed job.</span>
            </div>
          )}

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-400 hover:border-orange-400 hover:text-orange-500 transition"
              >
                <Upload size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-8 flex flex-col items-center gap-2 text-stone-400 hover:border-orange-400 hover:text-orange-500 transition"
            >
              <ImageIcon size={28} />
              <span className="text-sm font-medium">Tap to add photos</span>
              <span className="text-xs">Camera or gallery</span>
            </button>
          )}

          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
            onChange={(e) => handleFiles(e.target.files)} className="hidden" />

          <div className="flex gap-3 pt-1">
            {isArrived && onSkip && (
              <button onClick={onSkip} className="flex-1 border border-stone-200 text-stone-500 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition">
                Skip for now
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={saving || images.length === 0}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${isArrived ? "bg-amber-500 hover:bg-amber-600" : "bg-green-600 hover:bg-green-700"}`}
            >
              {saving ? "Saving…" : isArrived ? "Save Evidence" : "Save to Portfolio"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Cancel Warning Modal ────────────────────────────────────────────────────
function CancelWarningModal({
  jobDescription,
  onConfirm,
  onDismiss,
  cancelling,
}: {
  jobDescription: string;
  onConfirm: () => void;
  onDismiss: () => void;
  cancelling: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <TriangleAlert size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800 text-base">Cancel this job?</h2>
              <p className="text-sm text-stone-500 mt-0.5 leading-snug">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Job context */}
          <div className="bg-stone-50 rounded-xl px-4 py-3 text-sm text-stone-600 border border-stone-100">
            <span className="font-medium text-stone-700">Job: </span>{jobDescription}
          </div>

          {/* Warnings */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm text-stone-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
              <span>The employer may leave a <strong>negative review</strong> on your profile for this cancellation.</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-stone-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <Ban size={15} className="shrink-0 mt-0.5 text-red-500" />
              <span>Repeated cancellations after acceptance may result in <strong>account restrictions</strong> or removal from the platform.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onDismiss}
              className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition"
            >
              Keep job
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onConfirm}
              disabled={cancelling}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  PENDING:           { pill: "bg-amber-50 text-amber-700 border border-amber-200",    dot: "bg-amber-400",  label: "Pending" },
  ACCEPTED:          { pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-400", label: "Accepted" },
  DECLINED:          { pill: "bg-red-50 text-red-600 border border-red-200",          dot: "bg-red-400",    label: "Declined" },
  COUNTERED:         { pill: "bg-purple-50 text-purple-700 border border-purple-200", dot: "bg-purple-400", label: "Counter Offered" },
  EMPLOYER_COUNTERED:{ pill: "bg-indigo-50 text-indigo-700 border border-indigo-200", dot: "bg-indigo-400", label: "Employer Countered" },
  ON_THE_WAY:        { pill: "bg-cyan-50 text-cyan-700 border border-cyan-200",       dot: "bg-cyan-400",   label: "On The Way" },
  ARRIVED:           { pill: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-400", label: "Arrived" },
  IN_PROGRESS:       { pill: "bg-orange-50 text-orange-700 border border-orange-200", dot: "bg-orange-400", label: "In Progress" },
  COMPLETED:         { pill: "bg-green-50 text-green-700 border border-green-200",    dot: "bg-green-500",  label: "Completed" },
  REDO_REQUESTED:    { pill: "bg-red-50 text-red-600 border border-red-200",          dot: "bg-red-400",    label: "Redo Requested" },
  SATISFIED:         { pill: "bg-green-50 text-green-700 border border-green-200",    dot: "bg-green-500",  label: "Satisfied" },
  DISPUTED:          { pill: "bg-red-50 text-red-700 border border-red-200",          dot: "bg-red-500",    label: "Disputed" },
  CANCELLED:         { pill: "bg-stone-100 text-stone-500 border border-stone-200",   dot: "bg-stone-400",  label: "Cancelled" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { pill: "bg-stone-100 text-stone-500 border border-stone-200", dot: "bg-stone-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function TechnicianJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [counterPrice, setCounterPrice] = useState("");
  const [redoReason, setRedoReason] = useState("");
  const [showRedoInput, setShowRedoInput] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ jobId: string; jobDescription: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [photoModal, setPhotoModal] = useState<{
    mode: "arrived" | "completed";
    jobId: string;
    jobDescription: string;
    pendingStatus: string;
  } | null>(null);

  const proximityAlertedRef = useRef<Set<string>>(new Set());
  const proximityIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs?role=technician");
    const data = await res.json();
    setJobs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchJobs();
  }, [status, router, fetchJobs]);

  // Proximity polling
  useEffect(() => {
    const onTheWayJobs = jobs.filter((j) => j.status === "ON_THE_WAY");
    if (onTheWayJobs.length === 0) {
      if (proximityIntervalRef.current) { clearInterval(proximityIntervalRef.current); proximityIntervalRef.current = null; }
      return;
    }
    if (proximityIntervalRef.current) return;
    proximityIntervalRef.current = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        for (const job of onTheWayJobs) {
          if (!job.employer?.latitude || proximityAlertedRef.current.has(job.id)) continue;
          const dist = haversine(latitude, longitude, job.employer.latitude, job.employer.longitude);
          if (dist <= 1.0) {
            proximityAlertedRef.current.add(job.id);
            await fetch(`/api/jobs/${job.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ proximityAlert: true, techLat: latitude, techLng: longitude }),
            });
            toast("📍 You're less than 1 km from the employer!", { icon: "🚗" });
          }
        }
      });
    }, 30_000);
    return () => { if (proximityIntervalRef.current) { clearInterval(proximityIntervalRef.current); proximityIntervalRef.current = null; } };
  }, [jobs]);

  const updateStatus = async (jobId: string, newStatus: string, extra: Record<string, any> = {}) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, ...extra }),
    });
    if (res.ok) { toast.success(`Status updated to ${STATUS_STYLES[newStatus]?.label ?? newStatus}`); fetchJobs(); }
    else toast.error("Failed to update status");
  };

  const promptPhotos = (jobId: string, description: string, mode: "arrived" | "completed", pendingStatus: string) => {
    setPhotoModal({ mode, jobId, jobDescription: description, pendingStatus });
  };

  const handlePhotoSave = async (images: string[]) => {
    if (!photoModal) return;
    const { mode, jobId, pendingStatus } = photoModal;
    const field = mode === "arrived" ? "arrivedImages" : "completedImages";
    const body: Record<string, any> = { status: pendingStatus, [field]: images };
    if (mode === "completed") body.autoPortfolio = true;
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(mode === "arrived" ? "Evidence saved. Status updated to Arrived." : "Photos saved to portfolio!");
      setPhotoModal(null);
      fetchJobs();
    } else toast.error("Failed to save photos");
  };

  const handlePhotoSkip = async () => {
    if (!photoModal) return;
    await updateStatus(photoModal.jobId, photoModal.pendingStatus);
    setPhotoModal(null);
  };

  const submitCounter = async (jobId: string) => {
    const price = parseFloat(counterPrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COUNTERED", counterPrice: price }),
    });
    toast.success("Counter offer sent!");
    setCounterPrice("");
    fetchJobs();
  };

  const submitRedo = async (jobId: string) => {
    if (!redoReason.trim()) { toast.error("Please describe the issue"); return; }
    await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REDO_REQUESTED", redoReason }),
    });
    toast.success("Redo request sent");
    setRedoReason(""); setShowRedoInput(null); fetchJobs();
  };

  const handleCancelConfirm = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    const res = await fetch(`/api/jobs/${cancelModal.jobId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) { toast.success("Job cancelled"); fetchJobs(); setCancelModal(null); }
    else toast.error("Failed to cancel job");
    setCancelling(false);
  };

  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [reviewJobId, setReviewJobId] = useState<string | null>(null);
  const submitReview = async (jobId: string, employerId: string) => {
    await fetch("/api/reviews", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRequestId: jobId, revieweeId: employerId, ...review }),
    });
    toast.success("Review submitted!");
    setReviewJobId(null); fetchJobs();
  };

  const historyStatuses = ["COMPLETED", "SATISFIED", "DISPUTED", "DECLINED", "CANCELLED"];
  const activeJobs = jobs.filter((j) => !historyStatuses.includes(j.status));
  const historyJobs = jobs.filter((j) => historyStatuses.includes(j.status));
  const displayedJobs = activeTab === "active" ? activeJobs : historyJobs;

  if (loading) return <Layout title="Jobs"><div className="flex justify-center py-20"><Spinner /></div></Layout>;

  return (
    <Layout title="My Jobs">
      <AnimatePresence>
        {photoModal && (
          <PhotoCaptureModal
            mode={photoModal.mode} jobId={photoModal.jobId}
            jobDescription={photoModal.jobDescription}
            onSave={handlePhotoSave}
            onSkip={photoModal.mode === "arrived" ? handlePhotoSkip : undefined}
          />
        )}
        {cancelModal && (
          <CancelWarningModal
            jobDescription={cancelModal.jobDescription}
            onConfirm={handleCancelConfirm}
            onDismiss={() => setCancelModal(null)}
            cancelling={cancelling}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit">
          {(["active", "history"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab ? "bg-white text-orange-600 shadow-sm" : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab === "active" ? `Active (${activeJobs.length})` : `History (${historyJobs.length})`}
            </button>
          ))}
        </div>

        {displayedJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Briefcase size={40} className="mx-auto mb-3 text-stone-300" />
            <p className="text-stone-500 font-medium">
              {activeTab === "active" ? "No active jobs" : "No job history yet"}
            </p>
          </div>
        ) : (
          displayedJobs.map((job) => (
            <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-50/60 transition text-left"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status-tinted icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    job.status === "ACCEPTED" || job.status === "ON_THE_WAY" || job.status === "ARRIVED" || job.status === "IN_PROGRESS"
                      ? "bg-orange-50"
                      : job.status === "COMPLETED" || job.status === "SATISFIED"
                      ? "bg-green-50"
                      : job.status === "DECLINED" || job.status === "CANCELLED" || job.status === "DISPUTED"
                      ? "bg-red-50"
                      : "bg-stone-50"
                  }`}>
                    <Briefcase size={17} className={`${
                      job.status === "ACCEPTED" || job.status === "ON_THE_WAY" || job.status === "ARRIVED" || job.status === "IN_PROGRESS"
                        ? "text-orange-500"
                        : job.status === "COMPLETED" || job.status === "SATISFIED"
                        ? "text-green-600"
                        : job.status === "DECLINED" || job.status === "CANCELLED" || job.status === "DISPUTED"
                        ? "text-red-400"
                        : "text-stone-400"
                    }`} />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-stone-800 text-sm leading-snug truncate">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-stone-400">{job.employer?.name}</span>
                      <span className="text-stone-200">·</span>
                      <span className="text-xs font-semibold text-stone-600">₦{job.offeredPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <StatusPill status={job.status} />
                  {expandedJob === job.id
                    ? <ChevronUp size={15} className="text-stone-300" />
                    : <ChevronDown size={15} className="text-stone-300" />}
                </div>
              </button>

              {/* Expanded body */}
              <AnimatePresence>
                {expandedJob === job.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-stone-100 pt-4">
                      <JobTimeline status={job.status} />

                      {/* Counter price info banner */}
                      {job.status === "EMPLOYER_COUNTERED" && job.counterPrice && (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm">
                          <span className="text-indigo-600 font-medium">Employer's counter offer:</span>
                          <span className="font-bold text-indigo-700">₦{job.counterPrice?.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {job.status === "PENDING" && (
                          <>
                            <button onClick={() => updateStatus(job.id, "ACCEPTED")}
                              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                              <CheckCircle2 size={14} /> Accept
                            </button>
                            <button onClick={() => updateStatus(job.id, "DECLINED")}
                              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                              <XCircle size={14} /> Decline
                            </button>
                          </>
                        )}

                        {job.status === "EMPLOYER_COUNTERED" && (
                          <>
                            <button onClick={() => updateStatus(job.id, "ACCEPTED")}
                              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                              <CheckCircle2 size={14} /> Accept Counter
                            </button>
                            <button onClick={() => updateStatus(job.id, "DECLINED")}
                              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                              <XCircle size={14} /> Decline
                            </button>
                          </>
                        )}

                        {(job.status === "PENDING" || job.status === "EMPLOYER_COUNTERED") && (
                          <div className="flex gap-2 w-full">
                            <input type="number" placeholder="Your counter price (₦)" value={counterPrice}
                              onChange={(e) => setCounterPrice(e.target.value)}
                              className="flex-1 border border-stone-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50" />
                            <button onClick={() => submitCounter(job.id)}
                              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                              Counter
                            </button>
                          </div>
                        )}

                        {job.status === "ACCEPTED" && (
                          <>
                            <button
                              onClick={() => {
                                navigator.geolocation?.getCurrentPosition(
                                  async (pos) => updateStatus(job.id, "ON_THE_WAY", { techLat: pos.coords.latitude, techLng: pos.coords.longitude }),
                                  () => updateStatus(job.id, "ON_THE_WAY")
                                );
                              }}
                              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                              <Navigation size={14} /> I'm On The Way
                            </button>
                            <button
                              onClick={() => setCancelModal({ jobId: job.id, jobDescription: job.description })}
                              className="flex items-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition"
                            >
                              <XCircle size={14} /> Cancel Job
                            </button>
                          </>
                        )}

                        {job.status === "ON_THE_WAY" && (
                          <button onClick={() => promptPhotos(job.id, job.description, "arrived", "ARRIVED")}
                            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                            <MapPin size={14} /> I've Arrived
                          </button>
                        )}

                        {(job.status === "ARRIVED" || job.status === "IN_PROGRESS") && (
                          <button onClick={() => promptPhotos(job.id, job.description, "completed", "COMPLETED")}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                            <CheckCircle2 size={14} /> Mark Complete
                          </button>
                        )}

                        {job.status === "REDO_REQUESTED" && !showRedoInput && (
                          <button onClick={() => setShowRedoInput(job.id)}
                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
                            <Clock size={14} /> Respond to Redo
                          </button>
                        )}
                        {showRedoInput === job.id && (
                          <div className="w-full space-y-2">
                            <textarea rows={2} placeholder="Explain what will be fixed…" value={redoReason}
                              onChange={(e) => setRedoReason(e.target.value)}
                              className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50 resize-none" />
                            <div className="flex gap-2">
                              <button onClick={() => submitRedo(job.id)} className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition">Submit</button>
                              <button onClick={() => setShowRedoInput(null)} className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Evidence images */}
                      {job.arrivedImages?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-1.5">
                            <Camera size={12} /> Before-work evidence ({job.arrivedImages.length} photo{job.arrivedImages.length !== 1 ? "s" : ""})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {job.arrivedImages.map((img: string, i: number) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                            ))}
                          </div>
                        </div>
                      )}

                      {job.completedImages?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> Completed work photos ({job.completedImages.length})
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {job.completedImages.map((img: string, i: number) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat */}
                      <div className="border border-stone-100 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                          <MessageCircle size={14} className="text-orange-400" />
                          <span className="text-xs font-medium text-stone-500">Chat with {job.employer?.name}</span>
                        </div>
                        <ChatWindow jobRequestId={job.id} initialMessages={job.messages ?? []} />
                      </div>

                      {/* Review */}
                      {job.status === "SATISFIED" && !job.review && (
                        <div className="border border-stone-100 rounded-2xl p-4 space-y-3">
                          <p className="text-sm font-semibold text-stone-700">Leave a review for {job.employer?.name}</p>
                          <RatingStars rating={review.rating} interactive onRate={(v) => setReview((r) => ({ ...r, rating: v }))} />
                          <textarea rows={2} placeholder="Write a comment (optional)…" value={review.comment}
                            onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                            className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50 resize-none" />
                          <button onClick={() => submitReview(job.id, job.employerId)}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
                            Submit Review
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </Layout>
  );
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}