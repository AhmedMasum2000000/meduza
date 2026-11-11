"use client";
import { useLocalStorage } from "@/services/storage/use-local-storage";
import { Button } from "../ui/button";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "../ui/dialog";
export function Onboarding() {
    const [seen, setSeen] = useLocalStorage({key: "hasSeenOnboarding", defaultValue: false});
    return <Dialog open={!seen} onOpenChange={() => setSeen({value:true})}>
        <DialogContent><DialogTitle>snakeitbaby · Meduza</DialogTitle><DialogBody>
            <p className="mb-4">Import footage with Meduza library or Import. Drag media onto the timeline, trim it, and add text or sound. Export saves a video to your PC and, with Save to Meduza enabled, to your Exports library.</p>
            <p className="mb-4 text-muted-foreground">Projects save in this browser profile. Keep using this browser to reopen them.</p>
            <Button onClick={() => setSeen({value:true})}>Start editing</Button>
        </DialogBody></DialogContent>
    </Dialog>;
}
