import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Plot from 'react-plotly.js';
import KPICard from '../components/shared/KPICard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import { Activity, Target, ShieldAlert, TrendingUp, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useMarketSummary } from '../hooks/useMarketSummary';
import * as historicalService from '../services/historicalService';
import { generateStockData } from '../lib/mockData';

const DEFAULT_SYMBOL = 'AAPL';

export default function StockDetails() {
  const [searchParams, setSearchParams] = useSearchParams();
  const symbol = (searchParams.get('symbol') ?? DEFAULT_SYMBOL).toUpperCase();
  const [symbolInput, setSymbolInput] = useState(symbol);

  // Historical prices (with slower polling for chart updates)
  const {
    data: historicalData,
    loading: histLoading,
    error: histError,
    refetch: histRefetch,
  } = useApi(
    () => historicalService.getHistoricalPrices(symbol, '1d', 120),
    [symbol],
  );

  // Live market summary with automatic polling
  const {
    summary,
    error: summaryError,
    loading: summaryLoading,
    refreshSummary,
    clearError,
  } = useMarketSummary(symbol, {
    quoteInterval: 5000, // Update quote every 5 seconds
    summaryInterval: 60000, // Full refresh every 60 seconds
    enabled: true,
  });

  const handleSymbolSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = symbolInput.trim().toUpperCase();
    if (cleaned && cleaned !== symbol) {
      setSearchParams({ symbol: cleaned });
    }
  }, [symbolInput, symbol, setSearchParams]);

  const handleRetry = useCallback(() => {
    clearError();
    refreshSummary();
    histRefetch();
  }, [clearError, refreshSummary, histRefetch]);

  // Chart data processing
  const chartData = useMemo(() => {
    const hasLiveHistory = historicalData && historicalData.data.length > 0;
    const mockFallback = generateStockData(100, 175, 0.015);

    return {
      hasLive: hasLiveHistory,
      dates: hasLiveHistory
        ? historicalData!.data.map((d) => d.date.split('T')[0])
        : mockFallback.map((d) => d.date),
      open: hasLiveHistory
        ? historicalData!.data.map((d) => d.open_price)
        : mockFallback.map((d) => d.open),
      high: hasLiveHistory
        ? historicalData!.data.map((d) => d.high_price)
        : mockFallback.map((d) => d.high),
      low: hasLiveHistory
        ? historicalData!.data.map((d) => d.low_price)
        : mockFallback.map((d) => d.low),
      close: hasLiveHistory
        ? historicalData!.data.map((d) => d.close_price)
        : mockFallback.map((d) => d.close),
    };
  }, [historicalData]);
  const latestPrice = summary?.quote?.price ?? (chartData.close.length > 0 ? chartData.close[chartData.close.length - 1] : null);
  const companyName = summary?.company_info?.company_name ?? symbol;
  const sector = summary?.company_info?.sector ?? '';
  const industry = summary?.company_info?.industry ?? '';

  // Price change calculation
  const priceChange = useMemo(() => {
    if (!summary?.quote || !summary.quote.previous_close) return null;
    
    const current = summary.quote.price;
    const previous = summary.quote.previous_close;
    const change = current - previous;
    const changePercent = (change / previous) * 100;
    
    return { change, changePercent };
  }, [summary?.quote]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-gray-100">
              {symbol} {companyName !== symbol ? `— ${companyName}` : ''}
            </h1>
            {summary && !summaryError && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            )}
            {summaryError && (
              <button
                onClick={clearError}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                title={summaryError}
              >
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400">Offline</span>
              </button>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            {[sector, industry].filter(Boolean).join(' • ') || 'Stock Details'}
          </p>
        </div>
        <div className="flex items-end gap-3">
          {/* Symbol search */}
          <form onSubmit={handleSymbolSearch} className="flex gap-2">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="Symbol (e.g. TSLA)"
              className="w-32 bg-black/40 border border-border/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go
            </button>
          </form>

          {/* Manual refresh button */}
          <button
            onClick={handleRetry}
            disabled={summaryLoading}
            className="p-2 bg-white/5 hover:bg-white/10 border border-border/50 rounded-lg text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Price display */}
          {latestPrice != null && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-100">${latestPrice.toFixed(2)}</div>
              {priceChange && (
                <div
                  className={`text-sm font-medium ${
                    priceChange.change >= 0 ? 'text-market-up' : 'text-market-down'
                  }`}
                >
                  {priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)} (
                  {priceChange.change >= 0 ? '+' : ''}{priceChange.changePercent.toFixed(2)}%)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {summaryError && (
        <div className="glass-panel rounded-xl p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Live data unavailable</p>
                <p className="text-gray-400 text-sm">{summaryError}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md text-sm transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-200">Price Action</h2>
            {histLoading && (
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            )}
            {!histLoading && !chartData.hasLive && (
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-border/30">
                {histError ? 'Live data unavailable — showing demo' : 'No historical data — showing demo'}
              </span>
            )}
            {chartData.hasLive && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                Live data · {historicalData!.data.length} records
              </span>
            )}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <Plot
            data={[
              {
                x: chartData.dates,
                open: chartData.open,
                high: chartData.high,
                low: chartData.low,
                close: chartData.close,
                type: 'candlestick',
                name: symbol,
                increasing: { line: { color: '#22c55e' } },
                decreasing: { line: { color: '#ef4444' } },
              },
            ]}
            layout={{
              autosize: true,
              margin: { t: 10, r: 40, l: 40, b: 30 },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              xaxis: {
                showgrid: false,
                rangeslider: { visible: false },
                color: '#6b7280',
              },
              yaxis: {
                showgrid: true,
                gridcolor: '#1f2937',
                color: '#6b7280',
                side: 'right',
              },
            }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      {summaryLoading ? (
        <LoadingSpinner message="Loading market data…" />
      ) : summaryError ? (
        <ErrorMessage message={summaryError} onRetry={handleRetry} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Market Cap"
            value={
              summary?.statistics?.market_cap != null
                ? summary.statistics.market_cap >= 1e12
                  ? `${(summary.statistics.market_cap / 1e12).toFixed(2)}T`
                  : `${(summary.statistics.market_cap / 1e9).toFixed(2)}B`
                : '—'
            }
            prefix="$"
            icon={<Activity className="w-5 h-5" />}
          />
          <KPICard
            title="P/E Ratio"
            value={summary?.statistics?.pe_ratio?.toFixed(2) ?? '—'}
            icon={<Target className="w-5 h-5" />}
          />
          <KPICard
            title="Dividend Yield"
            value={
              summary?.statistics?.dividend_yield != null
                ? (summary.statistics.dividend_yield * 100).toFixed(2)
                : '—'
            }
            suffix="%"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title="Beta (5Y)"
            value={summary?.statistics?.beta?.toFixed(2) ?? '—'}
            icon={<ShieldAlert className="w-5 h-5" />}
          />
        </div>
      )}

      {/* Company Profile & Live Quote */}
      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-xl p-5">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Company Profile</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {summary.company_info.exchange && (
                <div>
                  <span className="text-gray-500 block">Exchange</span>
                  <span className="text-gray-200">{summary.company_info.exchange}</span>
                </div>
              )}
              {summary.company_info.currency && (
                <div>
                  <span className="text-gray-500 block">Currency</span>
                  <span className="text-gray-200">{summary.company_info.currency}</span>
                </div>
              )}
              {summary.company_info.sector && (
                <div>
                  <span className="text-gray-500 block">Sector</span>
                  <span className="text-gray-200">{summary.company_info.sector}</span>
                </div>
              )}
              {summary.company_info.industry && (
                <div>
                  <span className="text-gray-500 block">Industry</span>
                  <span className="text-gray-200">{summary.company_info.industry}</span>
                </div>
              )}
              {summary.company_info.country && (
                <div>
                  <span className="text-gray-500 block">Country</span>
                  <span className="text-gray-200">{summary.company_info.country}</span>
                </div>
              )}
              {summary.statistics?.fifty_two_week_high != null && (
                <div>
                  <span className="text-gray-500 block">52W High</span>
                  <span className="text-market-up font-medium">
                    ${summary.statistics.fifty_two_week_high.toFixed(2)}
                  </span>
                </div>
              )}
              {summary.statistics?.fifty_two_week_low != null && (
                <div>
                  <span className="text-gray-500 block">52W Low</span>
                  <span className="text-market-down font-medium">
                    ${summary.statistics.fifty_two_week_low.toFixed(2)}
                  </span>
                </div>
              )}
              {summary.statistics?.average_volume != null && (
                <div>
                  <span className="text-gray-500 block">Avg Volume</span>
                  <span className="text-gray-200">
                    {(summary.statistics.average_volume / 1e6).toFixed(2)}M
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Quote */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Live Quote</h2>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <Wifi className="w-4 h-4" />
                <span>Auto-refresh 5s</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Open</span>
                <span className="text-gray-200">
                  {summary.quote.open != null ? `$${summary.quote.open.toFixed(2)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Prev Close</span>
                <span className="text-gray-200">
                  {summary.quote.previous_close != null
                    ? `$${summary.quote.previous_close.toFixed(2)}`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Day High</span>
                <span className="text-market-up font-medium">
                  {summary.quote.high != null ? `$${summary.quote.high.toFixed(2)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Day Low</span>
                <span className="text-market-down font-medium">
                  {summary.quote.low != null ? `$${summary.quote.low.toFixed(2)}` : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Volume</span>
                <span className="text-gray-200">
                  {summary.quote.volume != null
                    ? `${(summary.quote.volume / 1e6).toFixed(2)}M`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Provider</span>
                <span className="text-gray-400 text-xs">{summary.quote.provider}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
