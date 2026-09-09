"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { toast } from "react-hot-toast";
import Layout from "@/components/Layout";
import PortfolioGallery from "@/components/PortfolioGallery";
import RatingStars from "@/components/RatingStars";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import JobRequestModal from "@/components/JobRequestModal";
import {
  MapPin,
  Briefcase,
  Star,
  Clock,
  Wrench,
  FileText,
  CalendarDays,
  ImageIcon,
  UserX,
  MessageSquareText,
  BadgeCheck,
} from "lucide-react";

// ─── Motion constants ────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

// ─── Rank styling ────────────────────────────────────────────────────────────
const RANK_STYLES: Record<string, { color: string; emoji: string }> = {
  Bronze:   { color: "text-orange-300", emoji: "🥉" },
  Silver:   { color: "text-stone-300",  emoji: "🥈" },
  Gold:     { color: "text-yellow-300", emoji: "🥇" },
  Platinum: { color: "text-sky-300",    emoji: "💎" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export default function TechnicianPublicProfile() {
  const params  = useParams();
  const router  = useRouter();
  const [user, setUser]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [showHire, setShowHire]     = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/profile/${params.id}`)
      .then((r) => r.json())
      .then((data) => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params?.id]);

  const handleHireSubmit = async (data: {
    technicianId: string;
    description: string;
    offeredPrice: string;
  }) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Job request sent!");
      setTimeout(() => {
        setShowHire(false);
        router.push("/employer/jobs");
      }, 1200);
    } catch {
      toast.error("Failed to send request. Try again.");
    }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Technician Profile">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="h-56 rounded-3xl bg-stone-800/90 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <div className="h-36 rounded-2xl bg-stone-100 animate-pulse" />
              <div className="h-48 rounded-2xl bg-stone-100 animate-pulse" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="h-56 rounded-2xl bg-stone-100 animate-pulse" />
              <div className="h-56 rounded-2xl bg-stone-100 animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!user || user.error) {
    return (
      <Layout title="Technician Profile">
        <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <UserX size={22} className="text-stone-400" />
          </div>
          <p className="text-stone-700 font-semibold text-base mb-1">Technician not found</p>
          <p className="text-stone-400 text-sm mb-5">
            This profile may have been removed, or the link is incorrect.
          </p>
          <motion.button
            onClick={() => router.push("/employer/find")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={hoverSpring}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Search
          </motion.button>
        </div>
      </Layout>
    );
  }

  const profile      = user.technicianProfile;
  const availableDays = (user.availability || []).map((a: any) => a.dayOfWeek);
  const rankStyle    = RANK_STYLES[profile?.rank] ?? RANK_STYLES.Bronze;
  const reviews      = user.reviewsReceived || [];

  return (
    <Layout title="Technician Profile">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 p-6 sm:p-8"
        >
          {/* Ambient blobs */}
          <div className="absolute -top-24 -right-16 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <Wrench className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none" size={200} strokeWidth={1} />

          <div className="relative flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/10 shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-lg">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
                {profile?.rank && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                    <span>{rankStyle.emoji}</span>
                    <span className={rankStyle.color}>{profile.rank}</span>
                  </span>
                )}
              </div>
              <p className="text-white/40 text-sm mb-3">{profile?.businessName}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <RatingStars rating={profile?.averageRating || 0} size="md" />
                <span className="text-white/50 text-sm">
                  {(profile?.averageRating ?? 0).toFixed(1)} ({profile?.totalReviews ?? 0} reviews)
                </span>
              </div>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Briefcase size={12} className="text-orange-300" />
                  {profile?.serviceCategory}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <Clock size={12} className="text-orange-300" />
                  {profile?.yearsOfExperience} yrs experience
                </span>
                {user.address && (
                  <span className="flex items-center gap-1.5 text-xs text-white/70 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                    <MapPin size={12} className="text-orange-300" />
                    {user.address}
                  </span>
                )}
              </div>
            </div>

            {/* Right: base price + hire button stacked */}
            <div className="flex flex-col gap-3 shrink-0">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm text-center">
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-0.5">Base Price</p>
                <p className="text-xl font-black text-white">
                  {profile?.basePrice ? `₦${profile.basePrice.toLocaleString()}` : "—"}
                </p>
              </div>
              <motion.button
                onClick={() => setShowHire(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={hoverSpring}
                className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-3 rounded-2xl transition-colors shadow-lg shadow-orange-500/20"
              >
                <BadgeCheck size={15} />
                Hire Now
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── Body grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-4">
            {/* About */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.06 }}
              className="bg-white rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                  <FileText size={14} className="text-orange-500" />
                </div>
                <h2 className="font-semibold text-stone-800">About</h2>
              </div>
              <p className="text-stone-500 text-sm leading-relaxed">
                {profile?.description || "No description provided."}
              </p>
            </motion.div>

            {/* Availability */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.1 }}
              className="bg-white rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center">
                  <CalendarDays size={14} className="text-sky-500" />
                </div>
                <h2 className="font-semibold text-stone-800">Availability</h2>
              </div>
              <p className="text-stone-400 text-xs mb-3">Days this technician is available for work</p>
              <AvailabilityCalendar availability={availableDays} editable={false} />
            </motion.div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.08 }}
              className="bg-white rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
                  <ImageIcon size={14} className="text-violet-500" />
                </div>
                <h2 className="font-semibold text-stone-800">Portfolio</h2>
                <span className="ml-auto text-xs text-stone-400">
                  {user.portfolioItems?.length ?? 0} item{user.portfolioItems?.length !== 1 ? "s" : ""}
                </span>
              </div>
              <PortfolioGallery items={user.portfolioItems ?? []} />
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.12 }}
              className="bg-white rounded-2xl border border-stone-200 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star size={14} className="text-amber-500" />
                </div>
                <h2 className="font-semibold text-stone-800">
                  Reviews <span className="text-stone-400 font-normal">({reviews.length})</span>
                </h2>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquareText size={18} className="text-stone-400" />
                  </div>
                  <p className="text-stone-400 text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-stone-700">{review.reviewer?.name}</span>
                        <RatingStars rating={review.rating} size="sm" />
                        {review.comment?.startsWith("[AFTER_DISPUTE]") && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                            After Dispute
                          </span>
                        )}
                        <span className="text-stone-400 text-xs ml-auto">{timeAgo(review.createdAt)}</span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-stone-500 ml-9 mt-1">
                          {review.comment.replace("[AFTER_DISPUTE]", "")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Hire modal */}
      {showHire && (
        <JobRequestModal
          technicianId={String(params?.id)}
          technicianName={user.name}
          technicianCategory={profile?.serviceCategory}
          technicianBasePrice={profile?.basePrice}
          onClose={() => setShowHire(false)}
          onSubmit={handleHireSubmit}
        />
      )}
    </Layout>
  );
}