import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/analytics")({
  component: function Page() {
    return (
      <Shell crumb="MEDUZA / ANALYTICS">
        <ComingSoon title="Analytics" />
      </Shell>
    );
  },
});
