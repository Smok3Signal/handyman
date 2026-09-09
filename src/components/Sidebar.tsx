"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  BarChart2,
  User,
  LogOut,
  Wrench,
  DollarSign,
  ImageIcon,
  Navigation,
  Search,
  Trophy,
  Headphones,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };

const EMPLOYER_LINKS: NavItem[] = [
  { label: "Dashboard",   href: "/employer/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Find",        href: "/employer/find",      icon: Search,          exact: true },
  { label: "My Jobs",     href: "/employer/jobs",      icon: Briefcase,       exact: true },
  { label: "Ongoing",     href: "/employer/ongoing",   icon: Navigation,      exact: true },
  { label: "Analytics",   href: "/employer/analytics", icon: BarChart2,       exact: true },
  { label: "Leaderboard", href: "/leaderboard",        icon: Trophy,          exact: true },
  { label: "Support",     href: "/support",            icon: Headphones,      exact: true },
];

const TECHNICIAN_LINKS: NavItem[] = [
  { label: "Dashboard",   href: "/technician/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Jobs",        href: "/technician/jobs",      icon: Wrench,          exact: true },
  { label: "Portfolio",   href: "/technician/portfolio", icon: ImageIcon,       exact: true },
  { label: "Earnings",    href: "/technician/earnings",  icon: DollarSign,      exact: true },
  { label: "Distress",    href: "/technician/distress",  icon: ShieldAlert,     exact: true },
  { label: "Disputes",    href: "/technician/disputes",  icon: AlertTriangle,   exact: true },
  { label: "Leaderboard", href: "/leaderboard",          icon: Trophy,          exact: true },
  { label: "Support",     href: "/support",              icon: Headphones,      exact: true },
];

// Mobile shows first 4 links + Profile tab.
// For technicians: Dashboard, Jobs, Distress, Earnings — Distress replaces Portfolio
// (Portfolio is desktop-only on mobile; technicians access it via desktop).
// We hand-pick mobile slots to keep Distress visible.
const TECHNICIAN_MOBILE_LINKS = [
  TECHNICIAN_LINKS[0], // Dashboard
  TECHNICIAN_LINKS[1], // Jobs
  TECHNICIAN_LINKS[4], // Distress
  TECHNICIAN_LINKS[3], // Earnings
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const role = user?.role;
  const links = role === "EMPLOYER" ? EMPLOYER_LINKS : TECHNICIAN_LINKS;
  const mobileLinks = role === "EMPLOYER" ? EMPLOYER_LINKS.slice(0, 4) : TECHNICIAN_MOBILE_LINKS;

  const isActive = (link: NavItem) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-stone-200/80 z-40">

        {/* Logo */}
        <div className="px-5 h-16 flex items-center border-b border-stone-200/80 shrink-0">
          <Link href="/" className="flex items-center group">
            <img
              src="/logo-dark.png"
              alt="HandyMan"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            {role === "EMPLOYER" ? "Employer" : "Technician"}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link);
            // Distress link gets a subtle red tint when active instead of orange
            const isDistress = link.href === "/technician/distress";
            return (
              <motion.div
                key={link.href + link.label}
                whileHover={{ x: active ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <Link
                  href={link.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? isDistress
                        ? "text-red-600"
                        : "text-orange-600"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-pill"
                      className={`absolute inset-0 border rounded-xl ${
                        isDistress
                          ? "bg-red-50 border-red-100"
                          : "bg-orange-50 border-orange-100"
                      }`}
                      transition={spring}
                    />
                  )}
                  <span className="relative flex items-center gap-3">
                    <Icon
                      size={17}
                      strokeWidth={active ? 2.5 : 2}
                      className={
                        active
                          ? isDistress
                            ? "text-red-500"
                            : "text-orange-500"
                          : ""
                      }
                    />
                    {link.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom: User info + Profile + Sign out */}
        <div className="px-3 pb-4 pt-3 border-t border-stone-100 space-y-0.5 shrink-0">
          {/* User info row */}
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-orange-100 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate leading-tight">
                {user?.name?.split(" ")[0]}
              </p>
              <p className="text-xs text-stone-400 truncate leading-tight">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Profile link */}
          <motion.div
            whileHover={{ x: pathname === "/profile" ? 0 : 2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <Link
              href="/profile"
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === "/profile"
                  ? "text-orange-600"
                  : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
              }`}
            >
              {pathname === "/profile" && (
                <motion.div
                  layoutId="sidebar-pill"
                  className="absolute inset-0 bg-orange-50 border border-orange-100 rounded-xl"
                  transition={spring}
                />
              )}
              <span className="relative flex items-center gap-3">
                <User
                  size={17}
                  strokeWidth={pathname === "/profile" ? 2.5 : 2}
                  className={pathname === "/profile" ? "text-orange-500" : ""}
                />
                My Profile
              </span>
            </Link>
          </motion.div>

          {/* Sign out */}
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={17} />
            Sign out
          </motion.button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-200/80 z-40 px-1">
        <div className="flex items-center justify-around py-1">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link);
            const isDistress = link.href === "/technician/distress";
            return (
              <motion.div
                key={link.href + link.label}
                whileTap={{ scale: 0.88 }}
                transition={spring}
              >
                <Link
                  href={link.href}
                  className="relative flex flex-col items-center gap-1 px-3 py-2"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-pill"
                      className={`absolute inset-0 rounded-xl ${
                        isDistress ? "bg-red-50" : "bg-orange-50"
                      }`}
                      transition={spring}
                    />
                  )}
                  <span className="relative flex flex-col items-center gap-1">
                    <Icon
                      size={20}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={
                        active
                          ? isDistress
                            ? "text-red-500"
                            : "text-orange-500"
                          : "text-stone-400"
                      }
                    />
                    <span
                      className={`text-[10px] font-semibold ${
                        active
                          ? isDistress
                            ? "text-red-500"
                            : "text-orange-500"
                          : "text-stone-400"
                      }`}
                    >
                      {link.label}
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}

          {/* Profile tab */}
          <motion.div whileTap={{ scale: 0.88 }} transition={spring}>
            <Link
              href="/profile"
              className="relative flex flex-col items-center gap-1 px-3 py-2"
            >
              {pathname === "/profile" && (
                <motion.div
                  layoutId="mobile-pill"
                  className="absolute inset-0 bg-orange-50 rounded-xl"
                  transition={spring}
                />
              )}
              <span className="relative flex flex-col items-center gap-1">
                <User
                  size={20}
                  strokeWidth={pathname === "/profile" ? 2.5 : 1.8}
                  className={
                    pathname === "/profile" ? "text-orange-500" : "text-stone-400"
                  }
                />
                <span
                  className={`text-[10px] font-semibold ${
                    pathname === "/profile" ? "text-orange-500" : "text-stone-400"
                  }`}
                >
                  Profile
                </span>
              </span>
            </Link>
          </motion.div>
        </div>
      </nav>
    </>
  );
}