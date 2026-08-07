import KPICard from '../components/shared/KPICard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { majorIndices, latestNews } from '../lib/mockData';
import { LineChart, Wallet, Activity, TrendingUp, DollarSign } from 'lucide-react';
import Plot from 'react-plotly.js';
import { useApi } from '../hooks/useApi';
import * as portfolioService from '../services/portfolioService';
import * as stockService from '../services/stockService';

export default function Dashboard() {
  const { data: portfolioData, loading: portfolioLoading } = useApi(
    () => portfolioService.listPortfolios({ page_size: 10 }),
    [],
  );

  const { data: stockData, loading: stockLoading } = useApi(
    () => stockService.listStocks({ page_size: 10, sort_by: 'current_price', sort_order: 'desc' }),
    [],
  );

  const portfolio = portfolioData?.portfolios?.find((p) => p.is_default) ?? portfolioData?.portfolios?.[0];
  const topStocks = stockData?.stocks?.filter((s) => s.current_price != null).slice(0, 4) ?? [];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Market Overview</h1>
        <p className="text-gray-400 mt-1">Your portfolio and global market summary.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioLoading ? (
          <div className="lg:col-span-2 flex items-center justify-center py-8">
            <LoadingSpinner message="Loading portfolio…" />
          </div>
        ) : portfolio ? (
          <>
            <KPICard
              title="Portfolio Value"
              value={portfolio.current_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              prefix="$"
              change={parseFloat(portfolio.total_profit_loss_percentage.toFixed(2))}
              icon={<Wallet className="w-5 h-5" />}
            />
            <KPICard
              title="Total P&L"
              value={Math.abs(portfolio.total_profit_loss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              prefix={portfolio.total_profit_loss >= 0 ? '+$' : '-$'}
              change={parseFloat(portfolio.total_profit_loss_percentage.toFixed(2))}
              icon={<Activity className="w-5 h-5" />}
            />
          </>
        ) : (
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-gray-300 font-medium">No portfolio yet</p>
              <p className="text-gray-500 text-sm">Create one via the Transactions page.</p>
            </div>
          </div>
        )}

        <KPICard
          title="S&P 500"
          value={majorIndices.find((i) => i.symbol === 'S&P 500')?.value.toLocaleString('en-US') ?? 0}
          change={majorIndices.find((i) => i.symbol === 'S&P 500')?.changePercent}
          icon={<LineChart className="w-5 h-5" />}
        />
        <KPICard
          title="NASDAQ"
          value={majorIndices.find((i) => i.symbol === 'NASDAQ')?.value.toLocaleString('en-US') ?? 0}
          change={majorIndices.find((i) => i.symbol === 'NASDAQ')?.changePercent}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Indices Chart (mock — no real-time index endpoint) */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Market Indices Comparison</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-border/30">
              Demo data
            </span>
          </div>
          <div className="h-[300px] w-full">
            <Plot
              data={[
                {
                  x: majorIndices[0].chart.map((c) => c.date),
                  y: majorIndices[0].chart.map((c) => c.close),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'S&P 500',
                  line: { color: '#3b82f6', width: 2 },
                },
                {
                  x: majorIndices[1].chart.map((c) => c.date),
                  y: majorIndices[1].chart.map((c) => c.close),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'NASDAQ',
                  line: { color: '#8b5cf6', width: 2 },
                },
              ]}
              layout={{
                autosize: true,
                margin: { t: 10, r: 10, l: 40, b: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { showgrid: false, zeroline: false, color: '#6b7280' },
                yaxis: { showgrid: true, gridcolor: '#1f2937', zeroline: false, color: '#6b7280' },
                legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } },
              }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Top Stocks by Price (live) */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">
            {stockLoading ? 'Loading Stocks…' : 'Top Stocks by Price'}
          </h2>
          {stockLoading ? (
            <LoadingSpinner message="" />
          ) : topStocks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No stocks available yet.</p>
          ) : (
            <div className="space-y-4">
              {topStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-gray-200">{stock.symbol}</div>
                    <div className="text-xs text-gray-500 truncate w-36">{stock.company_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-200">
                      ${stock.current_price!.toFixed(2)}
                    </div>
                    {stock.sector && (
                      <div className="text-xs text-gray-500">{stock.sector}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest News (mock — no news endpoint) */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Market News</h2>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-border/30">
            Demo data
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestNews.map((news) => (
            <div
              key={news.id}
              className="glass-panel rounded-xl p-4 hover:-translate-y-1 transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-blue-400">{news.source}</span>
                <span className="text-xs text-gray-500">{news.time}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-300 line-clamp-2">{news.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
