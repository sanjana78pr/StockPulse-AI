import { api } from '../lib/api';
import type { HistoricalPriceListResponse, IntervalType } from '../types/api';

export async function getHistoricalPrices(
  symbol: string,
  interval: IntervalType = '1d',
  limit = 120,
  startDate?: string,
  endDate?: string,
): Promise<HistoricalPriceListResponse> {
  const q = new URLSearchParams({
    interval,
    limit: String(limit),
  });
  if (startDate) q.set('start_date', startDate);
  if (endDate) q.set('end_date', endDate);

  return api.get<HistoricalPriceListResponse>(
    `/historical-prices/symbol/${encodeURIComponent(symbol.toUpperCase())}/range?${q.toString()}`,
  );
}
