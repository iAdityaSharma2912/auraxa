"use client";
import { useEffect, useState, useRef, useCallback, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";

interface Message { role:"user"|"assistant"; content:string; }

export default function AdvisorPage({ params }: { params: Promise<{id:string}> }) {
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const load = useCallback(async () => {
    try { const r=await api.get(`/api/advisor/${id}`); setMessages(r.data?.messages??[]); }
    catch {}
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!input.trim()||sending) return;
    const msg:Message = { role:"user", content:input.trim() };
    setMessages(m=>[...m, msg]);
    setInput("");
    setSending(true);
    try {
      const r=await api.post(`/api/advisor/${id}`,{message:msg.content});
      setMessages(m=>[...m, {role:"assistant",content:r.data?.reply??r.data?.content??""}]);
    } catch(e:any) {
      toast.error(e?.response?.data?.detail||"Failed.");
      setMessages(m=>m.slice(0,-1));
      setInput(msg.content);
    } finally { setSending(false); }
  };

  const SUGGESTIONS = [
    "Why did this feel off?",
    "Biggest red flag here?",
    "How should I respond?",
    "Is this healthy?",
  ];

  return (
    <div className="flex flex-col" style={{ height:"calc(100dvh - 56px - 72px)" }}>
      <style>{`@media(min-width:768px){ .advisor-height{ height:calc(100dvh) !important } }`}</style>

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom:"1px solid var(--line)" }}>
        <div>
          <Link href={`/results/${id}`} className="label hover:text-primary transition-colors mb-1 inline-block" style={{ fontSize:"9px" }}>← Back to Report</Link>
          <h1 className="font-display text-base font-bold" style={{ color:"var(--text)" }}>AI Advisor</h1>
        </div>
        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background:"#1e1a2e", color:"#fff" }}>◈</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3">
        {messages.length===0&&(
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background:"var(--surface-alt)", color:"var(--primary)" }}>◈</div>
            <h2 className="font-display text-base font-bold mb-2" style={{ color:"var(--text)" }}>Ask Me Anything</h2>
            <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color:"var(--muted)" }}>I've analysed this conversation. Ask me about the patterns or what to do next.</p>
            {/* Suggestions 2-col on mobile */}
            <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
              {SUGGESTIONS.map(s=>(
                <button key={s} onClick={()=>setInput(s)}
                  className="card p-3 text-left text-xs" style={{ color:"var(--text)" }}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i)=>(
          <motion.div key={i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            <div className="max-w-[85%] rounded p-3 text-sm leading-relaxed"
              style={m.role==="user"?{background:"#1e1a2e",color:"#fff"}:{background:"var(--surface)",border:"1px solid var(--line)",color:"var(--text)"}}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {sending&&(
          <div className="flex justify-start">
            <div className="card p-3 flex gap-1.5">
              {[0,1,2].map(i=>(
                <motion.span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:"var(--primary)" }}
                  animate={{ opacity:[.3,1,.3] }} transition={{ duration:1, repeat:Infinity, delay:i*.2 }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input — stays above bottom nav on mobile */}
      <div className="px-3 sm:px-5 py-3 flex-shrink-0" style={{ borderTop:"1px solid var(--line)" }}>
        <div className="flex gap-2">
          <input ref={inputRef} className="input flex-1" placeholder="Ask about this conversation..."
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}/>
          <button onClick={send} disabled={sending||!input.trim()} className="btn btn-primary px-4"
            style={{ flexShrink:0, minWidth:"44px" }}>→</button>
        </div>
      </div>
    </div>
  );
}
