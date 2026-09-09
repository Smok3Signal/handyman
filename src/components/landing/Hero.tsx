"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin, ShieldCheck, Sparkles, Star, Wrench } from "lucide-react";
import { AMBER, COPPER, CREAM, FAINT, INK, RUST, STEEL, SURF, SURF_2, F_DISPLAY, MUTED } from "./theme";

const FLOATERS = [
  { title: "Plumbing", name: "Uche N.", rating: "4.9", position: "left-0 top-16 lg:left-2 lg:top-24", rotate: -7, from: COPPER, to: RUST },
  { title: "Electrical", name: "Kelechi I.", rating: "4.8", position: "right-0 top-4 lg:right-2 lg:top-10", rotate: 5, from: "#3B6E8C", to: "#22333F" },
  { title: "Painting", name: "Blessing A.", rating: "5.0", position: "right-4 bottom-4 lg:right-8 lg:bottom-8", rotate: 7, from: AMBER, to: COPPER },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute -left-56 -top-56 h-160 w-160 rounded-full bg-[#C1652E]/20 blur-[130px]" />
      <div className="pointer-events-none absolute -right-48 top-20 h-160 w-160 rounded-full bg-[#E3A73A]/10 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-72 left-1/3 h-120 w-120 rounded-full bg-[#5B6773]/10 blur-[130px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-medium" style={{ color: FAINT }}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: `${AMBER}22` }}><ShieldCheck size={13} style={{ color: AMBER }} /></span>
            Verified people. Transparent jobs. Local trust.
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .06, ease: [.22,1,.36,1] }} className="max-w-4xl leading-[.98] tracking-[-0.045em]" style={{ ...F_DISPLAY, fontSize: "clamp(3.25rem, 7vw, 6.3rem)", fontWeight: 600, color: CREAM }}>
            The right hands for the job.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .16 }} className="mt-7 max-w-xl text-base leading-7 sm:text-lg" style={{ color: FAINT }}>
            Find background-checked technicians, compare real work history, and lock the price before anyone touches the job.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .24 }} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-[#17140F] shadow-[0_18px_45px_-18px_#C1652E] transition-transform hover:-translate-y-1" style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${COPPER})` }}>
              Find a technician <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/register?role=TECHNICIAN" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/2.5 px-6 py-3.5 text-sm font-semibold transition hover:-translate-y-1 hover:bg-white/6" style={{ color: CREAM }}>
              <Wrench size={16} /> Become a technician
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .32 }} className="mt-11 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs" style={{ color: FAINT }}>
            {["Verified profiles", "Upfront pricing", "Job records"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2"><Check size={14} style={{ color: AMBER }} />{item}</span>
            ))}
          </motion.div>
        </div>

        <div className="relative mx-auto h-110 w-full max-w-147.5 sm:h-125 lg:h-147.5">
          <div className="absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/6 bg-[radial-gradient(circle_at_50%_45%,rgba(227,167,58,.15),transparent_58%)]" />
          <div className="absolute left-1/2 top-1/2 h-[56%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C1652E]/20" />
          <div className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10" />

          {FLOATERS.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, scale: .86, y: 30, rotate: 0 }} animate={{ opacity: 1, scale: 1, y: 0, rotate: card.rotate }} transition={{ duration: .75, delay: .28 + i * .12, ease: [.22,1,.36,1] }} className={`absolute ${card.position} z-20 w-47.5 rounded-2xl border border-white/10 p-4 shadow-2xl sm:w-53.75`} style={{ background: `linear-gradient(145deg, ${SURF}, ${INK})` }}>
              <div className="mb-3 h-1 w-9 rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${card.from}, ${card.to})` }} />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundImage: `linear-gradient(135deg, ${card.from}, ${card.to})`, color: CREAM }}>{card.name.split(" ").map(x => x[0]).join("")}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold" style={{ color: CREAM }}>{card.name}</p><p className="text-xs" style={{ color: FAINT }}>{card.title}</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold" style={{ color: CREAM }}><Star size={11} fill={AMBER} style={{ color: AMBER }} />{card.rating}</span>
                <span className="inline-flex items-center gap-1" style={{ color: "#7EC9A0" }}><ShieldCheck size={11} />Verified</span>
              </div>
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .35 }} className="absolute left-1/2 top-1/2 z-10 w-70 -translate-x-1/2 -translate-y-1/2 sm:w-82.5">
            <div className="overflow-hidden rounded-[28px] border border-white/15 bg-[#211C16]/95 shadow-[0_35px_100px_-35px_rgba(0,0,0,.9)] backdrop-blur-xl">
              <div className="border-b border-white/10 px-5 pb-4 pt-5">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[.18em]" style={{ color: MUTED }}>New job</p><p className="mt-1 text-sm font-semibold" style={{ color: CREAM }}>Fix leaking kitchen tap</p></div><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "#7EC9A020", color: "#91D8B0" }}>Open</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><MapPin size={13} style={{ color: AMBER }} /><p className="mt-2 text-[10px]" style={{ color: MUTED }}>Location</p><p className="mt-0.5 text-xs font-medium" style={{ color: CREAM }}>Lekki, Lagos</p></div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><Sparkles size={13} style={{ color: COPPER }} /><p className="mt-2 text-[10px]" style={{ color: MUTED }}>Budget</p><p className="mt-0.5 text-xs font-medium" style={{ color: CREAM }}>₦15,000 max</p></div>
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold" style={{ color: CREAM }}>Top matches</p><span className="text-[10px]" style={{ color: MUTED }}>3 nearby</span></div>
                <div className="space-y-2.5">
                  {["Uche N.", "Kelechi I.", "Femi K."].map((name, i) => <div key={name} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/2.5 p-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: i === 0 ? `linear-gradient(135deg,${COPPER},${RUST})` : i === 1 ? `linear-gradient(135deg,#3B6E8C,#22333F)` : `linear-gradient(135deg,#8B5E34,#4A2F1B)`, color: CREAM }}>{name.split(" ").map(x => x[0]).join("")}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold" style={{ color: CREAM }}>{name}</p><p className="text-[10px]" style={{ color: MUTED }}>{["4.9 · 134 jobs", "4.8 · 89 jobs", "4.7 · 67 jobs"][i]}</p></div><span className="text-[10px] font-semibold" style={{ color: AMBER }}>View</span></div>)}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#17140F]/80 px-4 py-2 text-[10px] font-semibold shadow-xl backdrop-blur-lg" style={{ color: CREAM }}>Price agreed · job protected</div>
        </div>
      </div>
    </section>
  );
}
