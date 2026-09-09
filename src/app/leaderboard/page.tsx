"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import RatingStars from "@/components/RatingStars";
import { getRankColor } from "@/lib/utils";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Star,
  Briefcase,
  Crown,
} from "lucide-react";
import Link from "next/link";

const mountEase: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

const CATEGORIES = [
  "", "Plumber", "Electrician", "Painter",
  "Mechanic", "Cleaner", "Carpenter", "AC Technician", "Other",
];

const MEDAL: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: "bg-yellow-400",  text: "text-white",      border: "border-yellow-400",  label: "🥇" },
  2: { bg: "bg-stone-300",   text: "text-stone-700",  border: "border-stone-300",   label: "🥈" },
  3: { bg: "bg-orange-400",  text: "text-white",      border: "border-orange-400",  label: "🥉" },
};

function PodiumCard({ tech, pos, height, delay }: { tech: any; pos: number; height: number; delay: number }) {
  const router = useRouter();
  const medal = MEDAL[pos];
  const profile = tech.technicianProfile;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountEase, delay }}
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => router.push(`/technician/${tech.id}`)}
    >
      {pos === 1 && <Crown size={22} className="text-yellow-400" />}
      <div className={`relative border-[3px] rounded-full ${medal.border}`}
        style={{ width: pos === 1 ? 72 : 60, height: pos === 1 ? 72 : 60 }}
      >
        {tech.profileImage ? (
          <img src={tech.profileImage} alt={tech.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold"
            style={{ fontSize: pos === 1 ? 22 : 18 }}>
            {tech.name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="font-bold text-stone-800 text-sm">{tech.name?.split(" ")[0]}</p>
        <p className="text-xs text-stone-500">{profile?.serviceCategory}</p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-semibold text-stone-700">{profile?.averageRating?.toFixed(1)}</span>
        </div>
      </div>
      <div className={`w-20 ${medal.bg} rounded-t-2xl flex items-center justify-center`} style={{ height }}>
        <span className="text-xl">{medal.label}</span>
      </div>
    </motion.div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-20" />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("");

  const fetchLeaderboard = async (p = 1, cat = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?page=${p}&category=${cat}`);
      const data = await res.json();
      setTechnicians(data.technicians || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(page, category); }, [page, category]);

  const globalPos = (index: number) => (page - 1) * 10 + index + 1;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-br from-stone-900 via-stone-900 to-orange-950">
        <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full bg-yellow-400/5 blur-2xl" />
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-200 text-sm transition-colors mb-5">
            <ChevronLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center shrink-0">
              <Trophy size={22} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-0.5">Rankings</p>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Technician Leaderboard</h1>
              <p className="text-stone-400 text-sm mt-0.5">
                Top rated professionals on HandyMan — {total.toLocaleString()} ranked
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Podium */}
        <AnimatePresence>
          {page === 1 && !loading && technicians.length >= 3 && (
            <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 text-center mb-6">Top 3</p>
              <div className="flex items-end justify-center gap-6">
                <PodiumCard tech={technicians[1]} pos={2} height={72}  delay={0.12} />
                <PodiumCard tech={technicians[0]} pos={1} height={96}  delay={0.04} />
                <PodiumCard tech={technicians[2]} pos={3} height={52}  delay={0.20} />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.1 }}
          className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3"
        >
          <SlidersHorizontal size={16} className="text-stone-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="flex-1 text-sm text-stone-700 bg-transparent border-0 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c || "All Categories"}</option>
            ))}
          </select>
        </motion.div>

        {/* List */}
        {loading ? (
          <Skeleton />
        ) : technicians.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-3xl p-16 text-center space-y-3">
            <Trophy size={40} className="mx-auto text-stone-300" strokeWidth={1.5} />
            <p className="text-stone-500 font-medium">No technicians found</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {technicians.map((tech, index) => {
              const pos = globalPos(index);
              const profile = tech.technicianProfile;
              const medal = MEDAL[pos];
              const isTop3 = pos <= 3;

              return (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...mountEase, delay: index * 0.04 }}
                  whileHover={{ y: -2, transition: hoverSpring }}
                  onClick={() => router.push(`/technician/${tech.id}`)}
                  className={`bg-white border rounded-2xl px-4 py-4 flex items-center gap-4 cursor-pointer transition-shadow hover:shadow-md hover:shadow-stone-100 ${
                    isTop3 ? "border-yellow-100" : tech.isTopPerformer ? "border-amber-100" : "border-stone-100"
                  }`}
                >
                  {/* Position badge */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    medal ? `${medal.bg} ${medal.text}` : "bg-stone-100 text-stone-500"
                  }`}>
                    {isTop3 ? medal.label : pos}
                  </div>

                  {/* Avatar */}
                  <div className={`shrink-0 ${tech.isTopPerformer ? "ring-2 ring-amber-400 ring-offset-1 rounded-full" : ""}`}>
                    {tech.profileImage ? (
                      <img
                        src={tech.profileImage}
                        alt={tech.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-stone-100"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
                        {tech.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-stone-800 text-sm">{tech.name}</p>
                      {tech.isTopPerformer && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                          <Trophy size={10} className="text-amber-500" />
                          Top Performer
                        </span>
                      )}
                      {profile?.rank && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRankColor(profile.rank)}`}>
                          {profile.rank}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {profile?.serviceCategory}{profile?.businessName ? ` · ${profile.businessName}` : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <RatingStars rating={profile?.averageRating || 0} size="sm" />
                      <span className="text-xs text-stone-400">{profile?.totalReviews} reviews</span>
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Briefcase size={11} className="text-emerald-500" />
                        {tech.completedJobs} jobs
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-orange-500 text-sm">₦{profile?.basePrice?.toLocaleString()}</p>
                    <p className="text-xs text-stone-400">base price</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 border border-stone-200 bg-white rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
                    page === i + 1
                      ? "bg-orange-500 text-white"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 border border-stone-200 bg-white rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition disabled:opacity-40"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}