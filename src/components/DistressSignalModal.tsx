"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import { X, Siren, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const hoverSpring: Transition = { type: "spring", stiffness: 500, damping: 28 };

const SERVICE_CATEGORIES = [
  "Plumber",
  "Electrician",
  "Painter",
  "Mechanic",
  "Cleaner",
  "Carpenter",
  "AC Technician",
  "Welder",
  "Tiler",
  "Generator Repair",
  "Other",
];

const URGENCY_OPTIONS = [
  { value: "LOW",    label: "Low",    color: "#059669", bg: "#ecfdf5", desc: "Within a few hours" },
  { value: "MEDIUM", label: "Medium", color: "#d97706", bg: "#fffbeb", desc: "As soon as possible" },
  { value: "HIGH",   label: "High",   color: "#dc2626", bg: "#fef2f2", desc: "Right now — emergency" },
];

const RADIUS_OPTIONS = [
  { value: 10,  label: "10 km",  desc: "Hyper-local" },
  { value: 25,  label: "25 km",  desc: "Neighbourhood" },
  { value: 50,  label: "50 km",  desc: "City-wide" },
  { value: 100, label: "100 km", desc: "Wide area" },
];

declare global {
  interface Window {
    google: typeof google;
    initDistressAutocomplete?: () => void;
  }
}

type Props = {
  onClose: () => void;
  onSent?: (signalId: string) => void;
};

export default function DistressSignalModal({ onClose, onSent }: Props) {
  const [category, setCategory]       = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency]         = useState("MEDIUM");
  const [budget, setBudget]           = useState("");
  const [address, setAddress]         = useState("");
  const [lat, setLat]                 = useState<number | null>(null);
  const [lng, setLng]                 = useState<number | null>(null);
  const [radiusKm, setRadiusKm]       = useState(25);
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [error, setError]             = useState("");

  const inputRef     = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps script if not already loaded
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;
      autocomplete.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode", "establishment"],
        componentRestrictions: { country: "ng" },
        fields: ["formatted_address", "geometry"],
      });
      autocomplete.current.addListener("place_changed", () => {
        const place = autocomplete.current!.getPlace();
        if (place.formatted_address) setAddress(place.formatted_address);
        if (place.geometry?.location) {
          setLat(place.geometry.location.lat());
          setLng(place.geometry.location.lng());
        }
      });
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      window.initDistressAutocomplete = initAutocomplete;
      if (!document.querySelector("#google-maps-script")) {
        const script = document.createElement("script");
        script.id  = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initDistressAutocomplete`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (autocomplete.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocomplete.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!category)            return setError("Please select a service category.");
    if (!description.trim())  return setError("Please describe the problem.");
    if (!address)             return setError("Please enter your location.");
    if (!lat || !lng)         return setError("Please select a location from the dropdown suggestions.");
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0)
      return setError("Please enter a valid budget.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/distress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCategory: category,
          description: description.trim(),
          urgencyLevel: urgency,
          offeredPrice: Number(budget),
          address,
          latitude: lat,
          longitude: lng,
          radiusKm,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Something went wrong.");
      }
      const signal = await res.json();
      setSubmitted(true);
      onSent?.(signal.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "#fff" }}
        >
          {/* Header */}
          <div
            className="relative px-6 py-5 flex items-center justify-between"
            style={{
              background: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full blur-2xl opacity-30"
              style={{ background: "radial-gradient(circle, #fca5a5, transparent)" }}
            />
            <div className="flex items-center gap-3 relative">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <Siren className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Distress Signal</h2>
                <p className="text-xs text-red-200/80">Alert nearby technicians instantly</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="relative w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "#ecfdf5" }}
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-base font-black text-stone-800">Signal sent!</p>
                  <p className="text-sm text-stone-400 mt-1">
                    Nearby technicians within {radiusKm}km have been alerted. You'll receive proposals shortly.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={hoverSpring}
                  onClick={onClose}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                >
                  Done
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Service category */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Service needed
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="" disabled>Select a category…</option>
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Describe the problem
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Pipe burst in the kitchen, water flooding the floor…"
                    rows={3}
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Urgency */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Urgency
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {URGENCY_OPTIONS.map((opt) => {
                      const active = urgency === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setUrgency(opt.value)}
                          className="flex flex-col items-center gap-1 rounded-xl border-2 py-3 px-2 transition-all text-center"
                          style={{
                            borderColor: active ? opt.color : "#e7e5e4",
                            background: active ? opt.bg : "#fafaf9",
                          }}
                        >
                          <span
                            className="text-xs font-black"
                            style={{ color: active ? opt.color : "#78716c" }}
                          >
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-stone-400 leading-tight">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Your location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setLat(null);
                        setLng(null);
                      }}
                      placeholder="Search for your address or landmark…"
                      className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-3 text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                    />
                    {lat && lng && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                  {lat && lng && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 ml-1">
                      Location pinned — technicians can find you on the map
                    </p>
                  )}
                  {!lat && address.length > 3 && (
                    <p className="text-[10px] text-amber-500 font-semibold mt-1 ml-1">
                      Select an address from the dropdown to pin your location
                    </p>
                  )}
                </div>

                {/* Search radius */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Search radius
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {RADIUS_OPTIONS.map((opt) => {
                      const active = radiusKm === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setRadiusKm(opt.value)}
                          className="flex flex-col items-center gap-0.5 rounded-xl border-2 py-2.5 px-1 transition-all text-center"
                          style={{
                            borderColor: active ? "#dc2626" : "#e7e5e4",
                            background:  active ? "#fef2f2" : "#fafaf9",
                          }}
                        >
                          <span
                            className="text-xs font-black"
                            style={{ color: active ? "#dc2626" : "#78716c" }}
                          >
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-stone-400 leading-tight">
                            {opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Fee warning */}
                  {radiusKm >= 50 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2.5"
                      style={{ background: "#fffbeb" }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-amber-700 leading-snug">
                        A wider radius may attract technicians from farther away, who could charge higher fees to cover travel costs.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Budget */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1.5 block">
                    Offered budget
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="0"
                      min={0}
                      className="w-full rounded-xl border border-stone-200 bg-white pl-8 pr-4 py-3 text-sm font-medium text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-red-500 bg-red-50 rounded-xl px-4 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={hoverSpring}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white transition-opacity disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #b91c1c, #dc2626, #ef4444)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending signal…
                    </>
                  ) : (
                    <>
                      <Siren className="w-4 h-4" />
                      Send Distress Signal
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}