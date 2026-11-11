
import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";
import path from "node:path";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/snakeitbaby";
const config: NextConfig = {
    output: "export",
    basePath,
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    trailingSlash: true,
    images: { unoptimized: true },
    turbopack: { root: path.resolve(process.cwd(), "../..") },
};
export default withContentCollections(config);

