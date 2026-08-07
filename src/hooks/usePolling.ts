import { useCallback, useEffect, useRef } from 'react';

interface UsePollingOptions {
  /** Polling interval in milliseconds */
  interval: number;
  /** Whether polling should be active */
  enabled?: boolean;
  /** Whether to pause polling when page is hidden */
  pauseOnHidden?: boolean;
}

/**
 * Custom hook for managing polling with proper cleanup and page visibility handling
 */
export function usePolling(callback: () => void | Promise<void>, options: UsePollingOptions) {
  const { interval, enabled = true, pauseOnHidden = true } = options;
  
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Update callback ref when it changes
  callbackRef.current = callback;

  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (!pauseOnHidden) return;

    if (document.hidden) {
      stopPolling();
    } else if (enabled) {
      startPolling();
    }
  }, [enabled, pauseOnHidden, startPolling, stopPolling]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [enabled, startPolling, stopPolling]);

  useEffect(() => {
    if (pauseOnHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [handleVisibilityChange, pauseOnHidden]);

  return { startPolling, stopPolling, isPolling: isPollingRef.current };
}