"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

export function FadeIn({
  children,
  className = "",
  delay = 0,
  distance = 20,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: distance }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GradientNumber({
  value,
  from,
  to,
}: {
  value: string;
  from: string;
  to: string;
}) {
  return (
    <span
      className="text-3xl sm:text-4xl lg:text-[2.7rem] font-semibold leading-none tracking-tight"
      style={{
        fontFamily:
          '"Avenir Next", "Century Gothic", "Futura", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {value}
    </span>
  );
}
