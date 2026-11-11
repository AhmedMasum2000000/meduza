import { publicPath } from "@/site/public-path";
import type { Metadata } from "next";
import { SITE_INFO, SITE_URL } from "@/site/brand";
export const baseMetaData: Metadata = {
    metadataBase: new URL(SITE_URL), title: SITE_INFO.title,
    description: SITE_INFO.description,
    robots: { index: false, follow: false },
    icons: { icon: publicPath("/meduza.png"), apple: publicPath("/meduza.png"), shortcut: publicPath("/meduza.png") },
    manifest: publicPath("/manifest.json"),
    appleWebApp: { capable: true, title: "snakeitbaby" },
};
