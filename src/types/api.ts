/**
 * TypeScript interfaces mirroring every backend Pydantic schema.
 * Keep in sync with backend/app/schemas/*.py
 */

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------
export interface PaginatedParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------
export interface StockResponse {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
  current_price: number | null;
  market_cap: number | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockListResponse {
  stocks: StockResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface StockListParams extends PaginatedParams {
  sector?: string;
  industry?: string;
  exchange?: string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface Holding {
  quantity: number;
  average_price: number;
}

export interface PortfolioResponse {
  id: string;
  user_id: string;
  portfolio_name: string;
  description: string | null;
  investment_goal: string | null;
  risk_level: RiskLevel | null;
  currency: string;
  initial_balance: number;
  current_value: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  is_default: boolean;
  // cash and holdings come from the DB but are not in PortfolioResponse schema —
  // they are internal fields. We expose them through a separate extended type
  // if needed (the API response uses PortfolioResponse which doesn't include them).
  created_at: string;
  updated_at: string;
}

export interface PortfolioListResponse {
  portfolios: PortfolioResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PortfolioCreate {
  portfolio_name: string;
  description?: string;
  investment_goal?: string;
  risk_level?: RiskLevel;
  currency?: string;
  initial_balance?: number;
  is_default?: boolean;
}

export interface PortfolioUpdate {
  portfolio_name?: string;
  description?: string;
  investment_goal?: string;
  risk_level?: RiskLevel;
  currency?: string;
  initial_balance?: number;
  is_default?: boolean;
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
export type TransactionType = 'BUY' | 'SELL';

export interface TransactionResponse {
  id: string;
  user_id: string;
  portfolio_id: string;
  stock_symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_share: number;
  total_amount: number;
  fees: number;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TransactionCreate {
  portfolio_id: string;
  stock_symbol: string;
  transaction_type: TransactionType;
  quantity: number;
  price_per_share: number;
  fees?: number;
  notes?: string;
  transaction_date?: string;
}

export interface TransactionListParams extends PaginatedParams {
  portfolio_id?: string;
  transaction_type?: TransactionType;
}

// ---------------------------------------------------------------------------
// Historical Prices
// ---------------------------------------------------------------------------
export type IntervalType = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1wk' | '1mo';

export interface HistoricalPriceResponse {
  id: string;
  stock_id: string;
  symbol: string;
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  adjusted_close: number;
  volume: number;
  source: string;
  interval: IntervalType;
  created_at: string;
  updated_at: string;
}

export interface HistoricalPriceListResponse {
  data: HistoricalPriceResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---------------------------------------------------------------------------
// Live Market
// ---------------------------------------------------------------------------
export interface LiveMarketQuoteResponse {
  symbol: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  previous_close: number | null;
  volume: number | null;
  timestamp: string;
  provider: string;
}

export interface CompanyInformationResponse {
  symbol: string;
  company_name: string | null;
  exchange: string | null;
  currency: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  provider: string;
}

export interface MarketStatisticsResponse {
  symbol: string;
  market_cap: number | null;
  average_volume: number | null;
  pe_ratio: number | null;
  dividend_yield: number | null;
  beta: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  provider: string;
}

export interface MarketSummaryResponse {
  quote: LiveMarketQuoteResponse;
  company_info: CompanyInformationResponse;
  statistics: MarketStatisticsResponse;
}

export interface StockExternalSearchResponse {
  symbol: string;
  company_name: string;
  exchange: string | null;
  country: string | null;
  quote_type: string | null;
}


// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}
