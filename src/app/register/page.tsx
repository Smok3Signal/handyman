"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Loader2,
  Wrench, Briefcase, Navigation, CheckCircle2,
} from "lucide-react";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };
const bouncySpring: Transition = { type: "spring", stiffness: 700, damping: 20 };

const CATEGORIES = [
  "Plumber", "Electrician", "Painter", "Mechanic",
  "Cleaner", "Carpenter", "AC Technician", "Other",
];

function GlassInput({
  label, type, value, onChange, placeholder, suffix, textarea, error,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; suffix?: React.ReactNode; textarea?: boolean; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  const sharedProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    placeholder,
    className: "flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-white/25 outline-none resize-none",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-orange-300/70">{label}</label>
      <motion.div animate={focused ? { scale: 1.012 } : { scale: 1 }} transition={spring}>
        <div
          className={`relative flex items-center rounded-2xl border transition-all duration-200 overflow-hidden ${
            hasError
              ? "border-red-500/40 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
              : focused
              ? "border-orange-400/60 shadow-[0_0_0_3px_rgba(249,115,22,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]"
              : "border-white/10"
          }`}
          style={{ background: hasError ? "rgba(239,68,68,0.06)" : focused ? "rgba(249,115,22,0.07)" : "rgba(255,255,255,0.04)" }}
        >
          {textarea ? <textarea rows={3} {...sharedProps} /> : <input type={type ?? "text"} {...sharedProps} />}
          {suffix && <div className="pr-3">{suffix}</div>}
        </div>
      </motion.div>
      {hasError && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={bouncySpring}
          className="text-[11px] text-red-400 font-medium pl-1">
          {error}
        </motion.p>
      )}
    </div>
  );
}

