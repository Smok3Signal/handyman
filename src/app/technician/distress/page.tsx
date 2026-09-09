"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import {
  ShieldAlert,
  MapPin,
  Clock,
  Wrench,
  ChevronRight,
  BadgeDollarSign,
  Radio,
  XCircle,
  CheckCircle,
  Ban,
} from "lucide-react";

const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  plumbing:   { bg: "bg-sky-50",    text: "text-sky-700",    dot: "bg-sky-400" },
  electrical: { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  painting:   { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  cleaning:   { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-400" },
  carpentry:  { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  ac:         { bg: "bg-cyan-50",   text: "text-cyan-700",   dot: "bg-cyan-400" },
  mechanics:  { bg: "bg-stone-100", text: "text-stone-700",  dot: "bg-stone-400" },
};

function categoryStyle(cat: string) {
  const key = cat?.toLowerCase();
  for (const k of Object.keys(CATEGORY_COLORS)) {
    if (key?.includes(k)) return CATEGORY_COLORS[k];
  }
  return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; cardBg: string; cardBorder: string; tagBg: string; tagText: string; bannerBg: string; bannerText: string; bannerIcon: string }
> = {
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    cardBg: "bg-stone-50",
    cardBorder: "border-stone-200",
    tagBg: "bg-stone-200",
    tagText: "text-stone-500",
    bannerBg: "bg-stone-100",
    bannerText: "text-stone-500",
    bannerIcon: "text-stone-400",
  },
  EXPIRED: {
    label: "Expired",
    icon: Ban,
    cardBg: "bg-red-50/60",
    cardBorder: "border-red-200",
    tagBg: "bg-red-100",
    tagText: "text-red-600",
    bannerBg: "bg-red-100",
    bannerText: "text-red-600",
    bannerIcon: "text-red-400",
  },
  ACCEPTED: {
    label: "Filled",
    icon: CheckCircle,
    cardBg: "bg-emerald-50/40",
    cardBorder: "border-emerald-200",
    tagBg: "bg-emerald-100",
    tagText: "text-emerald-600",
    bannerBg: "bg-emerald-50",
    bannerText: "text-emerald-600",
    bannerIcon: "text-emerald-400",
  },
};

// ─── SignalCard (top-level — never remounts) ──────────────────────────────────
interface SignalCardProps {
  signal: any;
  i: number;
  isProposing: boolean;
  alreadyProposed: boolean;
  proposalState: { price: string; message: string };
  submitting: boolean;
  onOpenProposal: () => void;
  onCancelProposal: () => void;
  onChangeProposal: (field: "price" | "message", value: string) => void;
  onSubmitProposal: () => void;
}

function SignalCard({
  signal,
  i,
  isProposing,
  alreadyProposed,
  proposalState,
  submitting,
  onOpenProposal,
  onCancelProposal,
  onChangeProposal,
  onSubmitProposal,
}: SignalCardProps) {
  const catStyle = categoryStyle(signal.category);
  const isInactive = signal.status !== "ACTIVE";
  const statusCfg = STATUS_CONFIG[signal.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountEase, delay: 0.05 + i * 0.05 }}
      // Inactive cards: coloured background, pointer-events-none blocks all interaction
      className={`rounded-2xl border overflow-hidden relative ${
        isInactive
          ? `${statusCfg.cardBg} ${statusCfg.cardBorder} pointer-events-none select-none`
          : "bg-white border-stone-200"
      }`}
    >
      {/* Status tag — top-right corner badge */}
      {isInactive && statusCfg && (
        <div className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${statusCfg.tagBg} ${statusCfg.tagText}`}>
          <statusCfg.icon size={11} />
          {statusCfg.label}
        </div>
      )}

      <div className={`p-5 ${isInactive ? "opacity-50" : ""}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm ${isInactive ? "bg-stone-300" : "bg-linear-to-br from-red-400 to-red-600"}`}>
              {signal.employer?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-stone-800 text-sm truncate">{signal.employer?.name}</p>
              <p className="text-xs text-stone-400">{timeAgo(signal.createdAt)}</p>
            </div>
          </div>
          {/* Category badge — leave room for status tag on inactive */}
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${isInactive ? "bg-stone-200 text-stone-400 mr-16" : `${catStyle.bg} ${catStyle.text}`}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? "bg-stone-300" : catStyle.dot}`} />
            {signal.category}
          </span>
        </div>

        <h3 className="font-bold text-stone-800 mb-1">{signal.title}</h3>
        <p className="text-sm text-stone-500 leading-relaxed mb-4">{signal.description}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
          {signal.budget && (
            <span className={`flex items-center gap-1.5 font-medium ${isInactive ? "text-stone-400" : "text-emerald-600"}`}>
              <BadgeDollarSign size={13} />
              ₦{signal.budget.toLocaleString()} offered
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <MapPin size={13} />{signal.radiusKm}km radius
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />{timeLeft(signal.expiresAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Wrench size={13} />
            {signal._count?.proposals ?? 0} {signal._count?.proposals === 1 ? "proposal" : "proposals"}
          </span>
        </div>
      </div>

      {/* Bottom banner for inactive, proposal area for active */}
      {isInactive && statusCfg ? (
        <div className={`flex items-center gap-2 px-5 py-3 border-t ${statusCfg.cardBorder} ${statusCfg.bannerBg}`}>
          <statusCfg.icon size={14} className={statusCfg.bannerIcon} />
          <p className={`text-sm font-medium ${statusCfg.bannerText}`}>
            {signal.status === "CANCELLED" && "This signal was cancelled by the employer"}
            {signal.status === "EXPIRED"   && "This signal has expired — no longer accepting proposals"}
            {signal.status === "ACCEPTED"  && "A technician has already been hired for this signal"}
          </p>
        </div>
      ) : (
        <div className="border-t border-stone-100 px-5 py-3">
          {alreadyProposed ? (
            <p className="text-sm text-emerald-600 font-medium py-1 flex items-center gap-1.5">
              <CheckCircle size={14} /> Proposal sent
            </p>
          ) : isProposing ? (
            <div className="space-y-3 py-2">
              <input
                type="number"
                placeholder="Your price (₦)"
                value={proposalState.price}
                onChange={(e) => onChangeProposal("price", e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <textarea
                placeholder="Short message to the employer (optional)"
                value={proposalState.message}
                onChange={(e) => onChangeProposal("message", e.target.value)}
                rows={2}
                className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onSubmitProposal}
                  disabled={submitting || !proposalState.price}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl py-2.5 transition-colors"
                >
                  {submitting ? "Sending…" : "Send proposal"}
                </motion.button>
                <button
                  onClick={onCancelProposal}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ x: 2, transition: hoverSpring }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenProposal}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 py-1 transition-colors"
            >
              Send a proposal <ChevronRight size={14} />
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DistressFeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState<any[]>([]);
  const [proposingId, setProposingId] = useState<string | null>(null);
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, { price: string; message: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set());

  const fetchSignals = useCallback(async () => {
    try {
      let url = "/api/distress";
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        ).catch(() => null);
        if (pos) url += `?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSignals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchSignals();
  }, [status, router, fetchSignals]);

  function getDraft(id: string) {
    return proposalDrafts[id] ?? { price: "", message: "" };
  }

  function handleChangeProposal(id: string, field: "price" | "message", value: string) {
    setProposalDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraft(id), [field]: value },
    }));
  }

  async function submitProposal(signalId: string) {
    const draft = getDraft(signalId);
    if (!draft.price) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/distress/${signalId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(draft.price), message: draft.message }),
      });
      if (res.ok) {
        setSuccessIds((prev) => new Set(prev).add(signalId));
        setProposingId(null);
        setProposalDrafts((prev) => {
          const next = { ...prev };
          delete next[signalId];
          return next;
        });
      } else {
        const err = await res.json();
        alert(err.error || "Failed to send proposal");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  const activeSignals   = signals.filter((s) => s.status === "ACTIVE");
  const inactiveSignals = signals.filter((s) => s.status !== "ACTIVE");

  if (loading) {
    return (
      <Layout title="Distress Feed" showBack={false}>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-3xl bg-stone-900 p-8 animate-pulse">
            <div className="h-3 w-24 bg-white/10 rounded mb-4" />
            <div className="h-8 w-64 bg-white/10 rounded mb-6" />
          </div>
          <div className="flex justify-center py-12">
            <Spinner size="lg" text="Loading distress signals..." />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Distress Feed" showBack={false}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-red-950 p-8 md:p-10"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
          <ShieldAlert className="absolute -right-8 -bottom-8 text-white/5 pointer-events-none" size={200} strokeWidth={1} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <p className="text-xs uppercase tracking-widest text-white/40">Live feed</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Distress Signals</h1>
            <p className="text-white/40 mt-2">
              Employers near you need urgent help.{" "}
              <span className="text-white/60">
                {activeSignals.length} active {activeSignals.length === 1 ? "signal" : "signals"} in your area.
              </span>
            </p>
          </div>
        </motion.div>

        {/* Active signals */}
        {activeSignals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={mountEase}
            className="bg-white rounded-2xl border border-stone-200 p-12 text-center"
          >
            <Radio size={40} className="mx-auto mb-3 text-stone-300" />
            <p className="font-semibold text-stone-600">No active signals nearby</p>
            <p className="text-sm text-stone-400 mt-1">
              When employers in your area send a distress signal, they'll appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {activeSignals.map((signal, i) => (
              <SignalCard
                key={signal.id}
                signal={signal}
                i={i}
                isProposing={proposingId === signal.id}
                alreadyProposed={successIds.has(signal.id)}
                proposalState={getDraft(signal.id)}
                submitting={submitting}
                onOpenProposal={() => setProposingId(signal.id)}
                onCancelProposal={() => {
                  setProposingId(null);
                  setProposalDrafts((prev) => { const n = { ...prev }; delete n[signal.id]; return n; });
                }}
                onChangeProposal={(field, value) => handleChangeProposal(signal.id, field, value)}
                onSubmitProposal={() => submitProposal(signal.id)}
              />
            ))}
          </div>
        )}

        {/* Closed signals */}
        {inactiveSignals.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-3">Closed signals</p>
            <div className="space-y-4">
              {inactiveSignals.map((signal, i) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  i={i}
                  isProposing={false}
                  alreadyProposed={false}
                  proposalState={{ price: "", message: "" }}
                  submitting={false}
                  onOpenProposal={() => {}}
                  onCancelProposal={() => {}}
                  onChangeProposal={() => {}}
                  onSubmitProposal={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}