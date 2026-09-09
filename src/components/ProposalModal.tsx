"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, DollarSign, Zap, Clock, MapPin } from "lucide-react";
import toast from "react-hot-toast";

interface Signal {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  radiusKm: number;
  expiresAt: string;
  employer: { name: string; profileImage?: string };
  _count: { proposals: number };
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: Signal | null;
  onProposed?: () => void;
}

export default function ProposalModal({
  isOpen,
  onClose,
  signal,
  onProposed,
}: ProposalModalProps) {
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const timeLeft = signal
    ? Math.max(0, Math.round((new Date(signal.expiresAt).getTime() - Date.now()) / 60000))
    : 0;
  const hoursLeft = Math.floor(timeLeft / 60);
  const minutesLeft = timeLeft % 60;
  const expiryLabel = hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${minutesLeft}m left`;

  const handleSubmit = async () => {
    if (!proposedPrice || !message.trim()) {
      toast.error("Please enter your price and a message.");
      return;
    }
    if (!signal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/distress/${signal.id}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedPrice: parseFloat(proposedPrice),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit proposal");
      }

      toast.success("Proposal sent! The employer will be notified.");
      onProposed?.();
      onClose();
      setProposedPrice("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && signal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-x-4 top-[8%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-50 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-orange-500 to-amber-500 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Send size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-100">Submit Proposal</p>
                  <h2 className="text-white font-bold text-base leading-tight">Make your offer</h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
              {/* Signal summary card */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                      🚨 {signal.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-400 shrink-0">
                    <Clock size={11} />
                    {expiryLabel}
                  </div>
                </div>
                <p className="font-semibold text-stone-800 text-sm">{signal.title}</p>
                <p className="text-xs text-stone-500 line-clamp-2">{signal.description}</p>
                <div className="flex items-center gap-3 pt-1">
                  {signal.budget && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <DollarSign size={11} />
                      Budget: ₦{signal.budget.toLocaleString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <MapPin size={11} />
                    Within {signal.radiusKm} km
                  </span>
                  <span className="text-xs text-stone-400">
                    {signal._count.proposals} proposal{signal._count.proposals !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                  Your Price (₦) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">₦</span>
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="0"
                    className="w-full border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                </div>
                {signal.budget && parseFloat(proposedPrice) > signal.budget && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span> Your price exceeds the employer's stated budget of ₦{signal.budget.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-1.5">
                  Message to employer *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Briefly explain your experience with this type of job and when you can arrive..."
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                />
                <p className="text-xs text-stone-400 mt-1 text-right">{message.length} chars</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-stone-100 flex gap-3 shrink-0">
              <button
                onClick={onClose}
                className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !proposedPrice || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                {submitting ? "Sending..." : "Send Proposal"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}