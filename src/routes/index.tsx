import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/")({
  component: function StudioPage() {
    return (
      <Shell crumb="MEDUZA / STUDIO">
        <div className="p-8">
          <h1 className="text-4xl font-semibold">Meduza Studio</h1>
          <p className="mt-2 text-muted">Your AI video editing workspace.</p>
          <img src="/meduza-logo.jpg" alt="Meduza" className="mt-8 h-16" />
        </div>
      </Shell>
    );
  },
});
