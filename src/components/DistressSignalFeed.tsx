"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, MapPin, Clock, DollarSign, Users, RefreshCw, Filter } from "lucide-react";
import ProposalModal from "./ProposalModal";

const CATEGORIES = [
  "", "Plumber", "Electrician", "Painter", "Mechanic",
  "Cleaner", "Carpenter", "AC Technician", "Other",
];

interface Signal {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  radiusKm: number;
  expiresAt: string;
  createdAt: string;
  employer: { name: string; profileImage?: string };
  _count: { proposals: number };
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function timeLeft(expiresAt: string) {
  const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 60000));
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (diff === 0) return "Expired";
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

interface DistressSignalFeedProps {
  latitude: number | null;
  longitude: number | null;
  proposedSignalIds?: Set<string>; // signal IDs the tech has already proposed on
}

export default function DistressSignalFeed({
  latitude,
  longitude,
  proposedSignalIds = new Set(),
}: DistressSignalFeedProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [proposed, setProposed] = useState<Set<string>>(new Set(proposedSignalIds));
  const [showFilters, setShowFilters] = useState(false);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (latitude) params.set("lat", String(latitude));
      if (longitude) params.set("lng", String(longitude));
      if (category) params.set("category", category);
      const res = await fetch(`/api/distress?${params}`);
      const data = await res.json();
      setSignals(Array.isArray(data) ? data : []);
    } catch {
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, category]);

  useEffect(() => {
    fetchSignals();
    // Poll every 30 seconds for new signals
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const handleProposed = (signalId: string) => {
    setProposed((prev) => new Set([...Array.from(prev), signalId]));
    fetchSignals();
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-800 text-lg flex items-center gap-2">
            <Zap size={18} className="text-red-500" />
            Distress Signals
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Urgent jobs near you — updated every 30s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((f) => !f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showFilters || category
                ? "bg-orange-50 border-orange-300 text-orange-600"
                : "border-stone-200 text-stone-500 hover:border-stone-300"
            }`}
          >
            <Filter size={12} />
            Filter
          </button>
          <button
            onClick={fetchSignals}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 text-stone-500 hover:border-stone-300 transition disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-stone-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      category === cat
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-stone-200 text-stone-600 hover:border-orange-300"
                    }`}
                  >
                    {cat || "All"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No location warning */}
      {!latitude && !longitude && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <MapPin size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">
            Enable location access to see distress signals near you.
          </p>
        </div>
      )}

      {/* Signal list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-32" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap size={22} className="text-stone-300" />
          </div>
          <p className="font-semibold text-stone-500 text-sm">No active signals nearby</p>
          <p className="text-xs text-stone-400 mt-1">
            {category ? `No urgent ${category} jobs right now.` : "Check back soon or expand your search area."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {signals.map((signal, index) => {
              const alreadyProposed = proposed.has(signal.id);
              const expiry = timeLeft(signal.expiresAt);
              const isExpiringSoon = new Date(signal.expiresAt).getTime() - Date.now() < 30 * 60 * 1000;

              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`bg-white border rounded-2xl p-4 space-y-3 transition-shadow hover:shadow-md ${
                    alreadyProposed
                      ? "border-emerald-200 bg-emerald-50/30"
                      : "border-stone-100"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-100 text-red-600 rounded-full">
                        🚨 {signal.category}
                      </span>
                      {alreadyProposed && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                          ✓ Proposed
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${
                      isExpiringSoon ? "text-red-500" : "text-stone-400"
                    }`}>
                      <Clock size={11} />
                      {expiry}
                    </div>
                  </div>

                  {/* Title + description */}
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{signal.title}</p>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{signal.description}</p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-4 text-xs text-stone-400">
                    {signal.budget && (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <DollarSign size={11} />
                        ₦{signal.budget.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {signal._count.proposals} proposal{signal._count.proposals !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {signal.radiusKm} km radius
                    </span>
                    <span className="ml-auto">{timeAgo(signal.createdAt)}</span>
                  </div>

                  {/* Employer */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      {signal.employer.profileImage ? (
                        <img
                          src={signal.employer.profileImage}
                          alt={signal.employer.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {signal.employer.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs text-stone-500">{signal.employer.name}</span>
                    </div>

                    <button
                      onClick={() => setSelectedSignal(signal)}
                      disabled={alreadyProposed}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                        alreadyProposed
                          ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                    >
                      <Zap size={11} />
                      {alreadyProposed ? "Sent" : "Propose"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Proposal modal */}
      <ProposalModal
        isOpen={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        signal={selectedSignal}
        onProposed={() => {
          if (selectedSignal) handleProposed(selectedSignal.id);
          setSelectedSignal(null);
        }}
      />
    </div>
  );
}