"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import toast from "react-hot-toast";
import Layout from "@/components/Layout";
import JobRequestModal from "@/components/JobRequestModal";
import LocationPickerMap from "@/components/LocationPickerMap";
import { usePlacesAutocomplete } from "@/hooks/usePlacesAutocomplete";
import {
  Search, MapPin, Star, SlidersHorizontal, X, Loader2,
  AlertTriangle, Navigation, Briefcase, Clock, ShieldCheck,
  Zap, MessageCircle, Map as MapIcon,
} from "lucide-react";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const mountEase: Transition = { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] };
const LOCATION_FALLBACK_MS = 60_000;

type Technician = {
  id: string;
  name: string;
  phone?: string;
  profileImage?: string;
  distance?: number;
  technicianProfile?: {
    businessName?: string;
    serviceCategory: string;
    yearsOfExperience: number;
    basePrice: number;
    averageRating: number;
    totalReviews: number;
    rank: string;
    description?: string;
  };
  hasActiveNotice?: boolean;
};

const CATEGORIES = [
  "All", "Plumber", "Electrician", "Painter", "Mechanic",
  "Cleaner", "Carpenter", "AC Technician", "Other",
];

const RANK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Bronze:   { bg: "#fef3e2", text: "#92400e", dot: "#cd7f32" },
  Silver:   { bg: "#f1f5f9", text: "#475569", dot: "#94a3b8" },
  Gold:     { bg: "#fefce8", text: "#854d0e", dot: "#eab308" },
  Platinum: { bg: "#f0fdf4", text: "#065f46", dot: "#10b981" },
};

const DEFAULT_LAT = 6.5244;
const DEFAULT_LNG = 3.3792;
const DEFAULT_LABEL = "Lagos, Nigeria";

function RankBadge({ rank }: { rank: string }) {
  const c = RANK_COLORS[rank] ?? RANK_COLORS.Bronze;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {rank}
    </span>
  );
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className="w-3 h-3"
            fill={s <= Math.round(rating) ? "#fbbf24" : "none"}
            stroke={s <= Math.round(rating) ? "#fbbf24" : "#d1d5db"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-stone-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-stone-400">({count})</span>
    </div>
  );
}

