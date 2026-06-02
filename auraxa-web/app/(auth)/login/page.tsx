"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { toast } from "sonner";
import api from "@/lib/api";

type View = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error("Please fill in all fields."); return; }
    setEmailLoading(true);
    try {
      const result = await signIn("credentials", { email: loginEmail, password: loginPassword, redirect: false });
      if (result?.error) toast.error("Invalid email or password.");
      else window.location.href = "/dashboard";
    } catch { toast.error("Login failed."); }
    finally { setEmailLoading(false); }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) { toast.error("Please fill in all fields."); return; }
    if (signupPassword !== signupConfirm) { toast.error("Passwords do not match."); return; }
    if (signupPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setEmailLoading(true);
    try {
      await api.post("/api/auth/register", { email: signupEmail, password: signupPassword, name: signupName });
      toast.success("Account created!");
      await signIn("credentials", { email: signupEmail, password: signupPassword, callbackUrl: "/dashboard" });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Signup failed.");
    } finally { setEmailLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { toast.error("Enter your email."); return; }
    setEmailLoading(true);
    setResetUrl(null); setNotFound(false);
    try {
      const res = await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
      if (res.data?.reset_url) setResetUrl(res.data.reset_url);
      else setNotFound(true);
    } catch { toast.error("Something went wrong."); }
    finally { setEmailLoading(false); }
  };

  const resetForgot = () => { setView("login"); setResetUrl(null); setForgotEmail(""); setNotFound(false); setCopied(false); };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="text-center mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-8" style={{ boxShadow: "var(--shadow)" }}>
          {view !== "forgot" && (
            <div className="flex gap-1 p-1 rounded mb-7" style={{ background: "var(--surface-alt)" }}>
              {(["login", "signup"] as const).map(t => (
                <button key={t} onClick={() => setView(t)}
                  className="flex-1 py-2.5 rounded text-sm font-display font-semibold transition-all"
                  style={t === view
                    ? { background: "#fff", color: "#171a20", boxShadow: "var(--shadow-sm)" }
                    : { color: "#5c5e62" }}>
                  {t === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {view === "forgot" && (
            <div className="mb-6">
              <button onClick={resetForgot} className="text-sm mb-4 transition-colors hover:text-text" style={{ color: "#5c5e62" }}>← Back to Sign In</button>
              <h2 className="font-display text-xl font-semibold" style={{ color: "#171a20" }}>Reset Password</h2>
              <p className="text-sm mt-1" style={{ color: "#5c5e62" }}>Enter your email to generate a reset link.</p>
            </div>
          )}

          {view !== "forgot" && (
            <>
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded text-sm transition-all disabled:opacity-40 mb-5"
                style={{ border: "1px solid var(--line)", color: "#171a20", background: "#fff" }}>
                {googleLoading ? <div className="w-4 h-4 border-2 border-line border-t-secondary rounded-full animate-spin" /> : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                <span className="label">OR</span>
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.form key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }} onSubmit={handleEmailLogin} className="space-y-3">
                <input type="email" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="input" required />
                <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="input" required />
                <div className="text-right">
                  <button type="button" onClick={() => setView("forgot")} className="text-xs transition-colors hover:text-text" style={{ color: "#3457d5" }}>Forgot password?</button>
                </div>
                <button type="submit" disabled={emailLoading} className="btn btn-primary w-full">
                  {emailLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In →"}
                </button>
              </motion.form>
            )}

            {view === "signup" && (
              <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }} onSubmit={handleEmailSignup} className="space-y-3">
                <input type="text" placeholder="Full name" value={signupName} onChange={e => setSignupName(e.target.value)} className="input" required />
                <input type="email" placeholder="Email address" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="input" required />
                <input type="password" placeholder="Password (min. 8 characters)" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="input" required />
                <input type="password" placeholder="Confirm password" value={signupConfirm} onChange={e => setSignupConfirm(e.target.value)} className="input" required />
                <button type="submit" disabled={emailLoading} className="btn btn-primary w-full mt-1">
                  {emailLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Account →"}
                </button>
              </motion.form>
            )}

            {view === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                {resetUrl ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded" style={{ background: "rgba(52,87,213,.08)", border: "1px solid rgba(52,87,213,.2)" }}>
                      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(52,87,213,.15)", color: "#3457d5" }}>✓</div>
                      <p className="text-sm" style={{ color: "#171a20" }}>Reset link generated for <span className="font-medium">{forgotEmail}</span></p>
                    </div>
                    <div className="rounded p-4" style={{ border: "1px solid var(--line)", background: "var(--surface)" }}>
                      <p className="label mb-2">Your Reset Link</p>
                      <p className="font-mono text-xs break-all mb-3" style={{ color: "#3457d5" }}>{resetUrl}</p>
                      <div className="flex gap-2">
                        <button onClick={() => window.open(resetUrl, "_blank")} className="btn btn-primary flex-1">Open Link →</button>
                        <button onClick={() => { navigator.clipboard.writeText(resetUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="btn btn-secondary px-4">{copied ? "✓" : "Copy"}</button>
                      </div>
                    </div>
                    <p className="label text-center">This link expires in 30 minutes.</p>
                    <button onClick={resetForgot} className="w-full text-sm transition-colors hover:text-text py-1" style={{ color: "#3457d5" }}>← Back to Sign In</button>
                  </div>
                ) : notFound ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded" style={{ background: "rgba(204,0,0,.06)", border: "1px solid rgba(204,0,0,.2)" }}>
                      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(204,0,0,.12)", color: "#cc0000" }}>✕</div>
                      <p className="text-sm" style={{ color: "#171a20" }}>No account found for <span className="font-medium">{forgotEmail}</span></p>
                    </div>
                    <button onClick={() => { setNotFound(false); setForgotEmail(""); }} className="btn btn-secondary w-full">Try another email</button>
                    <button onClick={resetForgot} className="w-full text-sm transition-colors hover:text-text py-1" style={{ color: "#3457d5" }}>← Back to Sign In</button>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <input type="email" placeholder="Your account email address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="input" required autoFocus />
                    <button type="submit" disabled={emailLoading} className="btn btn-primary w-full">
                      {emailLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Generate Reset Link →"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {view !== "forgot" && (
            <p className="text-center text-xs mt-5 leading-relaxed" style={{ color: "#5c5e62" }}>
              By continuing, you agree to our{" "}
              <Link href="/terms" className="transition-colors hover:text-text" style={{ color: "#3457d5" }}>Terms</Link>{" "}and{" "}
              <Link href="/privacy" className="transition-colors hover:text-text" style={{ color: "#3457d5" }}>Privacy Policy</Link>.
            </p>
          )}
        </div>

        <p className="text-center mt-5">
          <Link href="/" className="label hover:text-text transition-colors">← Back to Auraxa</Link>
        </p>
      </motion.div>
    </main>
  );
}
