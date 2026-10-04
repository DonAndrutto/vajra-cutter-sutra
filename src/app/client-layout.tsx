
"use client";

import { useAppContext } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster"
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const ThemedBody = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useAppContext();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
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
