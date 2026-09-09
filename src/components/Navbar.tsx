"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setUnread(data.filter((n: any) => !n.read).length);
    };
    fetchUnread();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          🔧 HandyMan
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-gray-600 text-sm hidden md:block">
                Hi, {session.user?.name?.split(" ")[0]}
              </span>

              <Link
                href={role === "EMPLOYER" ? "/employer/dashboard" : "/technician/dashboard"}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Dashboard
              </Link>

              {role === "EMPLOYER" && (
                <>
                  <Link href="/employer/jobs" className="text-gray-600 hover:text-blue-600 text-sm">
                    My Jobs
                  </Link>
                  <Link href="/employer/analytics" className="text-gray-600 hover:text-blue-600 text-sm">
                    Analytics
                  </Link>
                  <Link href="/employer/ongoing" className="text-gray-600 hover:text-blue-600 text-sm">
                    Ongoing
                  </Link>
                </>
              )}

              {role === "TECHNICIAN" && (
                <>
                  <Link href="/technician/portfolio" className="text-gray-600 hover:text-blue-600 text-sm">
                    Portfolio
                  </Link>
                  <Link href="/technician/earnings" className="text-gray-600 hover:text-blue-600 text-sm">
                    Earnings
                  </Link>
                </>
              )}

              {/* Notification Bell */}
              <Link href="/notifications" className="relative">
                <Bell size={20} className="text-gray-500 hover:text-blue-600 transition" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}