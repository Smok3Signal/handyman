"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldAlert,
  Clock,
  Briefcase,
  ChevronRight,
  ArrowLeftRight,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TechProfile = {
  businessName: string;
  serviceCategory: string;
  averageRating: number;
  totalReviews: number;
  yearsOfExperience: number;
  rank: string;
};

type Technician = {
  id: string;
  name: string;
  phone: string | null;
  profileImage: string | null;
  technicianProfile: TechProfile | null;
};

type Proposal = {
  id: string;
  proposedPrice: number;
  message: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  technician: Technician;
};

type Signal = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number | null;
  radiusKm: number;
  status: string;
  expiresAt: string;
  proposals: Proposal[];
};

const RANK_COLORS: Record<string, string> = {
  Bronze:   "bg-orange-50 text-orange-700",
  Silver:   "bg-slate-100 text-slate-700",
  Gold:     "bg-amber-50 text-amber-700",
  Platinum: "bg-cyan-50 text-cyan-700",
  Diamond:  "bg-purple-50 text-purple-700",
};

const PROPOSAL_STATUS: Record<string, { label: string; className: string }> = {
  PENDING:  { label: "Pending",  className: "bg-stone-100 text-stone-600" },
  ACCEPTED: { label: "Accepted", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Declined", className: "bg-red-50 text-red-600" },
};

export default function DistressProposalsDrawer({
  signalId,
  onClose,
  onJobCreated,
}: {
  signalId: string;
  onClose: () => void;
  onJobCreated: () => void;
}) {
  const router = useRouter();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/distress/${signalId}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSignal(data);
    } catch {
      setError("Couldn't load proposals. Try again.");
    } finally {
      setLoading(false);
    }
  }, [signalId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (
    proposalId: string,
    action: "ACCEPT" | "COUNTER" | "REJECT",
    counterPrice?: number,
    counterMessage?: string
  ) => {
    setActioning(proposalId + action);
    try {
      const res = await fetch(`/api/distress/${signalId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, action, counterPrice, counterMessage }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Something went wrong");
        return;
      }
      if (action === "REJECT") {
        await load();
      } else {
        // ACCEPT or COUNTER — job created, close drawer and go to jobs
        onJobCreated();
        onClose();
        router.push("/employer/jobs");
      }
    } catch {
      alert("Network error — try again");
    } finally {
      setActioning(null);
    }
  };

  const pendingProposals  = signal?.proposals.filter((p) => p.status === "PENDING")  ?? [];
  const resolvedProposals = signal?.proposals.filter((p) => p.status !== "PENDING")  ?? [];
  const timeLeft = signal
    ? Math.max(0, Math.floor((new Date(signal.expiresAt).getTime() - Date.now()) / 60000))
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-stone-800 text-sm truncate">
              {signal?.title ?? "Distress signal"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {signal?.proposals.length ?? 0} proposal{signal?.proposals.length !== 1 ? "s" : ""} received
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Signal meta */}
        {signal && (
          <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft > 0 ? `${timeLeft}m left` : "Expired"}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Briefcase className="w-3.5 h-3.5" />
              {signal.category}
            </div>
            {signal.budget != null && (
              <div className="text-xs font-semibold text-stone-600">
                Budget: ₦{signal.budget.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={load} className="text-xs font-semibold text-orange-500 hover:underline">
                Try again
              </button>
            </div>
          ) : signal?.proposals.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
              <ShieldAlert className="w-10 h-10 text-stone-200" />
              <p className="text-sm font-semibold text-stone-500">No proposals yet</p>
              <p className="text-xs text-stone-400">
                Technicians within {signal.radiusKm}km will be notified. Check back soon.
              </p>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-3">
              {pendingProposals.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1">
                    Awaiting your decision
                  </p>
                  {pendingProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      actioning={actioning}
                      onAccept={() => handleAction(proposal.id, "ACCEPT")}
                      onCounter={(price, msg) => handleAction(proposal.id, "COUNTER", price, msg)}
                      onReject={() => handleAction(proposal.id, "REJECT")}
                    />
                  ))}
                </>
              )}

              {resolvedProposals.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 px-1 mt-2">
                    Actioned
                  </p>
                  {resolvedProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      actioning={null}
                      onAccept={() => {}}
                      onCounter={() => {}}
                      onReject={() => {}}
                      readonly
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProposalCard({
  proposal,
  actioning,
  onAccept,
  onCounter,
  onReject,
  readonly = false,
}: {
  proposal: Proposal;
  actioning: string | null;
  onAccept: () => void;
  onCounter: (price: number, msg: string) => void;
  onReject: () => void;
  readonly?: boolean;
}) {
  const [mode, setMode] = useState<"idle" | "counter">("idle");
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  const tech = proposal.technician;
  const profile = tech.technicianProfile;
  const statusMeta = PROPOSAL_STATUS[proposal.status];
  const rankClass = RANK_COLORS[profile?.rank ?? "Bronze"] ?? RANK_COLORS.Bronze;

  const isAccepting  = actioning === proposal.id + "ACCEPT";
  const isCountering = actioning === proposal.id + "COUNTER";
  const isRejecting  = actioning === proposal.id + "REJECT";
  const isActioning  = isAccepting || isCountering || isRejecting;

  const handleCounterSubmit = () => {
    const price = parseFloat(counterPrice.replace(/,/g, ""));
    if (!price || price <= 0) { alert("Enter a valid counter price"); return; }
    onCounter(price, counterMessage.trim());
  };

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition-opacity ${
        readonly && proposal.status === "REJECTED" ? "opacity-50" : ""
      }`}
      style={{ borderColor: proposal.status === "ACCEPTED" ? "#6ee7b7" : "#e7e5e4" }}
    >
      {/* Tech info */}
      <div className="flex items-start gap-3 p-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#fb923c,#ea580c)" }}
        >
          {tech.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm text-stone-800">{tech.name}</p>
            {profile?.rank && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rankClass}`}>
                {profile.rank}
              </span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            {profile?.serviceCategory ?? "Technician"} · {profile?.yearsOfExperience ?? 0}yr exp
          </p>
          {profile && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-amber-400" fill="#fbbf24" />
              <span className="text-xs font-semibold text-stone-600">
                {profile.averageRating.toFixed(1)}
              </span>
              <span className="text-xs text-stone-400">
                ({profile.totalReviews} review{profile.totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Proposed price + message */}
      <div className="px-4 pb-3 border-t border-stone-50">
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            Proposed price
          </p>
          <p className="text-xl font-black text-stone-800 mt-0.5">
            ₦{proposal.proposedPrice.toLocaleString()}
          </p>
        </div>
        {proposal.message && (
          <p className="text-xs text-stone-500 mt-2 leading-relaxed bg-stone-50 rounded-xl px-3 py-2.5">
            {proposal.message}
          </p>
        )}
      </div>

      {/* Action buttons — pending only */}
      {!readonly && proposal.status === "PENDING" && mode === "idle" && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={onReject}
            disabled={isActioning}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
          >
            {isRejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            {isRejecting ? "…" : "Decline"}
          </button>
          <button
            onClick={() => setMode("counter")}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Counter offer
          </button>
          <button
            onClick={onAccept}
            disabled={isActioning}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
          >
            {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {isAccepting ? "Accepting…" : "Accept"}
            {!isAccepting && <ChevronRight className="w-3 h-3 opacity-60" />}
          </button>
        </div>
      )}

      {/* Counter offer form */}
      {!readonly && proposal.status === "PENDING" && mode === "counter" && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 flex flex-col gap-3">
          <p className="text-xs font-bold text-stone-600">Your counter offer</p>

          {/* Price input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">₦</span>
            <input
              type="number"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              placeholder={proposal.proposedPrice.toString()}
              className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>

          {/* Optional message */}
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-3.5 h-3.5 text-stone-300" />
            <textarea
              value={counterMessage}
              onChange={(e) => setCounterMessage(e.target.value)}
              placeholder="Add a note to the technician (optional)"
              rows={2}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-600 resize-none focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setMode("idle"); setCounterPrice(""); setCounterMessage(""); }}
              disabled={isActioning}
              className="flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCounterSubmit}
              disabled={isActioning || !counterPrice}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50 transition-colors"
              style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)" }}
            >
              {isCountering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeftRight className="w-3.5 h-3.5" />}
              {isCountering ? "Sending…" : "Send counter offer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}