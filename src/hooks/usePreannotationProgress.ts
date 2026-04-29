import { useEffect } from "react";
import { useTaskPreannotationStore } from "@/stores/useTaskPreannotationStore";

/**
 * Simulates the backend preannotation worker by ticking forward every 2 seconds.
 * In a real product this state would be driven by server-sent events or polling.
 * Safe to mount multiple times — Zustand state is shared across hook instances.
 */
export function usePreannotationProgress(intervalMs = 2000) {
  const tick = useTaskPreannotationStore((s) => s.tick);

  useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [tick, intervalMs]);
}
