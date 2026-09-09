"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Car, Hammer, HardHat, Paintbrush, Sparkles, Snowflake, Wrench, Zap } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { AMBER, COPPER, CREAM, FAINT, F_DISPLAY } from "./theme";

const SERVICES = [
  { label: "Plumbing", icon: Wrench, from: "#C1652E", to: "#7A3524", size: "large", blurb: "Leaks · installs · repairs" },
  { label: "Electrical", icon: Zap, from: "#3B6E8C", to: "#22333F", size: "normal" },
  { label: "Painting", icon: Paintbrush, from: "#B85C6B", to: "#6E3641", size: "normal" },
  { label: "Carpentry", icon: Hammer, from: "#8B5E34", to: "#4A2F1B", size: "large", blurb: "Furniture · fittings · framing" },
  { label: "Cleaning", icon: Sparkles, from: "#4E8C7C", to: "#22403A", size: "normal" },
  { label: "Mechanic", icon: Car, from: "#5B6773", to: "#211E1A", size: "normal" },
  { label: "AC repair", icon: Snowflake, from: "#5FA8C8", to: "#243B45", size: "wide" },
  { label: "And more", icon: HardHat, from: COPPER, to: AMBER, size: "wide" },
] as const;

export function Services() {
  return (
    <section id="services" className="border-t border-white/10 py-24 sm:py-32" style={{ background: "#1A1611" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <FadeIn className="flex max-w-3xl flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="mb-3 text-xs font-semibold uppercase tracking-[.18em]" style={{ color: COPPER }}>One marketplace</p><h2 className="leading-[1.05] tracking-[-.035em]" style={{ ...F_DISPLAY, fontSize: "clamp(2.2rem, 4vw, 3.7rem)", fontWeight: 600, color: CREAM }}>Whatever needs doing, start here.</h2></div>
          <p className="max-w-sm text-sm leading-6 md:pb-1" style={{ color: FAINT }}>From everyday fixes to specialist work, discover the people who know how to do it.</p>
        </FadeIn>

        <div className="mt-14 grid auto-rows-[150px] grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            const span = s.size === "large" ? "col-span-2 row-span-2" : s.size === "wide" ? "col-span-2" : "col-span-1";
            return <FadeIn key={s.label} delay={i * .045} className={span}>
              <Link href="/register" className="group relative block h-full overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-6" style={{ background: `linear-gradient(145deg, ${s.from}38, ${s.to}88)` }}>
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-40 blur-3xl transition duration-500 group-hover:scale-150" style={{ background: s.from }} />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur" ><Icon size={18} style={{ color: CREAM }} /></div><ArrowUpRight size={17} className="opacity-40 transition group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:opacity-100" style={{ color: CREAM }} /></div>
                  <div><p className={`${s.size === "large" ? "text-xl sm:text-2xl" : "text-sm sm:text-base"} font-semibold`} style={{ ...F_DISPLAY, color: CREAM }}>{s.label}</p>{s.blurb && <p className="mt-1 text-xs" style={{ color: "rgba(243,241,236,.72)" }}>{s.blurb}</p>}</div>
                </div>
              </Link>
            </FadeIn>;
          })}
        </div>
      </div>
    </section>
  );
}
