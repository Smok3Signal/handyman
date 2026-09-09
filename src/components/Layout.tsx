"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";

const spring: Transition = { type: "spring", stiffness: 500, damping: 28 };

export default function Layout({
  children,
  title,
  showBack = true,
}: {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-50/60">
      <Sidebar />
      <div className="md:ml-56 flex flex-col min-h-screen">
        <TopBar title={title} />
        <main className="flex-1 pb-24 md:pb-8">
          {showBack && (
            <div className="px-5 pt-4 pb-1">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors group"
              >
                <span className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center group-hover:border-stone-300 group-hover:bg-stone-50 transition-colors">
                  <ArrowLeft size={13} className="text-stone-500" />
                </span>
                Back
              </motion.button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}