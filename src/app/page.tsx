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
      <div className="pointer-events-none fixed inset-0 z-1 opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: `url("${GRAIN}")` }} />
      <style jsx global>{`
        :root {
          color-scheme: dark;
          --ink: #17140F;
          --surface: #1F1A14;
          --section: #1A1611;
          --panel: #211D18;
          --cream: #F3F1EC;
          --faint: #B4AA9B;
          --muted: #8C8577;
          --muted-strong: #5B5348;
          --border: rgba(255,255,255,.10);
          --toggle-bg: rgba(255,255,255,.07);
          --toggle-knob: #F3F1EC;
          --toggle-icon: #17140F;
        }
        :root[data-theme="light"] {
          color-scheme: light;
          --ink: #17140F;
          --surface: #FFFDF9;
          --section: #F2EDE4;
          --panel: #F8F4EC;
          --cream: #201B16;
          --faint: #665E55;
          --muted: #756B60;
          --muted-strong: #B7AA9A;
          --border: rgba(45,35,25,.12);
          --toggle-bg: rgba(45,35,25,.08);
          --toggle-knob: #17140F;
          --toggle-icon: #F3F1EC;
        }
        html { scroll-behavior: smooth; }
        html, body { background: var(--ink); color: var(--cream); transition: background-color .35s ease, color .35s ease; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
        }
        a:focus-visible, button:focus-visible { outline: 2px solid ${AMBER}; outline-offset: 3px; border-radius: 5px; }
      `}</style>

      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("handyman-theme");var d=t||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=d}catch(e){}})()` }} />

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
