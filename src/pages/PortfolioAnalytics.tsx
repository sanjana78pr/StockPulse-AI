import { portfolioSummary } from '../lib/mockData';
import KPICard from '../components/shared/KPICard';
import { PieChart, LineChart, Shield, Activity, TrendingUp, DollarSign } from 'lucide-react';
import Plot from 'react-plotly.js';

export default function PortfolioAnalytics() {
  const allocation = [
    { label: 'Technology', value: 45 },
    { label: 'Financials', value: 20 },
    { label: 'Healthcare', value: 15 },
    { label: 'Consumer', value: 10 },
    { label: 'Cash', value: 10 },
  ];

  const mockPerformance = Array.from({ length: 12 }, (_, i) => {
    return 100000 * Math.pow(1.02, i) + (Math.random() * 5000 - 2500);
  });
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Portfolio Analytics</h1>
        <p className="text-gray-400 mt-1">Deep dive into your portfolio performance and risk metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Value" value={portfolioSummary.totalValue.toLocaleString()} prefix="$" icon={<DollarSign className="w-5 h-5" />} />
        <KPICard title="Total Return" value={portfolioSummary.totalReturn.toLocaleString()} prefix="$" change={portfolioSummary.totalReturnPercent} icon={<TrendingUp className="w-5 h-5" />} />
        <KPICard title="Sharpe Ratio" value="1.85" icon={<Activity className="w-5 h-5" />} />
        <KPICard title="Value at Risk (VaR)" value="2,450" prefix="$" icon={<Shield className="w-5 h-5 text-orange-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-400" />
            1Y Performance
          </h2>
          <div className="h-[300px] w-full">
            <Plot
              data={[
                {
                  x: months,
                  y: mockPerformance,
                  type: 'scatter',
                  mode: 'lines',
                  fill: 'tozeroy',
                  fillcolor: 'rgba(59, 130, 246, 0.1)',
                  name: 'Portfolio',
                  line: { color: '#3b82f6', width: 3, shape: 'spline' }
                }
              ]}
              layout={{
                autosize: true,
                margin: { t: 10, r: 10, l: 50, b: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { showgrid: false, color: '#6b7280' },
                yaxis: { showgrid: true, gridcolor: '#1f2937', color: '#6b7280' },
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Allocation */}
        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Asset Allocation
          </h2>
          <div className="flex-1 flex items-center justify-center">
            <Plot
              data={[
                {
                  values: allocation.map(a => a.value),
                  labels: allocation.map(a => a.label),
                  type: 'pie',
                  hole: 0.7,
                  marker: {
                    colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b']
                  },
                  textinfo: 'none',
                  hoverinfo: 'label+percent'
                }
              ]}
              layout={{
                autosize: true,
                margin: { t: 0, b: 0, l: 0, r: 0 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                showlegend: false,
                annotations: [
                  {
                    text: 'Diversified',
                    showarrow: false,
                    font: { size: 16, color: '#f3f4f6' }
                  }
                ]
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '220px' }}
              config={{ displayModeBar: false }}
            />
          </div>
          <div className="space-y-3 mt-4">
            {allocation.map((a, i) => (
              <div key={a.label} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b'][i] }} />
                  <span className="text-gray-300">{a.label}</span>
                </div>
                <span className="font-medium text-gray-200">{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}