import { Link } from "@tanstack/react-router";

export function Shell({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-card md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src="/meduza-logo.jpg" alt="Meduza" className="h-7 w-auto" />
        </div>
        <nav className="flex flex-col gap-1 px-3">
          <Link to="/" className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium">Studio</Link>
          <Link to="/home" className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium">Home</Link>
        </nav>
      </aside>
      <div className="md:pl-60">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-card px-3 py-2 md:hidden">
          <img src="/meduza-logo.jpg" alt="Meduza" className="h-6 w-auto" />
        </div>
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
