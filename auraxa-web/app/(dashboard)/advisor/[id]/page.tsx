"use client";

import { useEffect, useState, useRef, useCallback, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

interface Message { role: "user" | "assistant"; content: string; }

export default function AdvisorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  // Load existing conversation
  const load = useCallback(async () => {
    try {
      const res = await api.get(`/api/advisor/${id}`);
      setMessages(res.data?.messages ?? []);
    } catch { /* new conversation */ }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await api.post(`/api/advisor/${id}`, { message: userMsg.content });
      const reply = res.data?.reply ?? res.data?.content ?? "";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to get response.");
      setMessages(m => m.slice(0, -1));
      setInput(userMsg.content);
    } finally { setSending(false); }
  };

  const SUGGESTIONS = [
    "Why did the conversation feel off?",
    "What's the biggest red flag here?",
    "How should I respond to this?",
    "Is this relationship healthy?",
  ];

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 md:px-8 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--line)" }}>
        <div>
          <Link href={`/results/${id}`} className="label hover:text-text transition-colors mb-1 inline-block">← Back to Report</Link>
          <h1 className="font-display text-lg font-bold" style={{ color: "#171a20" }}>AI Advisor</h1>
        </div>
        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: "#171a20", color: "#fff" }}>◈</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded mx-auto mb-5 flex items-center justify-center text-2xl" style={{ background: "var(--surface-alt)", color: "#3457d5" }}>◈</div>
            <h2 className="font-display text-lg font-bold mb-2" style={{ color: "#171a20" }}>Ask Me Anything</h2>
            <p className="mb-6 max-w-sm mx-auto" style={{ color: "#5c5e62" }}>I've analysed this conversation. Ask me about the patterns, dynamics, or what to do next.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setInput(s)}
                  className="card card-hover p-3 text-sm text-left" style={{ color: "#171a20" }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded p-4 text-sm leading-relaxed ${m.role === "user" ? "" : "card"}`}
              style={m.role === "user"
                ? { background: "#171a20", color: "#fff" }
                : { color: "#171a20" }}>
              {m.content}
            </div>
          </motion.div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="card p-4 flex gap-1.5">
              {[0,1,2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#3457d5" }}
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-8 py-4" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Ask about this conversation..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button onClick={send} disabled={sending || !input.trim()} className="btn btn-primary px-5">→</button>
        </div>
      </div>
    </div>
  );
}
