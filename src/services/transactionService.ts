import { api } from '../lib/api';
import type {
  TransactionResponse,
  TransactionListResponse,
  TransactionCreate,
  TransactionListParams,
} from '../types/api';

function buildQuery(params: Record<string, unknown>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : '';
}

export async function createTransaction(data: TransactionCreate): Promise<TransactionResponse> {
  return api.post<TransactionResponse>('/transactions/', data);
}

export async function listMyTransactions(
  params: TransactionListParams = {},
): Promise<TransactionListResponse> {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    sort_by: params.sort_by ?? 'transaction_date',
    sort_order: params.sort_order ?? 'desc',
    ...(params.transaction_type ? { transaction_type: params.transaction_type } : {}),
    ...(params.search ? { search: params.search } : {}),
  });
  return api.get<TransactionListResponse>(`/transactions/my${query}`);
}

export async function listPortfolioTransactions(
  portfolioId: string,
  params: TransactionListParams = {},
): Promise<TransactionListResponse> {
  const query = buildQuery({
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    sort_by: params.sort_by ?? 'transaction_date',
    sort_order: params.sort_order ?? 'desc',
    ...(params.transaction_type ? { transaction_type: params.transaction_type } : {}),
    ...(params.search ? { search: params.search } : {}),
  });
  return api.get<TransactionListResponse>(
    `/transactions/portfolio/${portfolioId}${query}`,
  );
}

export async function getTransaction(id: string): Promise<TransactionResponse> {
  return api.get<TransactionResponse>(`/transactions/${id}`);
}
