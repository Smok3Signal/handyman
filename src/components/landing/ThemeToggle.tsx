"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("handyman-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : systemDark;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    setDark(isDark);
  }, []);

  function toggle() {
    const nextDark = !dark;
    document.documentElement.dataset.theme = nextDark ? "dark" : "light";
    localStorage.setItem("handyman-theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="relative flex h-9 w-16 items-center rounded-full border border-[var(--border)] bg-[var(--toggle-bg)] p-1 transition-colors"
    >
      <span
        className="absolute h-7 w-7 rounded-full bg-[var(--toggle-knob)] shadow-md transition-transform duration-300"
        style={{ transform: `translateX(${dark ? "24px" : "0px"})` }}
      />
      <Sun size={14} className="relative z-10 ml-1 text-[var(--toggle-icon)]" />
      <Moon size={14} className="relative z-10 ml-auto mr-1 text-[var(--toggle-icon)]" />
    </button>
  );
}
