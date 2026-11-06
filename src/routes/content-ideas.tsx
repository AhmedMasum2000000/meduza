import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/content-ideas")({
  component: function Page() {
    return (
      <Shell crumb="MEDUZA / CONTENT IDEAS">
        <ComingSoon title="Content Ideas" />
      </Shell>
    );
  },
});
