import KPICard from '../components/shared/KPICard';
import { majorIndices, portfolioSummary, topGainers, latestNews } from '../lib/mockData';
import { LineChart, Wallet, Activity, TrendingUp } from 'lucide-react';
import Plot from 'react-plotly.js';

export default function Dashboard() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Market Overview</h1>
        <p className="text-gray-400 mt-1">Your portfolio and global market summary.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Portfolio Value" 
          value={portfolioSummary.totalValue.toLocaleString('en-US')} 
          prefix="$"
          change={portfolioSummary.dayChangePercent}
          icon={<Wallet className="w-5 h-5" />}
        />
        <KPICard 
          title="Day Return" 
          value={portfolioSummary.dayChange.toLocaleString('en-US')} 
          prefix="$"
          change={portfolioSummary.dayChangePercent}
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard 
          title="S&P 500" 
          value={majorIndices.find(i => i.symbol === 'S&P 500')?.value.toLocaleString('en-US') || 0}
          change={majorIndices.find(i => i.symbol === 'S&P 500')?.changePercent}
          icon={<LineChart className="w-5 h-5" />}
        />
        <KPICard 
          title="NASDAQ" 
          value={majorIndices.find(i => i.symbol === 'NASDAQ')?.value.toLocaleString('en-US') || 0}
          change={majorIndices.find(i => i.symbol === 'NASDAQ')?.changePercent}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Indices Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Market Indices Comparison</h2>
          <div className="h-[300px] w-full">
             <Plot
              data={[
                {
                  x: majorIndices[0].chart.map(c => c.date),
                  y: majorIndices[0].chart.map(c => c.close),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'S&P 500',
                  line: { color: '#3b82f6', width: 2 }
                },
                {
                  x: majorIndices[1].chart.map(c => c.date),
                  y: majorIndices[1].chart.map(c => c.close),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'NASDAQ',
                  line: { color: '#8b5cf6', width: 2 }
                }
              ]}
              layout={{
                autosize: true,
                margin: { t: 10, r: 10, l: 40, b: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { showgrid: false, zeroline: false, color: '#6b7280' },
                yaxis: { showgrid: true, gridcolor: '#1f2937', zeroline: false, color: '#6b7280' },
                legend: { orientation: 'h', y: -0.2, font: { color: '#9ca3af' } }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Top Gainers */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Top Gainers</h2>
          <div className="space-y-4">
            {topGainers.map(stock => (
              <div key={stock.symbol} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
                <div>
                  <div className="font-semibold text-gray-200">{stock.symbol}</div>
                  <div className="text-xs text-gray-500 truncate w-32">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-200">${stock.price.toFixed(2)}</div>
                  <div className="text-sm text-market-up">+{stock.changePercent}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest News */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Market News</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {latestNews.map(news => (
            <div key={news.id} className="glass-panel rounded-xl p-4 hover:-translate-y-1 transition-transform cursor-pointer">
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