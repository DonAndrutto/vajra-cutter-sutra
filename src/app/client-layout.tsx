
"use client";

import { useAppContext } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';

const ThemedBody = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppContext();
  return (
    <div className={cn("font-body antialiased", theme)}>
        {children}
        <Toaster />
    </div>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemedBody>{children}</ThemedBody>
  );
}
