import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import Logo from "@/components/ui/Logo";
import { NavItem, MobileNavItem } from "@/components/ui/NavItem";
import TokenSync from "@/components/shared/TokenSync";

const NAV = [
  { href: "/dashboard", icon: "▦", label: "Dashboard", desc: "Overview" },
  { href: "/analyze",   icon: "◫", label: "Analyse",   desc: "New reading" },
  { href: "/reports",   icon: "▤", label: "Reports",   desc: "Past analyses" },
  { href: "/astrology", icon: "◈", label: "Astrology", desc: "Stars & palm" },
  { href: "/upgrade",   icon: "▲", label: "Upgrade",   desc: "Premium plans" },
];

async function SignOutButton() {
  return (
    <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
      <button type="submit" className="w-full flex items-center gap-2 px-4 py-2.5 rounded transition-all label"
        style={{ color: "#9b9aa3", fontSize: "10px" }}>
        ↗ SIGN OUT
      </button>
    </form>
  );
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = process.env.ADMIN_EMAILS?.split(",")
    .map(e => e.trim().toLowerCase())
    .includes(session.user?.email?.toLowerCase() ?? "");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <TokenSync />

      {/* ── Desktop sidebar — hidden below md ── */}
      <aside
        className="hidden md:flex w-64 fixed top-0 left-0 h-full flex-col z-40"
        style={{ background: "var(--bg)", borderRight: "1px solid var(--line)" }}
      >
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--line)" }}>
          <Logo size="sm" />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto no-scrollbar">
          <p className="label px-4 mb-3" style={{ fontSize: "9px" }}>Navigation</p>
          {NAV.map(item => <NavItem key={item.href} {...item} />)}
          {isAdmin && (
            <>
              <div className="my-3" style={{ borderTop: "1px solid var(--line)" }} />
              <NavItem href="/admin" icon="●" label="Admin" desc="Control panel" />
            </>
          )}
        </nav>

        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--line)" }}>
          <a href="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded hover:bg-surface-alt group transition-all mb-1"
            style={{ textDecoration: "none" }}>
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold font-display"
                style={{ background: "#1e1a2e", color: "#fff" }}>
                {session.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: "#6c55e0", border: "2px solid var(--bg)" }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate font-display" style={{ color: "#1e1a2e" }}>
                {session.user?.name ?? "User"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "#9b9aa3" }}>
                {session.user?.email?.split("@")[0]}
              </p>
            </div>
            <span style={{ color: "#9b9aa3" }}>→</span>
          </a>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Mobile top bar — only on mobile ── */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-3 items-center justify-between glass-strong"
        style={{ borderBottom: "1px solid var(--line)" }}>
        <Logo size="xs" showTagline={false} />
        <div className="flex items-center gap-3">
          <a href="/profile" className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold font-display"
            style={{ background: "#1e1a2e", color: "#fff" }}>
            {session.user?.name?.[0]?.toUpperCase() ?? "U"}
          </a>
        </div>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "rgba(255,255,255,.96)",
          borderTop: "1px solid var(--line)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
        {[...NAV.slice(0, 4), { href: "/profile", icon: "◇", label: "Profile", desc: "" }].map(item => (
          <MobileNavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-screen"
        style={{
          marginLeft: 0,
          paddingTop: "56px",   /* mobile top bar height */
          paddingBottom: "72px", /* mobile bottom nav height */
        }}>
        {/* Override padding on desktop */}
        <style>{`
          @media (min-width: 768px) {
            main { margin-left: 256px !important; padding-top: 0 !important; padding-bottom: 0 !important; }
          }
        `}</style>
        <div className="page-enter">{children}</div>
      </main>
    </div>
  );
}
