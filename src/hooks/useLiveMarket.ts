import { useState, useCallback, useRef, useEffect } from 'react';
import { usePolling } from './usePolling';
import * as liveMarketService from '../services/liveMarketService';
import { ApiError } from '../types/api';
import type { LiveMarketQuoteResponse } from '../types/api';

interface UseLiveMarketOptions {
  /** Polling interval in milliseconds */
  interval?: number;
  /** Whether polling should be enabled */
  enabled?: boolean;
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelay?: number;
}

interface UseLiveMarketReturn {
  quotes: Record<string, LiveMarketQuoteResponse>;
  errors: Record<string, string>;
  loading: Record<string, boolean>;
  fetchQuote: (symbol: string) => Promise<void>;
  clearError: (symbol: string) => void;
  clearAllErrors: () => void;
}

/**
 * Hook for managing live market data with polling, error handling, and retries.
 *
 * STABILITY FIX: `setLoading` and `setQuotes` are now guarded to skip updates
 * when the value has not actually changed. Previously, every poll cycle for N symbols
 * would emit 2N state updates (setLoading true → false per symbol), even when the
 * loading flag was already correct, causing N full re-renders of the parent component
 * on every 5-second interval.
 */
export function useLiveMarket(symbols: string[] = [], options: UseLiveMarketOptions = {}): UseLiveMarketReturn {
  const {
    interval = 5000, // 5 seconds
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [quotes, setQuotes] = useState<Record<string, LiveMarketQuoteResponse>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const retryCountRef = useRef<Record<string, number>>({});
  const pendingRequestsRef = useRef<Set<string>>(new Set());
  // Track pending retry timeouts so they can be cancelled on unmount
  const retryTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  // Guard against state updates after unmount
  const isMountedRef = useRef(true);

  // Set isMountedRef to false when the component unmounts and clear all pending retries
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel every pending retry timeout
      retryTimeoutsRef.current.forEach(id => clearTimeout(id));
      retryTimeoutsRef.current.clear();
    };
  }, []);

  const clearError = useCallback((symbol: string) => {
    // Only update state when the error actually exists.
    // Prevents a new object reference on every successful poll — which would
    // trigger a re-render even when nothing changed.
    setErrors(prev => {
      if (!(symbol in prev)) return prev; // no-op: same reference → no re-render
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const fetchQuote = useCallback(async (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();

    // Prevent duplicate requests for the same symbol
    if (pendingRequestsRef.current.has(upperSymbol)) {
      return;
    }

    pendingRequestsRef.current.add(upperSymbol);

    // STABILITY FIX: Only set loading=true if it isn't already true.
    // Avoids a state update (and re-render) on every poll cycle for symbols
    // that are already in a loading state or have existing data.
    setLoading(prev => {
      if (prev[upperSymbol] === true) return prev; // no-op
      return { ...prev, [upperSymbol]: true };
    });

    try {
      const quote = await liveMarketService.getLiveQuote(upperSymbol);

      // STABILITY FIX: Only update quotes when the price has actually changed.
      // Comparing price prevents unnecessary re-renders on every poll when market
      // is closed or prices are unchanged.
      if (isMountedRef.current) {
        setQuotes(prev => {
          const existing = prev[upperSymbol];
          if (existing && existing.price === quote.price) return prev; // no-op
          return { ...prev, [upperSymbol]: quote };
        });
      }

      clearError(upperSymbol);
      retryCountRef.current[upperSymbol] = 0;

    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : `Failed to fetch ${upperSymbol}`;
      const currentRetries = retryCountRef.current[upperSymbol] || 0;

      if (currentRetries < maxRetries) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, currentRetries);
        retryCountRef.current[upperSymbol] = currentRetries + 1;

        // Track the timeout ID so it can be cancelled on unmount
        const tid = setTimeout(() => {
          retryTimeoutsRef.current.delete(tid);
          if (isMountedRef.current && enabled) {
            fetchQuote(upperSymbol);
          }
        }, delay);
        retryTimeoutsRef.current.add(tid);
      } else {
        // Max retries reached, show error
        if (isMountedRef.current) {
          setErrors(prev => ({ ...prev, [upperSymbol]: errorMessage }));
        }
        retryCountRef.current[upperSymbol] = 0;
      }
    } finally {
      // STABILITY FIX: Only set loading=false if it is currently true.
      if (isMountedRef.current) {
        setLoading(prev => {
          if (prev[upperSymbol] === false || !(upperSymbol in prev)) return prev; // no-op
          return { ...prev, [upperSymbol]: false };
        });
      }
      pendingRequestsRef.current.delete(upperSymbol);
    }
  }, [enabled, maxRetries, retryDelay, clearError]);

  const fetchAllQuotes = useCallback(async () => {
    const promises = symbols.map(symbol => fetchQuote(symbol));
    await Promise.all(promises);
  }, [symbols, fetchQuote]);

  // Set up polling
  usePolling(fetchAllQuotes, {
    interval,
    enabled: enabled && symbols.length > 0,
    pauseOnHidden: true,
  });

  return {
    quotes,
    errors,
    loading,
    fetchQuote,
    clearError,
    clearAllErrors,
  };
}