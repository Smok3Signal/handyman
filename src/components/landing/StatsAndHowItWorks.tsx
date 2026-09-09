"use client";

import { ArrowDown, Check, MessageSquareText, Search, ShieldCheck } from "lucide-react";
import { FadeIn, GradientNumber } from "./FadeIn";
import { AMBER, COPPER, CREAM, FAINT, INK, LINE, STEEL, SURF, F_DISPLAY } from "./theme";

const STATS = [
  ["500+", "verified technicians", COPPER, AMBER],
  ["2,000+", "jobs completed", "#5FA8C8", STEEL],
  ["4.8/5", "average rating", AMBER, COPPER],
  ["18 min", "median first response", "#6B9D90", "#3D6E64"],
] as const;

const STEPS = [
  { n: "01", icon: Search, title: "Describe the work", desc: "Tell us what needs fixing, where you are, and what matters most." },
  { n: "02", icon: ShieldCheck, title: "Choose with confidence", desc: "Compare verified profiles, ratings, job history and clear pricing." },
  { n: "03", icon: MessageSquareText, title: "Lock it in", desc: "Agree on terms, keep the conversation in one place, and track the job." },
];

export function StatsSection() {
  return (
    <section className="relative border-b border-white/10 bg-[#1B1712]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 sm:px-6 md:grid-cols-4">
        {STATS.map(([value, label, from, to], i) => (
          <FadeIn key={label} delay={i * .05} className="border-r border-white/10 px-4 py-9 last:border-r-0 sm:px-6 lg:px-9">
            <GradientNumber value={value} from={from} to={to} />
            <p className="mt-2 text-xs leading-5 sm:text-sm" style={{ color: FAINT }}>{label}</p>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-125 w-125 -translate-x-1/2 rounded-full bg-[#C1652E]/[0.035] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        <FadeIn className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.18em]" style={{ color: COPPER }}>
            How it works
          </p>
          <h2
            className="leading-[1.05] tracking-[-.035em]"
            style={{ ...F_DISPLAY, fontSize: "clamp(2.2rem, 4.5vw, 4rem)", fontWeight: 600, color: CREAM }}
          >
            A better way to get things fixed.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7" style={{ color: FAINT }}>
            Less guessing. More information. One clear path from problem to completed job.
          </p>
        </FadeIn>

        {/* Desktop connector system lives outside the cards so it can never drift with card content. */}
        <div className="relative mt-16">
          <div
            className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-13.5 hidden h-px md:block"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${COPPER}88 14%, ${AMBER}88 50%, ${COPPER}88 86%, transparent 100%)`,
            }}
          />

          <div className="pointer-events-none absolute left-[33.333%] top-13.5 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10"
              style={{ background: INK, boxShadow: `0 0 0 6px ${INK}` }}
            >
              <span style={{ color: `${AMBER}cc`, fontSize: 15, lineHeight: 1 }}>→</span>
            </div>
          </div>

          <div className="pointer-events-none absolute left-[66.666%] top-13.5 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10"
              style={{ background: INK, boxShadow: `0 0 0 6px ${INK}` }}
            >
              <span style={{ color: `${AMBER}cc`, fontSize: 15, lineHeight: 1 }}>→</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.n} delay={i * 0.1} className="h-full">
                  <div className="relative flex h-full min-h-72.5 flex-col rounded-3xl border border-white/10 bg-white/2.5 p-6 shadow-[0_24px_70px_-45px_rgba(0,0,0,.9)] transition duration-300 hover:-translate-y-1 hover:bg-white/4.5 sm:p-8">
                    <div className="mb-12 flex items-start justify-between">
                      <span
                        className="text-5xl font-light tracking-[-.06em]"
                        style={{ color: "rgba(243,241,236,.13)" }}
                      >
                        {step.n}
                      </span>
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10"
                        style={{ background: `linear-gradient(135deg, ${COPPER}22, ${AMBER}12)` }}
                      >
                        <Icon size={18} style={{ color: AMBER }} />
                      </div>
                    </div>

                    <div className="mt-auto">
                      <h3 className="text-xl font-semibold" style={{ ...F_DISPLAY, color: CREAM }}>
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6" style={{ color: FAINT }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>

        <FadeIn className="mt-10">
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 px-5 py-4"
            style={{ background: `linear-gradient(90deg, ${COPPER}09, transparent, ${AMBER}09)` }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: `${AMBER}18` }}>
                <Check size={15} style={{ color: AMBER }} />
              </div>
              <p className="text-sm" style={{ color: CREAM }}>Every step leaves a clear record.</p>
            </div>
            <p className="text-xs" style={{ color: FAINT }}>Built for accountability from first message to final rating.</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
