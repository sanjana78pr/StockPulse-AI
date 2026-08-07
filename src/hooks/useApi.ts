/**
 * useApi — generic data-fetching hook.
 *
 * Eliminates boilerplate loading/error/data state in every page.
 *
 * Usage:
 *   const { data, loading, error, refetch } =
 *     useApi(() => stockService.listStocks({ page: 1 }), []);
 *
 * - Re-runs whenever `deps` change (works like useEffect deps).
 * - `refetch()` re-runs the fetch manually without changing deps.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../types/api';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch(): void;
}

export function useApi<T>(
  fn: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[],
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Increment to trigger a manual refetch
  const [tick, setTick] = useState(0);

  // Keep fn in a ref so changes to it don't re-trigger the effect
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fnRef
      .current()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'An unexpected error occurred.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, refetch };
}
