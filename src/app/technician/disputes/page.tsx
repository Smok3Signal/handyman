"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import type { Transition } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Upload,
  Send,
  ShieldCheck,
  ShieldOff,
  Shield,
  Clock,
  X,
} from "lucide-react";

// ── Easing helpers ───────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

// ── Dispute status styles ─────────────────────────────────────────────────────
const DISPUTE_STATUS: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  OPEN: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    label: "Open — Action Required",
  },
  DEFENDING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    label: "Defense Submitted",
  },
  RESOLVED_TECHNICIAN: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Resolved — You Won",
  },
  RESOLVED_EMPLOYER: {
    bg: "bg-stone-100",
    text: "text-stone-600",
    border: "border-stone-200",
    label: "Resolved — Employer Won",
  },
  WITHDRAWN: {
    bg: "bg-stone-100",
    text: "text-stone-500",
    border: "border-stone-200",
    label: "Withdrawn",
  },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-40" />
      ))}
    </div>
  );
}

// ── Deadline helper ───────────────────────────────────────────────────────────
function getDeadline(createdAt: string) {
  const deadline = new Date(new Date(createdAt).getTime() + 24 * 60 * 60 * 1000);
  const hoursLeft = Math.max(
    0,
    Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
  );
  return hoursLeft;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TechnicianDisputesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defending, setDefending] = useState<string | null>(null);
  const [defenseForm, setDefenseForm] = useState<{ statement: string; images: string[] }>({
    statement: "",
    images: [],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchDisputes();
  }, [status, router]);

  const fetchDisputes = async () => {
    setLoading(true);
    const res = await fetch("/api/disputes");
    const data = await res.json();
    setDisputes(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setDefenseForm((prev) => ({
          ...prev,
          images: [...prev.images, ev.target?.result as string],
        }));
      reader.readAsDataURL(file);
    });
  };

  const submitDefense = async (disputeId: string) => {
    if (!defenseForm.statement.trim()) {
      toast.error("Please write a defense statement");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DEFEND",
        defenseStatement: defenseForm.statement,
        defenseImages: defenseForm.images,
      }),
    });
    if (res.ok) {
      toast.success("Defense submitted! Admin will review it.");
      setDefending(null);
      setDefenseForm({ statement: "", images: [] });
      fetchDisputes();
    } else {
      toast.error("Failed to submit defense");
    }
    setSubmitting(false);
  };

  // Counts for summary strip
  // WITHDRAWN counts as Resolved alongside RESOLVED_TECHNICIAN / RESOLVED_EMPLOYER —
  // it's a closed dispute, just closed by the employer backing out rather than
  // an admin ruling.
  const openCount = disputes.filter((d) => d.status === "OPEN").length;
  const defendingCount = disputes.filter((d) => d.status === "DEFENDING").length;
  const resolvedCount = disputes.filter(
    (d) =>
      d.status === "RESOLVED_TECHNICIAN" ||
      d.status === "RESOLVED_EMPLOYER" ||
      d.status === "WITHDRAWN"
  ).length;

  return (
    <Layout title="My Disputes">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
        >
          <h1 className="text-2xl font-bold text-stone-800">My Disputes</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Manage and respond to disputes filed against you
          </p>
        </motion.div>

        {/* ── Summary strip (only when there's data) ── */}
        {!loading && disputes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.06 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: "Open", value: openCount, icon: AlertTriangle, tint: "from-red-50 to-white border-red-100", icon_tint: "bg-red-100 text-red-500" },
              { label: "In Review", value: defendingCount, icon: Clock, tint: "from-amber-50 to-white border-amber-100", icon_tint: "bg-amber-100 text-amber-500" },
              { label: "Resolved", value: resolvedCount, icon: ShieldCheck, tint: "from-stone-50 to-white border-stone-200", icon_tint: "bg-stone-100 text-stone-500" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`bg-linear-to-br ${s.tint} border rounded-2xl p-4`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.icon_tint}`}>
                    <Icon size={16} />
                  </div>
                  <p className="text-xl font-bold text-stone-800">{s.value}</p>
                  <p className="text-xs text-stone-500">{s.label}</p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Skeleton />
        ) : disputes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={mountEase}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200"
          >
            <ShieldCheck size={48} className="mx-auto mb-3 text-emerald-300" />
            <p className="font-semibold text-stone-700">No disputes</p>
            <p className="text-sm text-stone-400 mt-1">Keep up the great work!</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute, i) => {
              const hoursLeft = getDeadline(dispute.createdAt);
              const isUrgent = dispute.status === "OPEN" && hoursLeft < 6;
              const styles = DISPUTE_STATUS[dispute.status] ?? DISPUTE_STATUS.OPEN;

              return (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...mountEase, delay: i * 0.07 }}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${
                    isUrgent ? "border-red-400" : "border-stone-200"
                  }`}
                >
                  {/* Urgent banner */}
                  {isUrgent && (
                    <div className="bg-red-600 text-white px-5 py-2 text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle size={15} />
                      Only {hoursLeft}h left to respond — respond now!
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    {/* Card header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium border ${styles.bg} ${styles.text} ${styles.border}`}>
                          {styles.label}
                        </span>
                        <p className="font-semibold text-stone-800">
                          Dispute from {dispute.employer?.name}
                        </p>
                        <p className="text-xs text-stone-400">
                          Filed {new Date(dispute.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {dispute.status === "OPEN" && (
                        <div className="text-right">
                          <p className="text-xs text-stone-400">Respond within</p>
                          <p className={`text-sm font-bold ${hoursLeft < 6 ? "text-red-600" : "text-orange-500"}`}>
                            {hoursLeft}h remaining
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action required warning */}
                    {dispute.status === "OPEN" && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3.5">
                        <p className="text-red-700 text-sm font-semibold mb-1 flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Action Required
                        </p>
                        <p className="text-red-600 text-xs leading-relaxed">
                          A dispute has been filed against you. Your rank has been temporarily docked.
                          Respond within 24 hours or risk account suspension.
                        </p>
                      </div>
                    )}

                    {/* Employer complaint */}
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
                        Employer Complaint
                      </p>
                      <p className="text-sm text-stone-700 leading-relaxed">{dispute.reason}</p>
                    </div>

                    {/* Outcome — Won */}
                    {dispute.status === "RESOLVED_TECHNICIAN" && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <ShieldCheck size={28} className="mx-auto mb-2 text-emerald-500" />
                        <p className="text-emerald-700 font-bold">You won the dispute</p>
                        <p className="text-emerald-600 text-sm mt-1">
                          Admin reviewed your evidence and ruled in your favour. Rank points restored.
                        </p>
                      </div>
                    )}

                    {/* Outcome — Lost */}
                    {dispute.status === "RESOLVED_EMPLOYER" && (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                        <ShieldOff size={28} className="mx-auto mb-2 text-stone-400" />
                        <p className="text-stone-700 font-bold">Dispute ruled for employer</p>
                        <p className="text-stone-500 text-sm mt-1">
                          Your rank has been docked and a notice placed on your profile for 60 days.
                        </p>
                        {dispute.noticeExpiresAt && (
                          <p className="text-stone-400 text-xs mt-1.5">
                            Notice expires:{" "}
                            {new Date(dispute.noticeExpiresAt).toLocaleDateString("en-NG", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Outcome — Withdrawn by employer */}
                    {dispute.status === "WITHDRAWN" && (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-center">
                        <Shield size={28} className="mx-auto mb-2 text-stone-400" />
                        <p className="text-stone-700 font-bold">Dispute withdrawn</p>
                        <p className="text-stone-500 text-sm mt-1">
                          The employer withdrew this dispute. No action was taken against your
                          rank or rating.
                        </p>
                      </div>
                    )}

                    {/* Defense already submitted */}
                    {dispute.defenseStatement && dispute.status === "DEFENDING" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                        <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Shield size={12} /> Your Defense (Submitted)
                        </p>
                        <p className="text-amber-800 text-sm leading-relaxed">
                          {dispute.defenseStatement}
                        </p>
                        <p className="text-amber-500 text-xs mt-2">Awaiting admin review…</p>
                      </div>
                    )}

                    {/* Defense form / CTA */}
                    {dispute.status === "OPEN" && (
                      <AnimatePresence mode="wait">
                        {defending === dispute.id ? (
                          <motion.div
                            key="form"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className="border border-stone-200 rounded-2xl p-4 space-y-4 overflow-hidden"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-stone-800">Submit Your Defense</p>
                              <button
                                onClick={() => setDefending(null)}
                                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition"
                              >
                                <X size={13} />
                              </button>
                            </div>

                            {/* Statement */}
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                                Written Statement
                              </label>
                              <textarea
                                rows={4}
                                value={defenseForm.statement}
                                onChange={(e) =>
                                  setDefenseForm((p) => ({ ...p, statement: e.target.value }))
                                }
                                placeholder="Explain your side — what work was done and why it met the required standard…"
                                className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none bg-stone-50"
                              />
                            </div>

                            {/* Image upload */}
                            <div>
                              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                                Evidence Photos (optional)
                              </label>
                              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-xl p-4 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition">
                                <Upload size={16} className="text-stone-400" />
                                <span className="text-sm text-stone-500">Upload photos of your work</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                              </label>

                              {defenseForm.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  {defenseForm.images.map((img, idx) => (
                                    <div key={idx} className="relative">
                                      <img
                                        src={img}
                                        alt={`Evidence ${idx + 1}`}
                                        className="rounded-lg aspect-square object-cover w-full"
                                      />
                                      <button
                                        onClick={() =>
                                          setDefenseForm((p) => ({
                                            ...p,
                                            images: p.images.filter((_, k) => k !== idx),
                                          }))
                                        }
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => setDefending(null)}
                                className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition"
                              >
                                Cancel
                              </button>
                              <motion.button
                                whileHover={{ scale: 1.02, transition: hoverSpring }}
                                whileTap={{ scale: 0.97, transition: hoverSpring }}
                                onClick={() => submitDefense(dispute.id)}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                              >
                                {submitting ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <>
                                    <Send size={14} /> Submit Defense
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.button
                            key="cta"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            whileHover={{ scale: 1.02, transition: hoverSpring }}
                            whileTap={{ scale: 0.97, transition: hoverSpring }}
                            onClick={() => setDefending(dispute.id)}
                            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold transition"
                          >
                            <Shield size={16} /> Submit My Defense
                          </motion.button>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}