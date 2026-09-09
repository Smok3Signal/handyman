"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { FadeIn } from "./FadeIn";
import { AMBER, COPPER, CREAM, FAINT, GRAIN, INK, RUST, F_DISPLAY } from "./theme";

const PROBLEMS = ["You cannot tell who is actually qualified", "The price shifts after work has started", "There is no clear record when something goes wrong"];
const SOLUTIONS = ["Profiles show verification, ratings and job history", "Terms and price are agreed before the work begins", "Jobs, messages and outcomes leave a usable record"];

export function WhyHandyMan() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <FadeIn className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em]" style={{ color: COPPER }}>Why HandyMan</p>
          <h2 className="leading-[1.05] tracking-[-.035em]" style={{ ...F_DISPLAY, fontSize: "clamp(2.2rem, 4vw, 3.7rem)", fontWeight: 600, color: CREAM }}>Trust should be part of the product.</h2>
        </FadeIn>

        <FadeIn className="mt-14">
          <div className="relative overflow-hidden rounded-4xl border border-white/10 shadow-[0_40px_100px_-55px_rgba(0,0,0,.95)]">
            <div className="grid md:grid-cols-[.8fr_1.2fr]">
              <div className="p-7 sm:p-10 md:p-12" style={{ background: "#211D18" }}>
                <div className="mb-10 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white/25" /><p className="text-xs font-semibold uppercase tracking-[.16em]" style={{ color: FAINT }}>The old way</p></div>
                <div className="space-y-7">
                  {PROBLEMS.map((item) => <div key={item} className="flex gap-4"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/2"><X size={13} style={{ color: "#857B6D" }} /></div><p className="text-sm leading-6" style={{ color: "#999082" }}>{item}</p></div>)}
                </div>
              </div>
              <div className="relative overflow-hidden p-7 sm:p-10 md:p-12" style={{ backgroundImage: `linear-gradient(135deg, ${RUST}, ${COPPER} 48%, ${AMBER})` }}>
                <div className="absolute inset-0 opacity-[.06] mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
                <div className="relative mb-10 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: INK }} /><p className="text-xs font-semibold uppercase tracking-[.16em]" style={{ color: "#17140Faa" }}>The HandyMan way</p></div>
                <div className="relative space-y-7">
                  {SOLUTIONS.map((item) => <div key={item} className="flex gap-4"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#17140F]" ><Check size={13} style={{ color: AMBER }} /></div><p className="text-sm font-medium leading-6" style={{ color: INK }}>{item}</p></div>)}
                </div>
                <div className="relative mt-10 flex items-center justify-between gap-5 border-t border-black/15 pt-6"><p className="max-w-sm text-xs leading-5" style={{ color: "#17140Faa" }}>A marketplace designed around information people can actually use.</p><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17140F]"><ArrowRight size={15} style={{ color: AMBER }} /></span></div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
