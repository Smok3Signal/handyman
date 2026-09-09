"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles, Wrench } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { AMBER, COPPER, CREAM, FAINT, GRAIN, INK, RUST, SURF } from "./theme";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28">
      <div className="absolute inset-x-5 inset-y-6 overflow-hidden rounded-[36px] border border-white/10 sm:inset-x-6" style={{ backgroundImage: `linear-gradient(125deg, ${RUST}, ${COPPER} 46%, ${AMBER})` }}>
        <div className="absolute inset-0 opacity-[.06] mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/20 blur-[100px]" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#17140F]/25 blur-[110px]" />
      </div>

      <FadeIn className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-10 sm:py-16 lg:grid-cols-[1fr_360px] lg:px-14">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#17140F]/10 px-3 py-1.5 text-xs font-semibold" style={{ color: INK }}><Sparkles size={13} /> Ready when you are.</div>
          <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl" style={{ color: INK }}>Stop guessing. Get the right person for the job.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 sm:text-lg" style={{ color: "rgba(23,20,15,.72)" }}>Find someone you can trust, or put your own skills to work. HandyMan makes the next step simple.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17140F] px-6 py-3.5 text-sm font-bold text-[#F3F1EC] transition hover:-translate-y-0.5">Find a technician <ArrowRight size={16} /></Link>
            <Link href="/register?role=TECHNICIAN" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#17140F]/20 px-6 py-3.5 text-sm font-bold transition hover:border-[#17140F]/40" style={{ color: INK }}><Wrench size={16} /> Join the roster</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 p-5 shadow-2xl backdrop-blur-xl" style={{ background: "rgba(23,20,15,.18)" }}>
          <p className="text-xs font-semibold uppercase tracking-[.16em]" style={{ color: "rgba(23,20,15,.58)" }}>What changes</p>
          <div className="mt-5 space-y-4">
            {["Know who you're hiring", "Know what you'll pay", "Know what happened on the job"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#17140F]/10 px-3 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17140F]"><Check size={14} style={{ color: AMBER }} /></div><p className="text-xs font-semibold" style={{ color: INK }}>{item}</p></div>)}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