function TechCard({
  tech, index, onHire,
}: {
  tech: Technician; index: number; onHire: (id: string) => void;
}) {
  const profile = tech.technicianProfile;
  const rank = profile?.rank ?? "Bronze";
  const whatsappPhone = tech.phone?.replace(/\D/g, "");
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountEase, delay: index * 0.05 }}
    >
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        transition={spring}
        className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-[0_4px_20px_rgba(249,115,22,0.1)] transition-colors"
      >
        <Link href={`/technician/${tech.id}`} className="block p-5">
          <div className="flex items-start gap-4">

            {/* Avatar */}
            {tech.profileImage ? (
              <img
                src={tech.profileImage}
                alt={tech.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-stone-100"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #fb923c, #ea580c)" }}
              >
                {tech.name[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-stone-800 text-sm">{tech.name}</p>
                <RankBadge rank={rank} />
                {tech.hasActiveNotice && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 bg-red-50 text-red-600">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Notice
                  </span>
                )}
              </div>
              {profile?.businessName && (
                <p className="text-xs text-stone-400 mt-0.5 truncate">{profile.businessName}</p>
              )}
              <div className="mt-1.5">
                <StarRow rating={profile?.averageRating ?? 0} count={profile?.totalReviews ?? 0} />
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-base font-black text-stone-800">
                ₦{(profile?.basePrice ?? 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-stone-400 font-medium">base price</p>
            </div>
          </div>

          <div className="my-4 h-px bg-stone-100" />

          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-orange-400" />
              {profile?.serviceCategory ?? "—"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              {profile?.yearsOfExperience ?? 0}yr exp
            </span>
            {tech.distance !== undefined && (
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-orange-400" />
                {tech.distance.toFixed(1)} km away
              </span>
            )}
          </div>

          {profile?.description && (
            <p className="mt-3 text-xs text-stone-400 line-clamp-2 leading-relaxed">
              {profile.description}
            </p>
          )}
        </Link>

        <div className="px-5 pb-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <Link
              href={`/technician/${tech.id}`}
              className="flex-1 text-center text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl py-2.5 transition-colors"
            >
              View Profile
            </Link>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={spring}
              onClick={(e) => { e.preventDefault(); onHire(tech.id); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl py-2.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Hire
            </motion.button>
          </div>

          {whatsappUrl ? (
            <a href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-colors border"
              style={{ backgroundColor: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#dcfce7"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#f0fdf4"; }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat on WhatsApp
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold border border-stone-200 text-stone-300 cursor-not-allowed"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp unavailable
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function FilterPanel({
  category, setCategory,
  minRating, setMinRating,
  maxPrice, setMaxPrice,
  minExp, setMinExp,
  radius, setRadius,
  onApply, onReset,
}: {
  category: string; setCategory: (v: string) => void;
  minRating: number; setMinRating: (v: number) => void;
  maxPrice: number; setMaxPrice: (v: number) => void;
  minExp: number; setMinExp: (v: number) => void;
  radius: number; setRadius: (v: number) => void;
  onApply: () => void; onReset: () => void;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-800">Filters</h3>
        <button onClick={onReset} className="text-xs text-stone-400 hover:text-orange-500 transition-colors font-medium">
          Reset
        </button>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">Category</label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat} whileTap={{ scale: 0.95 }} transition={spring}
              onClick={() => setCategory(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                category === cat ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
          Min rating: <span className="text-orange-500">{minRating === 0 ? "Any" : `${minRating}★`}</span>
        </label>
        <input type="range" min={0} max={5} step={0.5} value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full accent-orange-500 h-1.5 rounded-full" />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>Any</span><span>5★</span></div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
          Max price: <span className="text-orange-500">₦{maxPrice.toLocaleString()}</span>
        </label>
        <input type="range" min={0} max={100000} step={1000} value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-orange-500 h-1.5 rounded-full" />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>₦0</span><span>₦100k</span></div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
          Min experience: <span className="text-orange-500">{minExp === 0 ? "Any" : `${minExp}yr`}</span>
        </label>
        <input type="range" min={0} max={20} step={1} value={minExp}
          onChange={(e) => setMinExp(Number(e.target.value))}
          className="w-full accent-orange-500 h-1.5 rounded-full" />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>Any</span><span>20yr</span></div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-2">
          Radius: <span className="text-orange-500">{radius} km</span>
        </label>
        <input type="range" min={1} max={200} step={1} value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-orange-500 h-1.5 rounded-full" />
        <div className="flex justify-between text-[10px] text-stone-400 mt-1"><span>1 km</span><span>200 km</span></div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
        onClick={onApply}
        className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
      >
        Apply filters
      </motion.button>
    </div>
  );
}

// FIX: added Link import (was missing from the find page imports in the original)
import Link from "next/link";

export default function FindTechnicianPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lat, setLat] = useState(DEFAULT_LAT);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [locationLabel, setLocationLabel] = useState(DEFAULT_LABEL);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const detectedLatRef = useRef<number | null>(null);
  const detectedLngRef = useRef<number | null>(null);
  // FIX: uncontrolled ref for Google Places Autocomplete — controlled inputs
  // were blocking the autocomplete dropdown from writing to the visible field.
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [showNewLocationChip, setShowNewLocationChip] = useState(false);
  const [jobQuery, setJobQuery] = useState("");
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hireModalTechId, setHireModalTechId] = useState<string | null>(null);
  const hireTech = techs.find((t) => t.id === hireModalTechId);

  const [category, setCategory] = useState("All");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [minExp, setMinExp] = useState(0);
  const [radius, setRadius] = useState(100);
  const [showFilters, setShowFilters] = useState(false);

  const locationResolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleHireSubmit = async (data: {
    technicianId: string;
    description: string;
    offeredPrice: string;
  }) => {
    try {
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch { /* swallow */ }
    setTimeout(() => {
      setHireModalTechId(null);
      router.push("/employer/jobs");
    }, 1200);
  };

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await res.json();
      const addr = data.address;
      const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? "Your location";
      return `${city}, ${addr.country ?? ""}`.trim().replace(/,$/, "");
    } catch {
      return "Current location";
    }
  }, []);

  // Mirrors the dashboard's persistLocation fix: returns real success/failure
  // instead of swallowing errors, so the Save button can reflect what
  // actually happened rather than always toasting success.
  const persistLocation = useCallback(async (latitude: number, longitude: number): Promise<boolean> => {
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("persistLocation failed:", res.status, body);
        return false;
      }
      return true;
    } catch (err) {
      console.error("persistLocation network error:", err);
      return false;
    }
  }, []);

  const handleMapPick = useCallback((pickedLat: number, pickedLng: number, label: string) => {
    setLat(pickedLat);
    setLng(pickedLng);
    setLocationLabel(label);
    if (locationInputRef.current) locationInputRef.current.value = label;
    locationResolvedRef.current = true;
    clearFallbackTimer();
    setShowMapPicker(false);
  }, [clearFallbackTimer]);

  const handleSaveLocation = useCallback(async () => {
    setSaving(true);
    const ok = await persistLocation(lat, lng);
    setSaving(false);
    if (ok) {
      toast.success("Saved — we'll use this location on your dashboard too");
    } else {
      toast.error("Couldn't save your location — please try again");
    }
  }, [lat, lng, persistLocation]);

  // FIX: added explicit geolocation error toasts — previously a silent no-op
  // made auto-detect look completely broken with no explanation.
  const detectLocation = useCallback((silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error("Geolocation is not supported by your browser");
      return;
    }
    if (!silent) setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        detectedLatRef.current = latitude;
        detectedLngRef.current = longitude;
        setShowNewLocationChip(false);
        locationResolvedRef.current = true;
        clearFallbackTimer();
        const label = await reverseGeocode(latitude, longitude);
        setLocationLabel(label);
        // FIX: sync the uncontrolled input's visible text
        if (locationInputRef.current) locationInputRef.current.value = label;
        if (!silent) setDetectingLocation(false);
      },
      (err) => {
        console.warn("Geolocation error:", err.code, err.message);
        if (!silent) {
          setDetectingLocation(false);
          if (err.code === 1) {
            toast.error("Location permission denied — please allow location access in your browser settings");
          } else if (err.code === 2) {
            toast.error("Location unavailable — your device could not determine your position");
          } else {
            toast.error("Location request timed out — please try again");
          }
        }
      },
      { timeout: 6000 }
    );
  }, [reverseGeocode, clearFallbackTimer]);

  // FIX: autocomplete onSelect updates lat/lng state AND locationLabel (used
  // for the "different location" chip). Places widget already wrote the label
  // into the DOM node, so no manual .value sync needed here.
  usePlacesAutocomplete(locationInputRef, ({ lat: placeLat, lng: placeLng, label }) => {
    setLat(placeLat);
    setLng(placeLng);
    setLocationLabel(label);
    locationResolvedRef.current = true;
    clearFallbackTimer();
  });

  // Load saved profile location so this page starts from wherever the
  // employer last saved on their dashboard. They can still override here.
  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/profile")
      .then((r) => r.json())
      .then(async (profileData) => {
        const savedLat = profileData?.latitude;
        const savedLng = profileData?.longitude;
        if (typeof savedLat === "number" && typeof savedLng === "number") {
          setLat(savedLat);
          setLng(savedLng);
          detectedLatRef.current = savedLat;
          detectedLngRef.current = savedLng;
          locationResolvedRef.current = true;
          const label = await reverseGeocode(savedLat, savedLng);
          setLocationLabel(label);
          // FIX: sync the uncontrolled input's visible text with saved location
          if (locationInputRef.current) locationInputRef.current.value = label;
          return;
        }
        // No saved location — Lagos default stays, start 1-min fallback timer
        fallbackTimerRef.current = setTimeout(() => {
          if (!locationResolvedRef.current) detectLocation(true);
        }, LOCATION_FALLBACK_MS);
      })
      .catch(() => {
        fallbackTimerRef.current = setTimeout(() => {
          if (!locationResolvedRef.current) detectLocation(true);
        }, LOCATION_FALLBACK_MS);
      });

    return () => clearFallbackTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const search = useCallback(async () => {
    if (
      detectedLatRef.current !== null &&
      detectedLngRef.current !== null &&
      (Math.abs(lat - detectedLatRef.current) > 0.001 ||
        Math.abs(lng - detectedLngRef.current) > 0.001)
    ) {
      setShowNewLocationChip(true);
    } else {
      setShowNewLocationChip(false);
    }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
      });
      if (category !== "All") params.set("category", category);
      if (minRating > 0) params.set("minRating", String(minRating));
      if (maxPrice < 100000) params.set("maxPrice", String(maxPrice));
      if (minExp > 0) params.set("minExperience", String(minExp));
      const res = await fetch(`/api/technicians?${params}`);
      const data = await res.json();
      setTechs(Array.isArray(data) ? data : []);
    } catch {
      setTechs([]);
    }
    setLoading(false);
  }, [lat, lng, radius, category, minRating, maxPrice, minExp]);

  const filteredTechs = jobQuery.trim()
    ? techs.filter((t) => {
        const q = jobQuery.toLowerCase();
        const p = t.technicianProfile;
        return (
          t.name.toLowerCase().includes(q) ||
          p?.serviceCategory?.toLowerCase().includes(q) ||
          p?.businessName?.toLowerCase().includes(q) ||
          p?.description?.toLowerCase().includes(q)
        );
      })
    : techs;

  const resetFilters = () => {
    setCategory("All");
    setMinRating(0);
    setMaxPrice(100000);
    setMinExp(0);
    setRadius(100);
  };

  const activeFilterCount = [
    category !== "All",
    minRating > 0,
    maxPrice < 100000,
    minExp > 0,
    radius !== 100,
  ].filter(Boolean).length;

  if (status === "loading") {
    return (
      <Layout title="Find Technician">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Find Technician">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={mountEase}>
          <h1 className="text-2xl font-black text-stone-800 tracking-tight">Find a Technician</h1>
          <p className="text-sm text-stone-400 mt-1">
            Search by job type or location, then filter by skill, rating, or price
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.05 }}
          className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-full focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                placeholder="What do you need? e.g. fix leaking pipe, paint walls…"
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="flex-1 bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none min-w-0"
              />
              {jobQuery && (
                <button onClick={() => setJobQuery("")} className="text-stone-300 hover:text-stone-500 transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/*
              Location pill cluster — mirrors the dashboard hero's pill pattern:
              one merged pill (pin icon + input + Save), one separate pill (Detect).
              Location input is uncontrolled — no value/onChange. Initial text is
              set via useEffect (locationInputRef.current.value) after the saved
              profile location loads. Google Places Autocomplete then writes to
              the DOM node directly. locationLabel state stays in sync via the
              onSelect callback and detectLocation, used for the "different
              location" chip comparison and to gate the Save button.
            */}
            <div className="flex items-center gap-2 sm:w-auto shrink-0">
              <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-56 pl-3.5 pr-1.5 py-1.5 bg-stone-50 border border-stone-200 rounded-full focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                <input
                  ref={locationInputRef}
                  type="text"
                  defaultValue={DEFAULT_LABEL}
                  placeholder="Enter your address"
                  className="flex-1 bg-transparent text-sm text-stone-600 font-medium placeholder:text-stone-400 outline-none min-w-0 truncate"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={spring}
                  onClick={handleSaveLocation}
                  disabled={saving}
                  className="flex items-center justify-center px-3 h-7 rounded-full shrink-0 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={spring}
                onClick={() => detectLocation(false)}
                disabled={detectingLocation}
                className="flex items-center gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors shrink-0"
              >
                <span className="text-xs font-bold text-stone-600 whitespace-nowrap hidden sm:inline">
                  {detectingLocation ? "Detecting…" : "Detect"}
                </span>
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 shrink-0">
                  {detectingLocation
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                    : <Navigation className="w-3.5 h-3.5 text-orange-500" />}
                </span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={spring}
                onClick={() => setShowMapPicker(true)}
                className="flex items-center justify-center w-9 h-9 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors shrink-0"
                title="Pick on map"
              >
                <MapIcon className="w-3.5 h-3.5 text-stone-500" />
              </motion.button>
            </div>
          </div>

          <AnimatePresence>
            {showNewLocationChip && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-xs font-semibold text-blue-700 flex-1">
                    Searching from a different location than your current position
                  </span>
                  <button
                    onClick={() => {
                      if (detectedLatRef.current && detectedLngRef.current) {
                        setLat(detectedLatRef.current);
                        setLng(detectedLngRef.current);
                        setShowNewLocationChip(false);
                      }
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                  >
                    Use my location
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
              onClick={() => setShowFilters((v) => !v)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                showFilters
                  ? "bg-stone-800 text-white border-stone-800"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
              onClick={search}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </motion.button>
          </div>
        </motion.div>

        {/* Body */}
        <div className="flex gap-6 items-start">
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                  onClick={() => setShowFilters(false)}
                />
                <motion.div
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
                  className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto lg:hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-stone-800">Filters</h3>
                    <button onClick={() => setShowFilters(false)}>
                      <X className="w-5 h-5 text-stone-400" />
                    </button>
                  </div>
                  <FilterPanel
                    category={category} setCategory={setCategory}
                    minRating={minRating} setMinRating={setMinRating}
                    maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                    minExp={minExp} setMinExp={setMinExp}
                    radius={radius} setRadius={setRadius}
                    onApply={() => { setShowFilters(false); search(); }}
                    onReset={resetFilters}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                  transition={mountEase}
                  className="hidden lg:block w-64 shrink-0"
                >
                  <FilterPanel
                    category={category} setCategory={setCategory}
                    minRating={minRating} setMinRating={setMinRating}
                    maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                    minExp={minExp} setMinExp={setMinExp}
                    radius={radius} setRadius={setRadius}
                    onApply={() => { setShowFilters(false); search(); }}
                    onReset={resetFilters}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            {!searched && !loading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-stone-700">What do you need help with?</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Type a job above or hit Search to find nearby technicians
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={search}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
                >
                  Show all nearby
                </motion.button>
              </motion.div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin" />
                <p className="text-sm text-stone-400 font-medium">Finding technicians…</p>
              </div>
            )}

            {searched && !loading && filteredTechs.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={mountEase}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-stone-300" />
                </div>
                <div>
                  <p className="font-bold text-stone-700">No technicians found</p>
                  <p className="text-sm text-stone-400 mt-1">
                    {jobQuery && techs.length > 0
                      ? `No results for "${jobQuery}" — try a different search term`
                      : "Try increasing the radius or loosening your filters"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={() => { setJobQuery(""); resetFilters(); search(); }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-bold transition-colors"
                >
                  Clear all and retry
                </motion.button>
              </motion.div>
            )}

            {searched && !loading && filteredTechs.length > 0 && (
              <div>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                  className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4"
                >
                  {filteredTechs.length} technician{filteredTechs.length > 1 ? "s" : ""} found
                  {jobQuery ? ` · "${jobQuery}"` : ""}
                  {category !== "All" ? ` · ${category}` : ""}
                  {` · within ${radius} km`}
                </motion.p>
                <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
                  {filteredTechs.map((tech, i) => (
                    <TechCard key={tech.id} tech={tech} index={i} onHire={setHireModalTechId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {hireModalTechId && hireTech && (
        <JobRequestModal
          technicianId={hireModalTechId}
          technicianName={hireTech.name}
          onClose={() => setHireModalTechId(null)}
          onSubmit={handleHireSubmit}
        />
      )}

      {showMapPicker && (
        <LocationPickerMap
          lat={lat}
          lng={lng}
          onConfirm={(pickedLat, pickedLng, label) => {
            setLat(pickedLat);
            setLng(pickedLng);
            setLocationLabel(label);
            locationResolvedRef.current = true;
            clearFallbackTimer();
            if (locationInputRef.current) locationInputRef.current.value = label;
            setShowMapPicker(false);
          }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/*
        Google Places Autocomplete renders its dropdown (.pac-container) as a
        direct child of <body>, completely outside this component's DOM tree,
        so it can't be styled with scoped/CSS-module classes — only a global
        stylesheet reaches it. This restyles the default cramped, oddly-placed
        dropdown to match the app's pill-shaped, rounded design language.
      */}
      <style jsx global>{`
        .pac-container {
          margin-top: 8px;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(28, 25, 23, 0.12), 0 2px 8px rgba(28, 25, 23, 0.06);
          padding: 6px 6px 8px;
          font-family: inherit;
          z-index: 70;
        }
          .pac-container {
          min-width: 320px !important;
          max-width: 90vw;
        }
        .pac-item {
          border: none;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.4;
          color: #57534e;
          cursor: pointer;
        }
        .pac-item:hover,
        .pac-item-selected {
          background-color: #fff7ed;
        }
        .pac-icon {
          margin-top: 2px;
          margin-right: 10px;
          opacity: 0.55;
        }
        .pac-item-query {
          font-size: 13px;
          font-weight: 700;
          color: #1c1917;
          padding-right: 4px;
        }
        .pac-matched {
          font-weight: 700;
          color: #ea580c;
        }
      `}</style>
    </Layout>
  );
}