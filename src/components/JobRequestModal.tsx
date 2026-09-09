"use client";

import { useState } from "react";
import { X, Wrench, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "./Spinner";

interface JobRequestModalProps {
  technicianId: string;
  technicianName: string;
  technicianCategory?: string;
  technicianBasePrice?: number;
  onClose: () => void;
  onSubmit: (data: {
    technicianId: string;
    description: string;
    offeredPrice: string;
  }) => void;
}

export default function JobRequestModal({
  technicianId,
  technicianName,
  technicianCategory,
  technicianBasePrice,
  onClose,
  onSubmit,
}: JobRequestModalProps) {
  const [description, setDescription] = useState("");
  const [offeredPrice, setOfferedPrice] = useState(
    technicianBasePrice ? String(technicianBasePrice) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const descOk = description.trim().length >= 10;
  const priceOk = offeredPrice !== "" && !isNaN(parseFloat(offeredPrice)) && parseFloat(offeredPrice) > 0;
  const canSubmit = descOk && priceOk && !submitting && !submitted;

  const priceDelta = technicianBasePrice && priceOk
    ? parseFloat(offeredPrice) - technicianBasePrice
    : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({ technicianId, description, offeredPrice });
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 px-6 pt-6 pb-8">
          {/* Ambient glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
          <Wrench className="absolute -bottom-8 -right-8 text-white/5 pointer-events-none" size={120} strokeWidth={1} />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">Job Request</p>
              <h2 className="text-xl font-black text-white leading-tight">{technicianName}</h2>
              {technicianCategory && (
                <p className="text-white/40 text-sm mt-0.5">{technicianCategory}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/60 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 -mt-3">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              What needs doing?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the job in detail — the more specific, the better."
              disabled={submitting || submitted}
              className="w-full border border-stone-200 rounded-2xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 disabled:opacity-60 disabled:bg-stone-50 resize-none transition"
            />
            {description.trim().length > 0 && !descOk && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> At least 10 characters
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Your Offered Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">₦</span>
              <input
                type="number"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                placeholder="e.g. 15000"
                disabled={submitting || submitted}
                className="w-full border border-stone-200 rounded-2xl pl-8 pr-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 disabled:opacity-60 disabled:bg-stone-50 transition"
              />
            </div>
            {/* Price delta hint */}
            {priceDelta !== null && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                priceDelta < 0 ? "text-amber-500" : priceDelta > 0 ? "text-emerald-500" : "text-stone-400"
              }`}>
                {priceDelta < 0
                  ? `₦${Math.abs(priceDelta).toLocaleString()} below base price — technician may counter`
                  : priceDelta > 0
                  ? `₦${priceDelta.toLocaleString()} above base price`
                  : "Matches base price"}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 border border-stone-200 text-stone-500 py-3 rounded-2xl text-sm font-semibold hover:bg-stone-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            onClick={handleSubmit}
            disabled={!canSubmit}
            whileTap={canSubmit ? { scale: 0.97 } : {}}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition ${
              submitted
                ? "bg-emerald-500 text-white cursor-default"
                : canSubmit
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <><Spinner size="sm" /> Sending…</>
            ) : submitted ? (
              <><CheckCircle2 size={15} /> Request Sent!</>
            ) : (
              <>Send Request <ChevronRight size={15} /></>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}