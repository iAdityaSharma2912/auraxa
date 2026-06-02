"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

interface Profile {
  name: string; email: string; subscription_tier: string;
  analyses_used_month: number; created_at: string;
  bio?: string; dob?: string; location?: string; gender?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [location, setLocation] = useState("");
  const [gender, setGender] = useState("");
  const [promo, setPromo] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/users/me");
      const p = res.data;
      setProfile(p);
      setName(p.name ?? ""); setBio(p.bio ?? ""); setDob(p.dob ?? "");
      setLocation(p.location ?? ""); setGender(p.gender ?? "");
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/api/users/me", { name, bio, dob, location, gender });
      toast.success("Profile updated!");
      setDirty(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Update failed.");
    } finally { setSaving(false); }
  };

  const handlePromo = async () => {
    if (!promo.trim()) return;
    try {
      await api.post("/api/promo/redeem", { code: promo.trim() });
      toast.success("Promo code redeemed!");
      setPromo("");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid promo code.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-2 animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "#3457d5" }} />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="label mb-2" style={{ color: "#3457d5" }}>Account</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: "#171a20" }}>Your Profile</h1>
      </motion.div>

      {/* Avatar + tier */}
      <div className="card p-6 mb-4 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded flex items-center justify-center text-2xl font-bold font-display" style={{ background: "#171a20", color: "#fff" }}>
            {name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded text-[8px] font-mono font-semibold capitalize"
            style={{ background: "#3457d5", color: "#fff" }}>{profile?.subscription_tier}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold" style={{ color: "#171a20" }}>{name || "User"}</p>
          <p className="text-sm" style={{ color: "#5c5e62" }}>{profile?.email}</p>
          <p className="label mt-1">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}</p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="card p-6 mb-4">
        <p className="label mb-4">Profile Details</p>
        <div className="space-y-4">
          <div>
            <label className="label mb-2 block">Full Name</label>
            <input className="input" title="Full name" value={name} onChange={e => { setName(e.target.value); markDirty(); }} />
          </div>
          <div>
            <label className="label mb-2 block">Bio</label>
            <textarea className="input" title="Bio" rows={3} style={{ resize: "vertical" }} placeholder="Tell us about yourself..."
              value={bio} onChange={e => { setBio(e.target.value); markDirty(); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-2 block">Date of Birth</label>
              <input type="date" title="Date of birth" className="input" value={dob} onChange={e => { setDob(e.target.value); markDirty(); }} />
            </div>
            <div>
              <label className="label mb-2 block">Gender</label>
              <select title="Gender" className="input" value={gender} onChange={e => { setGender(e.target.value); markDirty(); }}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label mb-2 block">Location</label>
            <input className="input" placeholder="City, Country" value={location} onChange={e => { setLocation(e.target.value); markDirty(); }} />
          </div>
        </div>
        {dirty && (
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={handleSave} disabled={saving} className="btn btn-primary w-full mt-5">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save Changes →"}
          </motion.button>
        )}
      </div>

      {/* Promo code */}
      <div className="card p-6">
        <p className="label mb-3">Promo Code</p>
        <div className="flex gap-2">
          <input className="input" placeholder="Enter code" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} />
          <button onClick={handlePromo} className="btn btn-secondary px-6">Redeem</button>
        </div>
      </div>
    </div>
  );
}
