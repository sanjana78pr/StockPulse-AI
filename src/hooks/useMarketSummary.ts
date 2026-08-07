import { useState, useCallback, useRef } from 'react';
import { usePolling } from './usePolling';
import * as liveMarketService from '../services/liveMarketService';
import { ApiError } from '../types/api';
import type { MarketSummaryResponse } from '../types/api';

interface UseMarketSummaryOptions {
  /** Polling interval in milliseconds for quote data */
  quoteInterval?: number;
  /** Polling interval in milliseconds for chart/company data (slower) */
  summaryInterval?: number;
  /** Whether polling should be enabled */
  enabled?: boolean;
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
}

interface UseMarketSummaryReturn {
  summary: MarketSummaryResponse | null;
  error: string | null;
  loading: boolean;
  refreshSummary: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing market summary data with different polling intervals for different data types.
 *
 * STABILITY FIX: `pollFunction` no longer closes over `summary` state.
 * All mutable values (`summary`, `updateQuoteOnly`, `refreshSummary`) are accessed
 * through refs inside `pollFunction`, so its identity stays constant and doesn't
 * restart the interval on every state update.
 */
export function useMarketSummary(symbol: string, options: UseMarketSummaryOptions = {}): UseMarketSummaryReturn {
  const {
    quoteInterval = 5000, // 5 seconds for live quotes
    summaryInterval = 60000, // 60 seconds for full summary
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [summary, setSummary] = useState<MarketSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const retryCountRef = useRef(0);
  const pendingRequestRef = useRef(false);
  const lastQuoteUpdateRef = useRef(0);
  const lastSummaryUpdateRef = useRef(0);

  // Ref holding current summary so pollFunction never closes over the state variable.
  const summaryRef = useRef<MarketSummaryResponse | null>(null);
  summaryRef.current = summary;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateQuoteOnly = useCallback(async () => {
    if (!symbol || pendingRequestRef.current) return;

    try {
      const quote = await liveMarketService.getLiveQuote(symbol.toUpperCase());

      setSummary(prev => {
        if (!prev) return null;
        return {
          ...prev,
          quote,
        };
      });

      lastQuoteUpdateRef.current = Date.now();
      clearError();
      retryCountRef.current = 0;

    } catch (err) {
      // Don't show errors for quote-only updates unless it's the first load.
      // Read from ref to avoid stale closure over `summary`.
      if (!summaryRef.current) {
        const errorMessage = err instanceof ApiError ? err.message : `Failed to fetch ${symbol}`;
        setError(errorMessage);
      }
    }
    // Removed `summary` from deps — read via summaryRef.current instead.
    // This keeps `updateQuoteOnly` identity stable across summary state updates.
  }, [symbol, clearError]);

  const refreshSummary = useCallback(async () => {
    if (!symbol || pendingRequestRef.current) return;

    pendingRequestRef.current = true;
    setLoading(true);

    try {
      const newSummary = await liveMarketService.getMarketSummary(symbol.toUpperCase());

      setSummary(newSummary);
      lastSummaryUpdateRef.current = Date.now();
      lastQuoteUpdateRef.current = Date.now();
      clearError();
      retryCountRef.current = 0;

    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : `Failed to fetch ${symbol}`;
      const currentRetries = retryCountRef.current;

      if (currentRetries < maxRetries) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, currentRetries);
        retryCountRef.current = currentRetries + 1;

        setTimeout(() => {
          if (enabled) {
            refreshSummary();
          }
        }, delay);
      } else {
        // Max retries reached, show error
        setError(errorMessage);
        retryCountRef.current = 0;
      }
    } finally {
      setLoading(false);
      pendingRequestRef.current = false;
    }
  }, [symbol, enabled, maxRetries, retryDelay, clearError]);

  // Refs to stable versions of the fetch functions.
  // Updated every render without being deps of pollFunction.
  const refreshSummaryRef = useRef(refreshSummary);
  refreshSummaryRef.current = refreshSummary;
  const updateQuoteOnlyRef = useRef(updateQuoteOnly);
  updateQuoteOnlyRef.current = updateQuoteOnly;

  /**
   * pollFunction is STABLE — it has no dependencies that change at runtime.
   * All mutable values are accessed through refs.
   * This prevents the polling interval from restarting on every state update.
   */
  const pollFunction = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSummary = now - lastSummaryUpdateRef.current;
    const timeSinceLastQuote = now - lastQuoteUpdateRef.current;

    // If we haven't loaded initial data or it's time for a full refresh
    if (!summaryRef.current || timeSinceLastSummary >= summaryInterval) {
      refreshSummaryRef.current();
    }
    // Otherwise, just update the quote if needed
    else if (timeSinceLastQuote >= quoteInterval) {
      updateQuoteOnlyRef.current();
    }
    // No deps: all mutable values accessed through refs. This callback is created once.
  }, [quoteInterval, summaryInterval]);

  // Set up polling
  usePolling(pollFunction, {
    interval: Math.min(quoteInterval, 1000), // Check every second, but respect intervals internally
    enabled: enabled && !!symbol,
    pauseOnHidden: true,
  });

  return {
    summary,
    error,
    loading,
    refreshSummary,
    clearError,
  };
}