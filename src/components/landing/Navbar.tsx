"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { AMBER, COPPER, CREAM, FAINT, INK } from "./theme";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Technicians", href: "#browse" },
  { label: "Services", href: "#services" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-[#17140F]/90 backdrop-blur-xl" : "bg-[#17140F]/55 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
        <Link href="#" aria-label="HandyMan home" className="shrink-0">
          <Image src="/logo-light.png" alt="HandyMan" width={124} height={36} className="h-8 w-auto" priority />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm font-medium text-[#B4AA9B] transition-colors hover:text-[#F3F1EC] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-linear-to-r after:from-[#C1652E] after:to-[#E3A73A] after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <Link href="/login" className="text-sm font-medium text-[#B4AA9B] hover:text-white">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#17140F] shadow-[0_10px_30px_-12px_#C1652E] transition-transform hover:-translate-y-0.5"
            style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${COPPER})` }}
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-white/10 p-2 text-white sm:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#17140F]/95 px-5 pb-5 pt-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-[#B4AA9B] hover:bg-white/5 hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex gap-3 border-t border-white/10 pt-4">
            <Link href="/login" className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold" style={{ color: CREAM }}>
              Log in
            </Link>
            <Link href="/register" className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ backgroundImage: `linear-gradient(135deg, ${AMBER}, ${COPPER})`, color: INK }}>
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
