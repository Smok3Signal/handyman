"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import {
  Headphones,
  Send,
  ChevronDown,
  Bug,
  CreditCard,
  User,
  MessageCircle,
  Wrench,
  HardHat,
  HelpCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

// ── Transitions ───────────────────────────────────────────────────────────────
const mountEase: Transition = { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "BUG_REPORT",        label: "Bug Report",          desc: "Something isn't working correctly",   icon: Bug,          color: "bg-red-100 text-red-600"      },
  { value: "PAYMENT_DISPUTE",   label: "Payment Dispute",     desc: "Issues with payments or pricing",     icon: CreditCard,   color: "bg-amber-100 text-amber-600"  },
  { value: "ACCOUNT_ISSUE",     label: "Account Issue",       desc: "Problems with your account",          icon: User,         color: "bg-violet-100 text-violet-600" },
  { value: "GENERAL_ENQUIRY",   label: "General Enquiry",     desc: "Questions or feedback",               icon: MessageCircle,color: "bg-sky-100 text-sky-600"      },
  { value: "REPORT_TECHNICIAN", label: "Report a Technician", desc: "Report misconduct or bad service",    icon: Wrench,       color: "bg-orange-100 text-orange-600" },
  { value: "REPORT_EMPLOYER",   label: "Report an Employer",  desc: "Report a problematic employer",       icon: HardHat,      color: "bg-stone-100 text-stone-600"   },
];

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OPEN:      { label: "Open",      color: "bg-sky-100 text-sky-700 border-sky-200",              icon: FileText     },
  IN_REVIEW: { label: "In Review", color: "bg-amber-100 text-amber-700 border-amber-200",        icon: Clock        },
  RESOLVED:  { label: "Resolved",  color: "bg-emerald-100 text-emerald-700 border-emerald-200",  icon: CheckCircle2 },
  CLOSED:    { label: "Closed",    color: "bg-stone-100 text-stone-500 border-stone-200",        icon: XCircle      },
};

// ── FAQs ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: "How do I cancel a job request?",          a: "You can cancel a pending job request from the My Jobs page before the technician accepts it." },
  { q: "How are technicians ranked?",              a: "Technicians are ranked based on a combination of their average rating (40%) and number of completed jobs (60%)." },
  { q: "What if I'm not satisfied with the work?", a: "After a job is marked complete, you can tap 'Request Redo' to ask the technician to fix the work before confirming satisfaction." },
  { q: "How do I become a verified technician?",   a: "Complete your profile fully, build up reviews, and reach Gold rank. Verification badges are awarded automatically." },
  { q: "How long does it take to resolve a ticket?", a: "We aim to respond to all tickets within 24–48 hours. Complex issues may take longer." },
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TicketSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-28" />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "tickets" | "faq">("new");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ category: "", subject: "", message: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchTickets();
  }, [status, router]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.category || !form.subject || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Ticket submitted — we'll get back to you soon");
      setForm({ category: "", subject: "", message: "" });
      setActiveTab("tickets");
      fetchTickets();
    } else {
      toast.error("Failed to submit ticket");
    }
    setSubmitting(false);
  };

  const openTickets = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_REVIEW").length;
  const repliedTickets = tickets.filter((t) => t.adminReply).length;

  return (
    <Layout title="Support">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-orange-950 px-7 py-7 text-white"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 rounded-full bg-orange-400/8 blur-2xl" />

          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Headphones size={22} className="text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">Help Desk</p>
              <h1 className="text-3xl font-extrabold tracking-tight">Support Centre</h1>
              <p className="text-stone-400 text-sm mt-1">Submit a ticket or browse FAQs — we're here to help.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            {openTickets > 0 && (
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Clock size={12} />
                {openTickets} ticket{openTickets > 1 ? "s" : ""} awaiting response
              </div>
            )}
            {repliedTickets > 0 && (
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <MessageSquare size={12} />
                {repliedTickets} admin repl{repliedTickets > 1 ? "ies" : "y"} — tap My Tickets to view
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...mountEase, delay: 0.08 }}
          className="flex gap-2"
        >
          {[
            { key: "new",     label: "New Ticket" },
            { key: "tickets", label: `My Tickets${tickets.length > 0 ? ` (${tickets.length})` : ""}` },
            { key: "faq",     label: "FAQs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ── New Ticket ── */}
        <AnimatePresence mode="wait">
          {activeTab === "new" && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={mountEase}
              className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm space-y-6"
            >
              <h2 className="font-bold text-stone-800 text-lg">What do you need help with?</h2>

              {/* Category grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const selected = form.category === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      whileHover={{ y: -2, transition: hoverSpring }}
                      onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                      className={`flex items-start gap-3 border rounded-2xl p-3.5 text-left transition-colors ${
                        selected
                          ? "border-orange-400 bg-orange-50"
                          : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cat.color}`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${selected ? "text-orange-700" : "text-stone-800"}`}>{cat.label}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue…"
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Message</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue in detail. Include any relevant job IDs, dates, or context…"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? <Spinner size="sm" /> : <><Send size={15} /> Submit Ticket</>}
              </button>
            </motion.div>
          )}

          {/* ── My Tickets ── */}
          {activeTab === "tickets" && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={mountEase}
            >
              {loading ? (
                <TicketSkeleton />
              ) : tickets.length === 0 ? (
                <div className="bg-white border border-stone-100 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Headphones size={24} className="text-stone-400" />
                  </div>
                  <p className="font-semibold text-stone-700">No tickets yet</p>
                  <p className="text-sm text-stone-400">Submit a ticket if you need help</p>
                  <button
                    onClick={() => setActiveTab("new")}
                    className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Create Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket, i) => {
                    const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.CLOSED;
                    const StatusIcon = cfg.icon;
                    const cat = CATEGORIES.find((c) => c.value === ticket.category);
                    const CatIcon = cat?.icon ?? HelpCircle;
                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...mountEase, delay: i * 0.05 }}
                        className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat?.color ?? "bg-stone-100 text-stone-500"}`}>
                            <CatIcon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-stone-800 text-sm leading-snug">{ticket.subject}</p>
                              <span className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.color}`}>
                                <StatusIcon size={11} />
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">{cat?.label ?? ticket.category}</p>
                            <p className="text-sm text-stone-600 bg-stone-50 rounded-xl px-3 py-2.5 mt-2.5 leading-relaxed">{ticket.message}</p>
                            <p className="text-xs text-stone-400 mt-2">
                              Submitted {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>

                            {/* ── Admin reply ── */}
                            {ticket.adminReply && (
                              <div className="mt-3 border border-orange-200 bg-orange-50 rounded-xl px-3 py-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <MessageSquare size={12} className="text-orange-500" />
                                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Admin Reply</p>
                                </div>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{ticket.adminReply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── FAQs ── */}
          {activeTab === "faq" && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={mountEase}
              className="space-y-2.5"
            >
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
                  >
                    <p className="font-semibold text-stone-800 text-sm">{faq.q}</p>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown size={16} className="text-stone-400" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-stone-600 bg-orange-50/50 mx-5 mb-4 rounded-xl p-4 leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}