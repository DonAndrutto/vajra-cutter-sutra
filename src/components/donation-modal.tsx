
"use client";

import { useAppContext } from "@/context/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DonationModal() {
  const { isDonationModalOpen, setIsDonationModalOpen } = useAppContext();

  return (
    <Dialog open={isDonationModalOpen} onOpenChange={setIsDonationModalOpen}>
      <DialogContent className="sm:max-w-[425px] font-sans">
        <DialogHeader>
          <DialogTitle className="font-sans">Support the Project</DialogTitle>
          <DialogDescription>
            If you find this application valuable, please consider supporting its continued development and maintenance.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Your contribution helps cover hosting costs and allows for new features and content to be added. Every little bit helps. Thank you for your generosity.
          </p>
        </div>
        <DialogFooter className="sm:justify-start gap-2">
            <Button asChild className="w-full">
                <a href="https://www.paypal.com/donate/?business=JZS5LVZKPPY5J&no_recurring=0&item_name=Help+fund+Dharma+translation+projects.&currency_code=USD" target="_blank" rel="noopener noreferrer">Donate Now</a>
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsDonationModalOpen(false)} className="w-full">
                Maybe Later
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