function SpringButton({
  children, onClick, loading, variant = "primary",
}: {
  children: React.ReactNode; onClick?: () => void; loading?: boolean; variant?: "primary" | "ghost";
}) {
  const [pressed, setPressed] = useState(false);

  if (variant === "ghost") {
    return (
      <motion.button type="button" onClick={onClick}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
        animate={pressed ? { scale: 0.95 } : { scale: 1 }} whileHover={{ scale: 1.03 }} transition={bouncySpring}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors border border-white/10 hover:border-white/20">
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button type="button" onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      animate={pressed ? { scale: 0.95 } : { scale: 1 }} whileHover={{ scale: 1.03 }} transition={bouncySpring}
      className="relative flex-1 overflow-hidden rounded-2xl py-4 font-bold text-white text-sm tracking-wide shadow-[0_4px_24px_rgba(249,115,22,0.4)] disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #fb923c 0%, #f97316 40%, #ea580c 100%)" }}
      disabled={loading}>
      <span className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 60%)" }} />
      <span className="relative flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </span>
    </motion.button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<"EMPLOYER" | "TECHNICIAN">("EMPLOYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [experience, setExperience] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [bio, setBio] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const detectLocation = () => {
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocationConfirmed(true);
        setDetectingLocation(false);
      },
      () => {
        setLat("6.524379"); setLng("3.379206");
        setLocationConfirmed(true); setDetectingLocation(false);
      },
      { timeout: 5000 }
    );
  };

  const validateStep = () => {
    if (step === 0) {
      if (!name.trim() || !email.trim() || password.length < 6) {
        setError("Please fill in all fields. Password must be at least 6 characters.");
        return false;
      }
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        setError("");
        return false;
      }
      setConfirmPasswordError("");
    }
    if (step === 1 && role === "TECHNICIAN") {
      if (!phone.trim() || !businessName.trim() || !category || !basePrice) {
        setError("Please fill in all required fields.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = {
      name, email, password, phone, role, address,
      latitude: parseFloat(lat) || 6.524379,
      longitude: parseFloat(lng) || 3.379206,
    };
    if (role === "TECHNICIAN") {
      body.businessName = businessName;
      body.serviceCategory = category;
      body.yearsOfExperience = parseInt(experience) || 0;
      body.basePrice = parseFloat(basePrice) || 0;
      body.description = bio;
    }
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Registration failed."); }
    else { router.push("/login"); }
  };

  const steps = ["Account", "Details", "Location"];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: "#0c0a09" }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 -right-20 w-150 h-150 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #fb923c 0%, #f97316 40%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-125 h-125 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #ea580c 0%, #f97316 50%, transparent 70%)" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute -inset-px rounded-3xl"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(249,115,22,0.15) 100%)" }} />

        <div className="relative rounded-3xl p-8 flex flex-col gap-6"
          style={{
            background: "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
            backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.12, rotate: -5 }} transition={bouncySpring}
              className="w-10 h-10 rounded-xl flex items-center justify-center">
              <img src="/icon.png" alt="HandyMan" className="w-full h-full object-contain" />
            </motion.div>
            <div>
              <h1 className="text-lg font-black tracking-tight"
                style={{ background: "linear-gradient(135deg, #fff 0%, #fed7aa 60%, #f97316 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                HandyMan
              </h1>
              <p className="text-[10px] text-white/30 -mt-0.5">Create your account</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    animate={i < step ? { backgroundColor: "#22c55e", scale: 1.1 } : i === step ? { backgroundColor: "#f97316", scale: 1.15 } : { backgroundColor: "rgba(255,255,255,0.1)", scale: 1 }}
                    transition={bouncySpring}
                    className="w-6 h-6 rounded-full flex items-center justify-center">
                    {i < step ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <span className="text-[10px] font-bold text-white">{i + 1}</span>}
                  </motion.div>
                  <span className={`text-[10px] font-semibold hidden sm:block ${i === step ? "text-orange-300" : "text-white/30"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-px" style={{ background: i < step ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="flex flex-col gap-4">

              {step === 0 && (
                <>
                  {/* Role toggle */}
                  <div className="flex rounded-2xl p-1 gap-1" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {(["EMPLOYER", "TECHNICIAN"] as const).map((r) => (
                      <motion.button key={r} type="button" onClick={() => setRole(r)}
                        animate={role === r
                          ? { background: "linear-gradient(135deg,#fb923c,#f97316,#ea580c)", color: "#fff" }
                          : { background: "transparent", color: "rgba(255,255,255,0.4)" }}
                        whileTap={{ scale: 0.96 }} transition={bouncySpring}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors">
                        {r === "EMPLOYER" ? <Briefcase className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                        {r === "EMPLOYER" ? "I need help" : "I work"}
                      </motion.button>
                    ))}
                  </div>

                  <GlassInput label="Full name" value={name} onChange={setName} placeholder="Adaeze Okonkwo" />
                  <GlassInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                  <GlassInput
                    label="Password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword}
                    placeholder="At least 6 characters"
                    suffix={
                      <motion.button type="button" onClick={() => setShowPassword(!showPassword)}
                        whileTap={{ scale: 0.85 }} transition={bouncySpring}
                        className="text-white/30 hover:text-orange-400 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    }
                  />
                  <GlassInput
                    label="Confirm password" type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(v) => { setConfirmPassword(v); if (confirmPasswordError) setConfirmPasswordError(""); }}
                    placeholder="Repeat your password"
                    error={confirmPasswordError}
                    suffix={
                      <motion.button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        whileTap={{ scale: 0.85 }} transition={bouncySpring}
                        className="text-white/30 hover:text-orange-400 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    }
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <GlassInput label="Phone number" type="tel" value={phone} onChange={setPhone} placeholder="+234 800 000 0000" />
                  {role === "TECHNICIAN" && (
                    <>
                      <GlassInput label="Business name" value={businessName} onChange={setBusinessName} placeholder="Chukwu Plumbing Services" />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-widest text-orange-300/70">Service category</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {CATEGORIES.map((cat) => (
                            <motion.button key={cat} type="button" onClick={() => setCategory(cat)}
                              animate={category === cat
                                ? { background: "linear-gradient(135deg,#fb923c,#f97316)", borderColor: "transparent", color: "#fff" }
                                : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
                              whileTap={{ scale: 0.9 }} transition={bouncySpring}
                              className="py-2 rounded-xl border text-[10px] font-semibold">
                              {cat}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <GlassInput label="Years exp." type="number" value={experience} onChange={setExperience} placeholder="3" />
                        <GlassInput label="Base price (₦)" type="number" value={basePrice} onChange={setBasePrice} placeholder="5000" />
                      </div>
                      <GlassInput label="Bio" value={bio} onChange={setBio} placeholder="Tell employers what you do best..." textarea />
                    </>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <GlassInput label="Address (optional)" value={address} onChange={setAddress} placeholder="14 Allen Avenue, Ikeja, Lagos" />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-widest text-orange-300/70">Your location</label>
                    <motion.button type="button" onClick={detectLocation}
                      whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }} transition={bouncySpring}
                      className="flex items-center justify-center gap-2 rounded-2xl py-3 border text-sm font-semibold transition-all"
                      style={{
                        background: locationConfirmed ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.08)",
                        borderColor: locationConfirmed ? "rgba(34,197,94,0.3)" : "rgba(249,115,22,0.25)",
                        color: locationConfirmed ? "#4ade80" : "#fb923c",
                      }}>
                      {detectingLocation ? <Loader2 className="w-4 h-4 animate-spin" />
                        : locationConfirmed ? <CheckCircle2 className="w-4 h-4" />
                        : <Navigation className="w-4 h-4" />}
                      {detectingLocation ? "Detecting…" : locationConfirmed ? "Location confirmed" : "Detect my location"}
                    </motion.button>
                    {locationConfirmed && <p className="text-[10px] text-white/30 text-center">{lat}, {lng}</p>}
                  </div>
                  <div className="h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(249,115,22,0.2),transparent)" }} />
                  <div className="grid grid-cols-2 gap-3">
                    <GlassInput label="Latitude" value={lat} onChange={setLat} placeholder="6.524379" />
                    <GlassInput label="Longitude" value={lng} onChange={setLng} placeholder="3.379206" />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                transition={bouncySpring}
                className="rounded-xl px-4 py-3 text-xs font-medium text-red-300 border border-red-500/20"
                style={{ background: "rgba(239,68,68,0.08)" }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav */}
          <div className="flex gap-2">
            {step > 0 && (
              <SpringButton variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </SpringButton>
            )}
            {step < 2 ? (
              <SpringButton onClick={next}>Continue <ArrowRight className="w-4 h-4" /></SpringButton>
            ) : (
              <SpringButton onClick={handleRegister} loading={loading}>Create account <ArrowRight className="w-4 h-4" /></SpringButton>
            )}
          </div>

          <p className="text-center text-xs text-white/30">
            Already have an account?{" "}
            <motion.a href="/login" whileHover={{ color: "#f97316" }} className="text-orange-400 font-semibold hover:underline">Sign in</motion.a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}