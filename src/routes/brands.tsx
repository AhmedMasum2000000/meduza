import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/brands")({
  component: function Page() {
    return (
      <Shell crumb="MEDUZA / BRANDS DASHBOARD">
        <ComingSoon title="Brands Dashboard" />
      </Shell>
    );
  },
});
