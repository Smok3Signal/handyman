"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MapPin, ShieldCheck, Star } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { AMBER, COPPER, CREAM, FAINT, RUST, SURF, F_DISPLAY } from "./theme";

const TECHS = [
  { name: "Uche N.", trade: "Plumbing", rating: "4.9", jobs: 134, location: "Lekki", initials: "UN", from: COPPER, to: RUST, tag: "Top rated" },
  { name: "Kelechi I.", trade: "Electrical", rating: "4.8", jobs: 89, location: "Surulere", initials: "KI", from: "#3B6E8C", to: "#22333F", tag: "Fast response" },
  { name: "Blessing A.", trade: "Painting", rating: "5.0", jobs: 211, location: "Victoria Island", initials: "BA", from: "#B85C6B", to: "#6E3641", tag: "211 jobs" },
  { name: "Femi K.", trade: "Carpentry", rating: "4.7", jobs: 67, location: "Ikeja", initials: "FK", from: "#8B5E34", to: "#4A2F1B", tag: "Available" },
];

export function BrowseTechnicians() {
  return (
    <section id="browse" className="border-y border-white/10 py-24 sm:py-32" style={{ background: "#1A1611" }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <FadeIn className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em]" style={{ color: COPPER }}>The roster</p>
            <h2 className="leading-[1.05] tracking-[-.035em]" style={{ ...F_DISPLAY, fontSize: "clamp(2.2rem, 4vw, 3.7rem)", fontWeight: 600, color: CREAM }}>Good work starts with the right person.</h2>
          </FadeIn>
          <FadeIn delay={.1}><Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: AMBER }}>Explore all technicians <ArrowUpRight size={16} /></Link></FadeIn>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TECHS.map((t, i) => <FadeIn key={t.name} delay={i * .07}>
            <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="group relative h-full overflow-hidden rounded-3xl border border-white/10 p-5" style={{ background: `linear-gradient(155deg, ${SURF}, #17130F)` }}>
              <div className="absolute inset-x-0 top-0 h-24 opacity-50" style={{ background: `radial-gradient(circle at 50% 0%, ${t.from}55, transparent 70%)` }} />
              <div className="relative flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold shadow-lg" style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})`, color: CREAM }}>{t.initials}</div>
                <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[10px] font-semibold" style={{ color: FAINT }}>{t.tag}</span>
              </div>
              <div className="relative mt-10"><p className="text-lg font-semibold" style={{ ...F_DISPLAY, color: CREAM }}>{t.name}</p><p className="mt-1 text-sm" style={{ color: FAINT }}>{t.trade}</p></div>
              <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs" style={{ color: FAINT }}>
                <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5"><Star size={12} fill={AMBER} style={{ color: AMBER }} />{t.rating}</span><span>{t.jobs} jobs</span></div>
                <div className="flex items-center gap-1.5"><MapPin size={12} />{t.location}, Lagos</div>
                <div className="flex items-center gap-1.5" style={{ color: "#8DD0A7" }}><ShieldCheck size={12} />Identity verified</div>
              </div>
              <Link href="/register" className="mt-5 flex items-center justify-between rounded-xl border border-white/10 px-3.5 py-3 text-xs font-semibold transition group-hover:border-white/20 group-hover:bg-white/4" style={{ color: CREAM }}>View profile <ArrowUpRight size={14} /></Link>
            </motion.div>
          </FadeIn>)}
        </div>
      </div>
    </section>
  );
}
