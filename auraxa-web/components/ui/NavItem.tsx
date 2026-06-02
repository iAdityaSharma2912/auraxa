"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItemProps { href: string; icon: string; label: string; desc: string; }

export function NavItem({ href, icon, label, desc }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded transition-all group"
      style={{ color: active ? "#1e1a2e" : "#5c5e62", background: active ? "var(--surface-alt)" : "transparent", borderLeft: `2px solid ${active ? "#6c55e0" : "transparent"}` }}>
      <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: active ? "rgba(108,85,224,.12)" : "var(--surface-alt)", border: `1px solid ${active ? "rgba(108,85,224,.25)" : "var(--line)"}` }}>
        <span style={{ fontSize: "14px", color: active ? "#6c55e0" : "#9b9aa3" }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-display text-xs font-bold tracking-wide" style={{ color: active ? "#1e1a2e" : "#5c5e62" }}>{label.toUpperCase()}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "#9b9aa3" }}>{desc}</p>
      </div>
    </Link>
  );
}

export function MobileNavItem({ href, icon, label }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
      style={{ color: active ? "#6c55e0" : "#9b9aa3" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-montserrat)", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </Link>
  );
}