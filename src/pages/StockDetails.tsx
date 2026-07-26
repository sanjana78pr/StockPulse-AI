import { useState } from 'react';
import Plot from 'react-plotly.js';
import { generateStockData } from '../lib/mockData';
import KPICard from '../components/shared/KPICard';
import { Activity, Target, ShieldAlert, TrendingUp } from 'lucide-react';

export default function StockDetails() {
  const [symbol] = useState('AAPL');
  const [data] = useState(() => generateStockData(100, 175, 0.015));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-100">{symbol} - Apple Inc.</h1>
          <p className="text-gray-400 mt-1">Technology • Consumer Electronics</p>
        </div>
        <div className="flex items-end gap-3 text-right">
          <div>
            <div className="text-3xl font-bold text-gray-100">${data[data.length - 1].close.toFixed(2)}</div>
            <div className="text-sm font-medium text-market-up">+$2.45 (1.42%) Today</div>
          </div>
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Trade
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Price Action (100 Days)</h2>
          <div className="flex gap-2">
            {['1D', '1W', '1M', '3M', '1Y'].map(tf => (
              <button key={tf} className="px-3 py-1 text-xs font-medium rounded-md bg-white/5 hover:bg-white/10 text-gray-300 transition-colors">
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <Plot
            data={[
              {
                x: data.map(d => d.date),
                open: data.map(d => d.open),
                high: data.map(d => d.high),
                low: data.map(d => d.low),
                close: data.map(d => d.close),
                type: 'candlestick',
                name: symbol,
                increasing: { line: { color: '#22c55e' } },
                decreasing: { line: { color: '#ef4444' } }
              }
            ]}
            layout={{
              autosize: true,
              margin: { t: 10, r: 40, l: 40, b: 30 },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              xaxis: { 
                showgrid: false, 
                rangeslider: { visible: false },
                color: '#6b7280'
              },
              yaxis: { 
                showgrid: true, 
                gridcolor: '#1f2937', 
                color: '#6b7280',
                side: 'right'
              }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Market Cap" value="2.64T" prefix="$" icon={<Activity className="w-5 h-5" />} />
        <KPICard title="P/E Ratio" value="28.4" icon={<Target className="w-5 h-5" />} />
        <KPICard title="Dividend Yield" value="0.55" suffix="%" icon={<TrendingUp className="w-5 h-5" />} />
        <KPICard title="Beta (5Y Monthly)" value="1.12" icon={<ShieldAlert className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Profile */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Company Profile</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also sells various related services. In addition, the company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">CEO</span>
              <span className="text-gray-200">Tim Cook</span>
            </div>
            <div>
              <span className="text-gray-500 block">Founded</span>
              <span className="text-gray-200">1976</span>
            </div>
            <div>
              <span className="text-gray-500 block">Employees</span>
              <span className="text-gray-200">161,000</span>
            </div>
            <div>
              <span className="text-gray-500 block">Headquarters</span>
              <span className="text-gray-200">Cupertino, CA</span>
            </div>
          </div>
        </div>

        {/* Analyst Ratings */}
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">Analyst Ratings</h2>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-market-up flex items-center justify-center flex-col shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <span className="text-2xl font-bold text-market-up">85%</span>
              <span className="text-xs text-gray-400">BUY</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center text-sm">
                <span className="w-12 text-gray-400">Buy</span>
                <div className="flex-1 h-2 bg-black/40 rounded-full mx-3 overflow-hidden">
                  <div className="h-full bg-market-up rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="w-8 text-right text-gray-200">34</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-12 text-gray-400">Hold</span>
                <div className="flex-1 h-2 bg-black/40 rounded-full mx-3 overflow-hidden">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <span className="w-8 text-right text-gray-200">4</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="w-12 text-gray-400">Sell</span>
                <div className="flex-1 h-2 bg-black/40 rounded-full mx-3 overflow-hidden">
                  <div className="h-full bg-market-down rounded-full" style={{ width: '5%' }}></div>
                </div>
                <span className="w-8 text-right text-gray-200">2</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
            <Target className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-100">AI Consensus: Strong Buy</h4>
              <p className="text-xs text-blue-300/80 mt-1">Based on quantitative modeling, institutional sentiment, and recent earnings momentum.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}