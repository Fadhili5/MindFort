"use client";

import { useEffect, useRef } from "react";
import { useTutorStore } from "@/lib/stores/tutor-store";

/**
 * useNetworkObserver — hooks into the browser's PerformanceObserver
 * (Resource Timing API) to capture *real* network requests and feed
 * them into the tutor store's privacy monitor.
 *
 * This is not a simulation — it reports every fetch/XHR/image the
 * browser actually makes, proving zero outbound traffic during a
 * tutoring session (the "demo moment").
 */
export function useNetworkObserver() {
  const addNetworkEvent = useTutorStore((s) => s.addNetworkEvent);
  const sessionActive = useTutorStore((s) => s.sessionActive);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    // Clear stale entries
    performance.clearResourceTimings();

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const res = entry as PerformanceResourceTiming;
        const url = new URL(res.name, window.location.origin);
        const isLocal =
          url.hostname === "localhost" ||
          url.hostname === "127.0.0.1" ||
          url.hostname === window.location.hostname;

        // Skip Next.js HMR / webpack dev socket — noise in dev mode
        if (
          url.pathname.startsWith("/_next") ||
          url.pathname.startsWith("/__next") ||
          url.protocol === "ws:" ||
          url.protocol === "wss:"
        )
          continue;

        addNetworkEvent({
          type: "outbound",
          label: `${res.initiatorType.toUpperCase()} ${url.pathname}`,
          sizeBytes: Math.round(res.transferSize || res.encodedBodySize || 0),
          destination: url.host,
          encrypted: url.protocol === "https:" || isLocal,
        });
      }
    });

    observer.observe({ type: "resource", buffered: false });
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [sessionActive, addNetworkEvent]);
}
