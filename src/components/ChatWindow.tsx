"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import Spinner from "./Spinner";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: string;
}

interface ChatWindowProps {
  jobRequestId: string;
  initialMessages: Message[];
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0 self-end mb-1"
      style={{ background: "linear-gradient(135deg, #fb923c, #ea580c)" }}
    >
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function TailRight() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" className="absolute -right-1.5 bottom-1.5" style={{ fill: "#f97316" }}>
      <path d="M0 0 Q8 5 0 10 Z" />
    </svg>
  );
}

function TailLeft() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" className="absolute -left-1.5 bottom-1.5" style={{ fill: "#ffffff" }}>
      <path d="M8 0 Q0 5 8 10 Z" />
    </svg>
  );
}

export default function ChatWindow({ jobRequestId, initialMessages }: ChatWindowProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (session?.user as any)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?jobRequestId=${jobRequestId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch { /* silent */ }
  }, [jobRequestId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRequestId, content: newMessage.trim() }),
      });
      if (res.ok) {
        const text = await res.text();
        const msg = text ? JSON.parse(text) : null;
        if (msg) setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        fetchMessages();
      }
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  type Group = { senderId: string; senderName: string; messages: Message[] };
  const groups: Group[] = [];
  for (const msg of messages) {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg);
    } else {
      groups.push({ senderId: msg.senderId, senderName: msg.sender?.name ?? "", messages: [msg] });
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm flex flex-col" style={{ height: 360 }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: "linear-gradient(135deg, #431407, #c2410c)" }}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle size={15} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-orange-900" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Job Chat</p>
            <p className="text-orange-200/70 text-[10px] mt-0.5">Messages are private</p>
          </div>
        </div>
        <span className="text-orange-200/60 text-[10px] font-medium">
          {messages.length} msg{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{
          background: "linear-gradient(180deg, #fafaf9 0%, #f5f5f4 100%)",
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
              <MessageCircle size={20} className="text-orange-300" />
            </div>
            <p className="text-stone-400 text-xs font-medium">No messages yet — say hello!</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {groups.map((group, gi) => {
            const isMe = group.senderId === myId;
            return (
              <div key={gi} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && <Avatar name={group.senderName} />}
                <div className={`flex flex-col gap-1 max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-[10px] font-semibold text-stone-400 px-1 ml-1">{group.senderName}</p>
                  )}
                  {group.messages.map((msg, mi) => {
                    const isLast = mi === group.messages.length - 1;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                        className={`relative ${isMe ? "pr-2" : "pl-2"}`}
                      >
                        <div
                          className={`relative px-3.5 py-2.5 text-sm leading-relaxed ${
                            isMe
                              ? "text-white rounded-2xl rounded-br-md"
                              : "text-stone-800 bg-white rounded-2xl rounded-bl-md shadow-[0_1px_4px_rgba(0,0,0,0.08)] border border-stone-100"
                          }`}
                          style={isMe ? { background: "linear-gradient(135deg, #f97316, #ea580c)" } : {}}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMe ? "text-orange-200/80" : "text-stone-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {isLast && (isMe ? <TailRight /> : <TailLeft />)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-white border-t border-stone-100 flex items-center gap-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2.5 border border-stone-200 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none"
          />
        </div>
        <motion.button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:shadow-none transition-shadow shrink-0"
          style={{ background: newMessage.trim() ? "linear-gradient(135deg, #f97316, #ea580c)" : "#d1d5db" }}
        >
          {sending ? <Spinner size="sm" /> : <Send size={16} />}
        </motion.button>
      </div>
    </div>
  );
}