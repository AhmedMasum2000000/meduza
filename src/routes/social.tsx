import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/social")({
  component: function Page() {
    return (
      <Shell crumb="MEDUZA / SOCIAL MEDIA CONTROL PANEL">
        <ComingSoon title="Social Media Control Panel" />
      </Shell>
    );
  },
});
