import { api } from '../lib/api';
import type {
  LiveMarketQuoteResponse,
  CompanyInformationResponse,
  MarketStatisticsResponse,
  MarketSummaryResponse,
} from '../types/api';

export async function getLiveQuote(symbol: string): Promise<LiveMarketQuoteResponse> {
  return api.get<LiveMarketQuoteResponse>(
    `/live-market/${encodeURIComponent(symbol.toUpperCase())}`,
  );
}

export async function getCompanyInfo(symbol: string): Promise<CompanyInformationResponse> {
  return api.get<CompanyInformationResponse>(
    `/live-market/${encodeURIComponent(symbol.toUpperCase())}/company`,
  );
}

export async function getMarketStatistics(symbol: string): Promise<MarketStatisticsResponse> {
  return api.get<MarketStatisticsResponse>(
    `/live-market/${encodeURIComponent(symbol.toUpperCase())}/statistics`,
  );
}

export async function getMarketSummary(symbol: string): Promise<MarketSummaryResponse> {
  return api.get<MarketSummaryResponse>(
    `/live-market/${encodeURIComponent(symbol.toUpperCase())}/summary`,
  );
}
