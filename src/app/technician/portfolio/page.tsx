"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import PortfolioGallery from "@/components/PortfolioGallery";
import Spinner from "@/components/Spinner";
import toast from "react-hot-toast";
import type { Transition } from "framer-motion";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Link2, Upload, X, ImageOff, CheckCircle2, Star } from "lucide-react";

const mountEase: Transition = { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] };
const hoverSpring: Transition = { type: "spring", stiffness: 340, damping: 28 };

export default function TechnicianPortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [form, setForm] = useState({ imageUrl: "", title: "", description: "" });
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "completed" | "manual">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchPortfolio();
  }, [status, router]);

  const fetchPortfolio = async () => {
    setLoading(true);
    const userId = (session?.user as any)?.id;
    if (!userId) { setLoading(false); return; }
    const res = await fetch(`/api/portfolio?userId=${userId}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((p) => ({ ...p, imageUrl: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.imageUrl || !form.title) {
      toast.error("Please add an image and a title");
      return;
    }
    setUploading(true);
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Portfolio item added!");
      setForm({ imageUrl: "", title: "", description: "" });
      setShowForm(false);
      fetchPortfolio();
    } else {
      toast.error("Failed to save item");
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
    toast.success("Item removed");
    fetchPortfolio();
  };

  // Split items
  const completedJobItems = items.filter((i) => i.isCompletedJob);
  const manualItems = items.filter((i) => !i.isCompletedJob);

  const filteredItems =
    activeFilter === "all"
      ? items
      : activeFilter === "completed"
      ? completedJobItems
      : manualItems;

  return (
    <Layout title="My Portfolio">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={mountEase}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-stone-800">My Portfolio</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Showcase your best work to win more jobs
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04, transition: hoverSpring }}
            whileTap={{ scale: 0.96, transition: hoverSpring }}
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={16} />
            Add Work
          </motion.button>
        </motion.div>

        {/* ── Stats row ── */}
        {!loading && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.05 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: "Total Items", value: items.length, icon: <Star size={14} className="text-orange-500" /> },
              { label: "Completed Jobs", value: completedJobItems.length, icon: <CheckCircle2 size={14} className="text-green-500" /> },
              { label: "Manual Uploads", value: manualItems.length, icon: <Upload size={14} className="text-blue-500" /> },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-1">
                  {stat.icon}
                  <span className="text-xs text-stone-500">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-stone-800">{stat.value}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Completed jobs banner (auto-added) ── */}
        {!loading && completedJobItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountEase, delay: 0.08 }}
            className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-4 py-3.5"
          >
            <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">
                {completedJobItems.length} completed job{completedJobItems.length !== 1 ? "s" : ""} automatically added
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Photos taken when you marked jobs complete are stored here automatically.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Filter tabs ── */}
        {!loading && items.length > 0 && (
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit">
            {([
              { key: "all", label: `All (${items.length})` },
              { key: "completed", label: `Completed Jobs (${completedJobItems.length})` },
              { key: "manual", label: `Manual (${manualItems.length})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeFilter === key
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── Add item form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-stone-800">Add Portfolio Item</h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2 p-1 bg-stone-100 rounded-xl w-fit">
                  {(["url", "file"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setUploadMode(mode)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                        uploadMode === mode
                          ? "bg-white text-orange-600 shadow-sm"
                          : "text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      {mode === "url" ? <Link2 size={13} /> : <Upload size={13} />}
                      {mode === "url" ? "Image URL" : "Upload File"}
                    </button>
                  ))}
                </div>

                {/* Image input */}
                {uploadMode === "url" ? (
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={form.imageUrl}
                      onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                      className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5">Upload Image</label>
                    <label className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-200 rounded-xl p-5 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition">
                      <Upload size={16} className="text-stone-400" />
                      <span className="text-sm text-stone-500">Click to upload a photo</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                {/* Preview */}
                <AnimatePresence>
                  {form.imageUrl && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.22 }}
                      className="relative"
                    >
                      <img src={form.imageUrl} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
                      <button
                        onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/80 transition"
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen renovation in Lekki"
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">
                    Description <span className="text-stone-300">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the work done…"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-stone-50 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02, transition: hoverSpring }}
                    whileTap={{ scale: 0.97, transition: hoverSpring }}
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    {uploading ? "Saving…" : "Save Item"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Gallery ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-stone-100 rounded-2xl aspect-square" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={mountEase}
            className="text-center py-20 bg-white rounded-2xl border border-stone-200"
          >
            <ImageOff size={44} className="mx-auto mb-3 text-stone-300" />
            <p className="font-semibold text-stone-700">
              {activeFilter === "completed"
                ? "No completed job photos yet"
                : activeFilter === "manual"
                ? "No manually added items"
                : "No portfolio items yet"}
            </p>
            <p className="text-sm text-stone-400 mt-1">
              {activeFilter === "completed"
                ? "Photos taken when you mark a job complete will appear here automatically."
                : "Add photos of your completed work to attract more clients"}
            </p>
            {activeFilter !== "completed" && (
              <motion.button
                whileHover={{ scale: 1.03, transition: hoverSpring }}
                whileTap={{ scale: 0.97, transition: hoverSpring }}
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <Plus size={15} /> Add Your First Item
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...mountEase, delay: 0.1 }}
          >
            <PortfolioGallery items={filteredItems} editable onDelete={handleDelete} />
          </motion.div>
        )}
      </div>
    </Layout>
  );
}