"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import api from "@/lib/api";
import { toast } from "sonner";

function ResetForm() {
  const params = useSearchParams();
  const token  = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!token) toast.error("Invalid reset link."); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Reset failed. Link may have expired.");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8 flex justify-center"><Logo size="lg" /></div>
      <div className="card p-8" style={{ boxShadow: "var(--shadow)" }}>
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded flex items-center justify-center text-2xl mx-auto mb-4" style={{ background: "rgba(52,87,213,.1)", color: "#3457d5" }}>✓</div>
            <h2 className="font-display text-lg font-semibold mb-2" style={{ color: "#171a20" }}>Password Updated</h2>
            <p className="text-sm mb-6" style={{ color: "#5c5e62" }}>Your password has been changed.</p>
            <Link href="/login" className="btn btn-primary">Sign In →</Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold mb-1" style={{ color: "#171a20" }}>Set New Password</h2>
              <p className="text-sm" style={{ color: "#5c5e62" }}>Choose a strong password.</p>
            </div>
            {!token ? (
              <div className="text-center py-4">
                <p className="text-sm mb-4" style={{ color: "#cc0000" }}>This reset link is invalid or missing.</p>
                <Link href="/login" className="text-sm" style={{ color: "#3457d5" }}>← Request a new link</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="password" placeholder="New password (min. 8 characters)" value={password} onChange={e => setPassword(e.target.value)} className="input" required autoFocus />
                <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input" required />
                {password.length > 0 && (
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: password.length >= i*3 ? (i<=1 ? "#cc0000" : i<=2 ? "#5c5e62" : "#3457d5") : "var(--surface-alt)" }} />
                    ))}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Update Password →"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <p className="text-center mt-5">
        <Link href="/login" className="label hover:text-text transition-colors">← Back to Sign In</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Suspense fallback={<div className="text-center label">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </motion.div>
    </main>
  );
}
