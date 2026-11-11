import { publicPath } from "@/site/public-path";
import Image from "next/image";
import Link from "next/link";

export function MeduzaNavigation() {
    return <nav aria-label="snakeitbaby workspace" className="flex flex-wrap items-center gap-4 border-b px-8 py-3 text-sm">
        <a href={publicPath("/")} className="flex items-center gap-2 font-bold tracking-wide">
            <Image src={publicPath("/meduza.png")} alt="" width={28} height={28} /> snakeitbaby
        </a>
        <Link href="/projects">Projects</Link>
        <Link href="/about" className="ml-auto text-muted-foreground">About</Link>
    </nav>;
}
