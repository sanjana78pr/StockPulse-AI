import { api } from '../lib/api';
import type {
  PortfolioResponse,
  PortfolioListResponse,
  PortfolioCreate,
  PortfolioUpdate,
  PaginatedParams,
} from '../types/api';

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : '';
}

export async function listPortfolios(params: PaginatedParams = {}): Promise<PortfolioListResponse> {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 50,
    sort_by: params.sort_by ?? 'created_at',
    sort_order: params.sort_order ?? 'desc',
  });
  return api.get<PortfolioListResponse>(`/portfolios/${query}`);
}

export async function getPortfolio(id: string): Promise<PortfolioResponse> {
  return api.get<PortfolioResponse>(`/portfolios/${id}`);
}

export async function createPortfolio(data: PortfolioCreate): Promise<PortfolioResponse> {
  return api.post<PortfolioResponse>('/portfolios/', data);
}

export async function updatePortfolio(id: string, data: PortfolioUpdate): Promise<PortfolioResponse> {
  return api.patch<PortfolioResponse>(`/portfolios/${id}`, data);
}

export async function deletePortfolio(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/portfolios/${id}`);
}
