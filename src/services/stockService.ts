import { api } from '../lib/api';
import type { StockListResponse, StockListParams, StockResponse, StockExternalSearchResponse } from '../types/api';

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : '';
}

export async function listStocks(params: StockListParams = {}): Promise<StockListResponse> {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
    sort_by: params.sort_by ?? 'symbol',
    sort_order: params.sort_order ?? 'asc',
    ...(params.search ? { search: params.search } : {}),
    ...(params.sector ? { sector: params.sector } : {}),
    ...(params.industry ? { industry: params.industry } : {}),
    ...(params.exchange ? { exchange: params.exchange } : {}),
    ...(params.is_active !== undefined ? { is_active: params.is_active } : {}),
  });
  return api.get<StockListResponse>(`/stocks/${query}`);
}

export async function getStockBySymbol(symbol: string): Promise<StockResponse> {
  return api.get<StockResponse>(`/stocks/symbol/${encodeURIComponent(symbol.toUpperCase())}`);
}

export async function getStockById(id: string): Promise<StockResponse> {
  return api.get<StockResponse>(`/stocks/${id}`);
}

export async function searchExternalStocks(q: string): Promise<StockExternalSearchResponse[]> {
  return api.get<StockExternalSearchResponse[]>(`/stocks/search/external?q=${encodeURIComponent(q)}`);
}

export async function createStock(stock: { symbol: string }): Promise<StockResponse> {
  return api.post<StockResponse>('/stocks/', { symbol: stock.symbol.toUpperCase() });
}

