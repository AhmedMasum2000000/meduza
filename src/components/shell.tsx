import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Clapperboard, Home, Plus, Scissors, Search, Lightbulb, BarChart3, Building2, Share2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCutStore } from "@/lib/cut-store";

export function Shell({ crumb, children }: { crumb: string; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projects = useCutStore((s) => s.projects);
  const latest = projects[0]?.id ?? "new";
  const [searchOpen, setSearchOpen] = useState(false);
  const cutting = projects.some((p) => p.status === "cutting");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = [
    { to: "/home", label: "Home", icon: Home, active: pathname === "/home" },
    { to: "/", label: "Studio", icon: Plus, active: pathname === "/" },
    {
      to: "/editor/$projectId",
      params: { projectId: latest },
      label: "Editor",
      icon: Scissors,
      active: pathname.startsWith("/editor"),
    },
    { to: "/videos", label: "My videos", icon: Clapperboard, active: pathname === "/videos" },
    { to: "/content-ideas", label: "Content Ideas", icon: Lightbulb, active: pathname === "/content-ideas" },
    { to: "/analytics", label: "Analytics", icon: BarChart3, active: pathname === "/analytics" },
    { to: "/brands", label: "Brands Dashboard", icon: Building2, active: pathname === "/brands" },
    { to: "/social", label: "Social Media Control Panel", icon: Share2, active: pathname === "/social" },
  ] as const;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-card md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src="/meduza-logo.svg" alt="Meduza" className="h-7 w-auto logo-glow" />
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              params={"params" in item ? item.params : undefined}
              className={`nav-item flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium ${
                item.active ? "active bg-paper text-ink" : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className={`status-dot size-2 rounded-full ${cutting ? "bg-blue working" : "bg-good"}`} />
            {cutting ? "Cutting" : "Studio"}
          </span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl px-2 text-sm text-muted hover:bg-paper hover:text-ink"
          >
            <Search className="size-4" />
            Search
            <kbd className="rounded-md border border-line px-1.5 py-0.5 text-xs">K</kbd>
          </button>
        </div>
      </aside>

      <div className="md:pl-60">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-card px-3 py-2 md:hidden">
          <img src="/meduza-logo.svg" alt="Meduza" className="h-6 w-auto logo-glow" />
        </div>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
