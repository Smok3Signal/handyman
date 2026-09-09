"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import PortfolioGallery from "@/components/PortfolioGallery";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import RatingStars from "@/components/RatingStars";
import { getRankColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Camera,
  Edit2,
  Save,
  X,
  Star,
  Briefcase,
  Award,
  Phone,
  MapPin,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";

// ── Transitions ───────────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

// ── Field row (view/edit) ────────────────────────────────────────────────────
function Field({
  label,
  value,
  field,
  editing,
  form,
  setForm,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  field: string;
  editing: boolean;
  form: any;
  setForm: any;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
        {Icon && <Icon size={11} />} {label}
      </label>
      {editing ? (
        <input
          value={form[field] ?? ""}
          placeholder={placeholder}
          onChange={(e) => setForm((p: any) => ({ ...p, [field]: e.target.value }))}
          className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      ) : (
        <p className="text-sm text-stone-700">{value || <span className="text-stone-300">Not set</span>}</p>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse bg-stone-800 rounded-3xl h-52" />
      <div className="animate-pulse bg-stone-100 rounded-3xl h-40" />
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-24" />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<number[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [form, setForm] = useState<any>({});

  const isTechnician = (session?.user as any)?.role === "TECHNICIAN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchProfile();
  }, [status]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
      setIsAvailable(data.isAvailable ?? true);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        profileImage: data.profileImage || "",
        businessName: data.technicianProfile?.businessName || "",
        serviceCategory: data.technicianProfile?.serviceCategory || "",
        yearsOfExperience: data.technicianProfile?.yearsOfExperience || "",
        basePrice: data.technicianProfile?.basePrice || "",
        description: data.technicianProfile?.description || "",
      });
      if (data.id) {
        const avRes = await fetch(`/api/availability?userId=${data.id}`);
        const avData = await avRes.json();
        setAvailability(Array.isArray(avData) ? avData : []);
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const toastId = toast.loading("Uploading photo…");
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");

    const data = await res.json();
    const url = data.url ?? data.imageUrl ?? data.secure_url;

    if (!url) throw new Error("No URL returned");

    setForm((p: any) => ({ ...p, profileImage: url }));
    toast.success("Photo ready — save to apply", { id: toastId });
  } catch {
    toast.error("Failed to upload photo", { id: toastId });
  }
};

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Profile updated");
        setEditing(false);
        fetchProfile();
      } else {
        toast.error("Failed to update profile");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDayAvailability = async (day: number) => {
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek: day }),
    });
    const data = await res.json();
    setAvailability(Array.isArray(data) ? data : []);
  };

  const handleToggleAvailability = async () => {
    setTogglingAvailability(true);
    try {
      const res = await fetch("/api/availability/toggle", { method: "POST" });
      const data = await res.json();
      setIsAvailable(data.isAvailable);
      toast.success(data.isAvailable ? "You're now visible to employers" : "Hidden from search");
    } catch {
      toast.error("Failed to update availability");
    } finally {
      setTogglingAvailability(false);
    }
  };

  if (loading) return <Layout title="My Profile"><div className="max-w-3xl mx-auto px-4 py-6"><Skeleton /></div></Layout>;
  if (!profile) return <Layout title="My Profile"><div className="flex justify-center py-24 text-stone-400">Failed to load profile</div></Layout>;

  const avatar = form.profileImage || profile.profileImage;
  const techProfile = profile.technicianProfile;

  return (
    <Layout title="My Profile">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ── Hero card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 p-6 text-white"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                {avatar ? (
                  <img src={avatar} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-2xl font-bold text-white">
                    {profile.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {editing && (
                  <label className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition border-2 border-stone-900">
                    <Camera size={11} className="text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Name + role */}
              <div>
                {editing ? (
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
                    className="text-lg font-bold bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-400 w-full"
                  />
                ) : (
                  <h2 className="text-xl font-bold">{profile.name}</h2>
                )}
                <p className="text-stone-400 text-sm mt-0.5">{profile.email}</p>
                {isTechnician && techProfile && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-stone-300">{techProfile.serviceCategory}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getRankColor(techProfile.rank || "Bronze")}`}>
                      {techProfile.rank || "Bronze"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Edit/Save buttons */}
            <div className="flex gap-2 shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 text-xs border border-white/20 text-white/80 px-3 py-1.5 rounded-xl hover:bg-white/10 transition"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {saving ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={13} />}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs border border-white/20 text-white/80 px-3 py-1.5 rounded-xl hover:bg-white/10 transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>
          </div>

          {/* Availability toggle — technicians only, inside hero */}
          {isTechnician && (
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">
                  {isAvailable ? "Online — visible to employers" : "Offline — hidden from search"}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {isAvailable ? "Employers can find and contact you" : "You won't appear in any searches"}
                </p>
              </div>
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvailability}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60 ${
                  isAvailable ? "bg-emerald-500" : "bg-stone-600"
                }`}
              >
                <motion.div
                  animate={{ x: isAvailable ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                >
                  {togglingAvailability
                    ? <div className="w-2.5 h-2.5 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                    : isAvailable
                      ? <Wifi size={9} className="text-emerald-500" />
                      : <WifiOff size={9} className="text-stone-400" />
                  }
                </motion.div>
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Contact info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.08 }}
          className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm"
        >
          <h3 className="font-bold text-stone-800 mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Phone" value={profile.phone} field="phone" editing={editing} form={form} setForm={setForm} icon={Phone} />
            <Field
              label={isTechnician ? "Office Address" : "Address"}
              value={profile.address}
              field="address"
              editing={editing}
              form={form}
              setForm={setForm}
              placeholder="e.g. 14 Adeola Odeku, Victoria Island, Lagos"
              icon={MapPin}
            />
          </div>
        </motion.div>

        {/* ── Technician sections ── */}
        {isTechnician && (
          <>
            {/* Stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.12 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { label: "Avg Rating",    value: techProfile?.averageRating?.toFixed(1) ?? "0.0", icon: Star,     color: "bg-amber-50 text-amber-500"   },
                { label: "Total Reviews", value: techProfile?.totalReviews ?? 0,                   icon: Briefcase,color: "bg-sky-50 text-sky-500"       },
                { label: "Rank",          value: techProfile?.rank ?? "Bronze",                    icon: Award,    color: "bg-orange-50 text-orange-500" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...mountEase, delay: 0.14 + i * 0.05 }}
                    className="bg-white border border-stone-100 rounded-2xl p-4 text-center shadow-sm"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                      <Icon size={15} />
                    </div>
                    <p className="text-xl font-bold text-stone-800">{stat.value}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Business info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.18 }}
              className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm"
            >
              <h3 className="font-bold text-stone-800 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Business Name",       field: "businessName",       value: techProfile?.businessName       },
                  { label: "Service Category",    field: "serviceCategory",    value: techProfile?.serviceCategory    },
                  { label: "Years of Experience", field: "yearsOfExperience",  value: techProfile?.yearsOfExperience  },
                  { label: "Base Price (₦)",      field: "basePrice",          value: techProfile?.basePrice ? `₦${Number(techProfile.basePrice).toLocaleString()}` : undefined },
                ].map(({ label, field, value }) => (
                  <Field key={field} label={label} value={value} field={field} editing={editing} form={form} setForm={setForm} />
                ))}

                {/* Description — full width */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Description</label>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={form.description ?? ""}
                      onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                    />
                  ) : (
                    <p className="text-sm text-stone-700">{techProfile?.description || <span className="text-stone-300">Not set</span>}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Working Days */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.22 }}
              className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm"
            >
              <h3 className="font-bold text-stone-800 mb-1">Working Days</h3>
              <p className="text-sm text-stone-400 mb-4">Toggle the days you're available for work</p>
              <AvailabilityCalendar
                availability={availability}
                editable
                onToggle={handleToggleDayAvailability}
              />
            </motion.div>

            {/* Portfolio preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.26 }}
              className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-stone-800">Portfolio</h3>
                <a
                  href="/technician/portfolio"
                  className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Manage <ChevronRight size={14} />
                </a>
              </div>
              <PortfolioGallery items={profile.portfolioItems || []} />
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...mountEase, delay: 0.3 }}
              className="bg-white border border-stone-100 rounded-3xl p-5 shadow-sm"
            >
              <h3 className="font-bold text-stone-800 mb-4">
                Reviews <span className="text-stone-400 font-normal">({profile.reviewsReceived?.length || 0})</span>
              </h3>
              {!profile.reviewsReceived || profile.reviewsReceived.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <Star size={28} className="mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.reviewsReceived.map((review: any) => (
                    <div key={review.id} className="flex gap-3 pb-4 border-b border-stone-50 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {review.reviewer?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-stone-700">{review.reviewer?.name}</span>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-stone-500 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </Layout>
  );
}