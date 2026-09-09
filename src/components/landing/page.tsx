"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StatsSection, HowItWorksSection } from "@/components/landing/StatsAndHowItWorks";
import { BrowseTechnicians } from "@/components/landing/BrowseTechnicians";
import { WhyHandyMan } from "@/components/landing/WhyHandyMan";
import { Services } from "@/components/landing/Services";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { AMBER, CREAM, F_BODY, GRAIN, INK } from "@/components/landing/theme";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as { role?: string } | undefined)?.role;
      router.push(role === "EMPLOYER" ? "/employer/dashboard" : "/technician/dashboard");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen" style={{ ...F_BODY, background: INK, color: CREAM }}>
      <div className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
        }
        a:focus-visible, button:focus-visible { outline: 2px solid ${AMBER}; outline-offset: 3px; border-radius: 5px; }
      `}</style>

      <Navbar />
      <main>
        <Hero />
        <StatsSection />
        <HowItWorksSection />
        <BrowseTechnicians />
        <WhyHandyMan />
        <Services />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
