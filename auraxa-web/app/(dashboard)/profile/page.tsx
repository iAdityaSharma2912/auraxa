"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { toast } from "sonner";

interface Profile { name:string;email:string;subscription_tier:string;analyses_used_month:number;created_at:string;bio?:string;dob?:string;location?:string;gender?:string; }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState(""); const [bio, setBio] = useState("");
  const [dob, setDob] = useState(""); const [location, setLocation] = useState("");
  const [gender, setGender] = useState(""); const [promo, setPromo] = useState("");

  const load = useCallback(async () => {
    try {
      const r=await api.get("/api/users/me"); const p=r.data;
      setProfile(p); setName(p.name??""); setBio(p.bio??"");
      setDob(p.dob??""); setLocation(p.location??""); setGender(p.gender??"");
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const mk = () => setDirty(true);

  const save = async () => {
    setSaving(true);
    try { await api.put("/api/users/me",{name,bio,dob,location,gender}); toast.success("Profile updated!"); setDirty(false); }
    catch(e:any) { toast.error(e?.response?.data?.detail||"Update failed."); }
    finally { setSaving(false); }
  };

  const redeemPromo = async () => {
    if (!promo.trim()) return;
    try { await api.post("/api/promo/redeem",{code:promo.trim()}); toast.success("Promo code redeemed!"); setPromo(""); load(); }
    catch(e:any) { toast.error(e?.response?.data?.detail||"Invalid code."); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[80vh]">
    <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor:"var(--line-2)", borderTopColor:"var(--primary)" }}/>
  </div>;

  const Spinner = () => <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>;

  return (
    <div className="px-3 sm:px-5 md:px-8 py-4 md:py-8 max-w-xl">
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-5 md:mb-8">
        <p className="label mb-2" style={{ fontSize:"9px", color:"var(--primary)" }}>Account</p>
        <h1 className="font-display font-bold" style={{ fontSize:"clamp(1.3rem,5vw,1.875rem)", color:"var(--text)" }}>Your Profile</h1>
      </motion.div>

      {/* Avatar + tier */}
      <div className="card p-4 mb-4 flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded flex items-center justify-center text-xl font-bold font-display" style={{ background:"#1e1a2e", color:"#fff" }}>
            {name?.[0]?.toUpperCase()??"U"}
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold capitalize" style={{ background:"var(--primary)", color:"#fff" }}>{profile?.subscription_tier}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-base font-bold" style={{ color:"var(--text)" }}>{name||"User"}</p>
          <p className="text-xs" style={{ color:"var(--muted)" }}>{profile?.email}</p>
          <p className="label mt-1" style={{ fontSize:"9px" }}>Member since {profile?.created_at?new Date(profile.created_at).toLocaleDateString("en-IN",{month:"short",year:"numeric"}):"—"}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-4 mb-4">
        <p className="label mb-4" style={{ fontSize:"9px" }}>Profile Details</p>
        <div className="space-y-3">
          <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Full Name</label>
            <input className="input" value={name} onChange={e=>{setName(e.target.value);mk();}}/></div>
          <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Bio</label>
            <textarea title="Bio" className="input" rows={3} style={{ resize:"vertical" }} placeholder="Tell us about yourself..."
              value={bio} onChange={e=>{setBio(e.target.value);mk();}}/></div>
          {/* DOB + Gender in a row on mobile too */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Date of Birth</label>
              <input type="date" title="Date of birth" className="input" value={dob} onChange={e=>{setDob(e.target.value);mk();}}/></div>
            <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Gender</label>
              <select title="Gender" className="input" value={gender} onChange={e=>{setGender(e.target.value);mk();}}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select></div>
          </div>
          <div><label className="label mb-1.5 block" style={{ fontSize:"9px" }}>Location</label>
            <input className="input" placeholder="City, Country" value={location} onChange={e=>{setLocation(e.target.value);mk();}}/></div>
        </div>
        {dirty&&(
          <motion.button initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            onClick={save} disabled={saving} className="btn btn-primary w-full mt-4">
            {saving?<Spinner/>:"Save Changes →"}
          </motion.button>
        )}
      </div>

      {/* Promo */}
      <div className="card p-4">
        <p className="label mb-3" style={{ fontSize:"9px" }}>Promo Code</p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Enter code" value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())}/>
          <button onClick={redeemPromo} className="btn btn-secondary px-4">Redeem</button>
        </div>
      </div>
    </div>
  );
}
