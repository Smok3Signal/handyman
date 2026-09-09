"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Twitter, Instagram, Facebook, Linkedin, Phone, Mail, MapPinned } from "lucide-react";

const FOOTER_COLS = [
  { heading: "Platform", links: ["How it works", "Browse technicians", "Services", "Pricing", "Leaderboard"] },
  { heading: "Company", links: ["About us", "Blog", "Careers", "Press", "Partners"] },
  { heading: "Support", links: ["Help centre", "Contact us", "Dispute resolution", "Report an issue", "Trust & Safety"] },
];

const SOCIALS = [
  { icon: Twitter, href: "#" },
  { icon: Instagram, href: "#" },
  { icon: Facebook, href: "#" },
  { icon: Linkedin, href: "#" },
];

const CONTACTS = [
  { icon: Phone, text: "+234 800 HANDYMAN" },
  { icon: Mail, text: "hello@handyman.ng" },
  { icon: MapPinned, text: "Lagos, Nigeria" },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 pb-8 pt-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Image src="/logo-light.png" alt="HandyMan" width={120} height={36} className="mb-4 h-8 w-auto object-contain" />
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-stone-400">Nigeria's trusted marketplace for verified home and business technicians. Fast, safe, accountable.</p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, href }) => <motion.a key={href + Icon.name} href={href} whileHover={{ scale: 1.15, y: -3, rotate: 5 }} whileTap={{ scale: .92 }} transition={{ type: "spring", stiffness: 400, damping: 14 }} className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 transition-colors hover:bg-orange-500"><Icon size={15} className="text-stone-400 transition hover:text-white" /></motion.a>)}
            </div>
          </div>
          {FOOTER_COLS.map((col) => <div key={col.heading}><p className="mb-4 text-sm font-semibold text-white">{col.heading}</p><ul className="space-y-2.5">{col.links.map((link) => <li key={link}><Link href="#" className="text-sm text-stone-400 transition hover:text-white">{link}</Link></li>)}</ul></div>)}
        </div>
        <div className="mb-10 flex flex-wrap gap-6 border-b border-stone-800 pb-10">{CONTACTS.map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-2 text-sm text-stone-400"><Icon size={14} className="text-orange-400" /><span>{text}</span></div>)}</div>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row"><p className="text-xs text-stone-500">© 2026 HandyMan Technologies Ltd. All rights reserved.</p><div className="flex gap-5 text-xs text-stone-500">{["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => <Link key={l} href="#" className="transition hover:text-white">{l}</Link>)}</div></div>
      </div>
    </footer>
  );
}
