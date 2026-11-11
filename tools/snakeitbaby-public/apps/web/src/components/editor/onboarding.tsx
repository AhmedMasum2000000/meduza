"use client";
import { useLocalStorage } from "@/services/storage/use-local-storage";
import { Button } from "../ui/button";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "../ui/dialog";
export function Onboarding() {
    const [seen, setSeen] = useLocalStorage({key: "hasSeenOnboarding", defaultValue: false});
    return <Dialog open={!seen} onOpenChange={() => setSeen({value:true})}>
        <DialogContent><DialogTitle>snakeitbaby</DialogTitle><DialogBody>
            <p className="mb-4">Import footage with Import in the Media panel. Drag media onto the timeline, trim it, and add text or sound. Export downloads the finished video.</p>
            <p className="mb-4 text-muted-foreground">Projects save in this browser profile. Keep using this browser to reopen them.</p>
            <Button onClick={() => setSeen({value:true})}>Start editing</Button>
        </DialogBody></DialogContent>
    </Dialog>;
}
