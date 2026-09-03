"use client";

import { useEffect } from "react";

/**
 * Registers the offline worker in production, and clears any worker left over
 * from a production build when running `next dev`, where a cached shell would
 * otherwise shadow the code being edited.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Registration is blocked (private mode, unsupported context); the app
        // still works, it simply will not be available offline.
      });
    };

    // Registering after load keeps the worker's precache off the critical path.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
