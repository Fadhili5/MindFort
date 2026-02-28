export interface NetworkMetric {
  name: string;
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  startTime: number;
  duration: number;
}

export function observeNetworkTraffic(onEvent: (event: NetworkMetric) => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType !== "resource") {
        continue;
      }
      const resource = entry as PerformanceResourceTiming;
      onEvent({
        name: resource.name,
        initiatorType: resource.initiatorType,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        startTime: resource.startTime,
        duration: resource.duration
      });
    }
  });

  observer.observe({ entryTypes: ["resource"] });

  return () => {
    observer.disconnect();
  };
}
