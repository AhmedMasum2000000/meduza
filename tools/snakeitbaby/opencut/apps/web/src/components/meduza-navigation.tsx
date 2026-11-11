import Image from "next/image";
import Link from "next/link";

export function MeduzaNavigation() {
    return <nav aria-label="Meduza workspace" className="flex flex-wrap items-center gap-4 border-b px-8 py-3 text-sm">
        <a href="http://127.0.0.1:18465/#/home" target="_top" className="flex items-center gap-2 font-bold tracking-wide">
            <Image src="/meduza.png" alt="" width={28} height={28} /> MEDUZA
        </a>
        <span className="font-semibold text-primary">snakeitbaby</span>
        <Link href="/projects">Projects</Link>
        <a href="http://127.0.0.1:18465/#/studio" target="_top">Media library</a>
        <a href="http://127.0.0.1:18465/#/videos" target="_top">Exports</a>
        <Link href="/about" className="ml-auto text-muted-foreground">About</Link>
    </nav>;
}
