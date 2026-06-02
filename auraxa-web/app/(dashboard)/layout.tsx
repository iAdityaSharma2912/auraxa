import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import TokenSync from "@/components/shared/TokenSync";
import Logo from "@/components/ui/Logo";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦", desc: "Overview" },
  { href: "/analyze",   label: "Analyse",   icon: "◫", desc: "New reading" },
  { href: "/reports",   label: "Reports",   icon: "▤", desc: "Past analyses" },
  { href: "/astrology", label: "Astrology", icon: "◈", desc: "Stars & palm" },
  { href: "/upgrade",   label: "Upgrade",   icon: "▲", desc: "Premium plans" },
];

async function SignOutButton() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <button type="submit"
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-sm transition-all label hover:text-accent"
        style={{ color: "#5c5e62" }}>
        ↗ Sign Out
      </button>
    </form>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase())
    .includes(session.user?.email?.toLowerCase() ?? "");

  return (
    <div className="flex min-h-screen">
      <TokenSync />

      {/* Sidebar */}
      <aside className="w-64 fixed top-0 left-0 h-full flex flex-col z-40 mobile-hidden"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--line)" }}>
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
          <Logo size="sm" />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto no-scrollbar">
          <p className="label px-4 mb-3">Navigation</p>
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded transition-all group hover:bg-surface-alt"
              style={{ color: "#5c5e62" }}>
              <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-105"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: "14px", color: "#3457d5" }}>{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-xs font-semibold tracking-wide transition-colors group-hover:text-text" style={{ color: "#171a20" }}>{item.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#5c5e62" }}>{item.desc}</p>
              </div>
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="my-3" style={{ borderTop: "1px solid var(--line)" }} />
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded transition-all group hover:bg-surface-alt" style={{ color: "#5c5e62" }}>
                <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(204,0,0,.06)", border: "1px solid rgba(204,0,0,.15)" }}>
                  <span style={{ fontSize: "14px", color: "#cc0000" }}>●</span>
                </div>
                <div>
                  <p className="font-display text-xs font-semibold" style={{ color: "#171a20" }}>Admin</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#5c5e62" }}>Control panel</p>
                </div>
              </Link>
            </>
          )}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--line)" }}>
          <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-surface-alt group transition-all mb-1">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold"
                style={{ background: "#171a20", color: "#fff" }}>
                {session.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: "#3457d5", border: "2px solid var(--surface)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate transition-colors group-hover:text-text" style={{ color: "#171a20" }}>{session.user?.name ?? "User"}</p>
              <p className="text-[10px] truncate" style={{ color: "#5c5e62" }}>{session.user?.email?.split("@")[0]}</p>
            </div>
            <span style={{ color: "#5c5e62" }}>→</span>
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden glass-strong" style={{ borderTop: "1px solid var(--line)" }}>
        {[...NAV.slice(0, 4), { href: "/profile", label: "Profile", icon: "◇", desc: "" }].map(item => (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center py-3 gap-1" style={{ color: "#5c5e62" }}>
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span className="label" style={{ fontSize: "8px" }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <main className="flex-1 md:ml-64 min-h-screen pb-24 md:pb-0">
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
