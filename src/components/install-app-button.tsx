"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

/** Chrome's install event, captured in layout.tsx before hydration. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __vcsInstallPrompt?: InstallPromptEvent;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS reports installed web apps through its own non-standard flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ presents itself as a Mac; the touch point count gives it away.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

export default function InstallAppButton() {
  const isMobile = useIsMobile();
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [needsIosHelp, setNeedsIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    // Safari never fires `beforeinstallprompt`, so iOS is told how to install
    // by hand instead.
    if (isIos()) {
      setNeedsIosHelp(true);
      return;
    }

    setPrompt(window.__vcsInstallPrompt ?? null);

    const onAvailable = () => setPrompt(window.__vcsInstallPrompt ?? null);
    const onInstalled = () => {
      window.__vcsInstallPrompt = undefined;
      setPrompt(null);
    };

    window.addEventListener("vcs:installprompt", onAvailable);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("vcs:installprompt", onAvailable);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // A prompt can only be shown once.
    window.__vcsInstallPrompt = undefined;
    setPrompt(null);
  };

  if (!prompt && !needsIosHelp) return null;

  return (
    <>
      <Button
        variant="ghost"
        size={isMobile ? "icon" : "sm"}
        className={`font-sans text-primary h-9 shrink-0 ${isMobile ? "w-9" : "px-3"}`}
        onClick={() => (needsIosHelp ? setShowIosHelp(true) : install())}
        aria-label="Install app"
        title="Install for offline reading"
      >
        <Download className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
        {!isMobile && <span>Install</span>}
      </Button>

      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="sm:max-w-[425px] font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">Add to Home Screen</DialogTitle>
            <DialogDescription>
              Install the reader on this device to open it from your home screen and use it
              without a connection.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 py-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Share className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Tap the <strong className="text-foreground">Share</strong> button in the Safari
                toolbar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-4 shrink-0 text-center text-primary">2</span>
              <span>
                Choose <strong className="text-foreground">Add to Home Screen</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 w-4 shrink-0 text-center text-primary">3</span>
              <span>
                Tap <strong className="text-foreground">Add</strong>. The sutra icon appears
                alongside your other apps.
              </span>
            </li>
          </ol>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowIosHelp(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
