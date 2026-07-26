import { useState } from 'react';
import Plot from 'react-plotly.js';
import { generateStockData } from '../lib/mockData';
import { AlertTriangle, Activity, Zap } from 'lucide-react';
import KPICard from '../components/shared/KPICard';

export default function VolatilityAnalytics() {
  const [data] = useState(() => generateStockData(60, 150, 0.03));
  
  // Calculate mock Bollinger Bands
  const bbData = data.map((d, i, arr) => {
    const period = 20;
    if (i < period) return { ...d, sma: null, upper: null, lower: null };
    
    const slice = arr.slice(i - period, i);
    const sum = slice.reduce((acc, val) => acc + val.close, 0);
    const sma = sum / period;
    
    const variance = slice.reduce((acc, val) => acc + Math.pow(val.close - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      ...d,
      sma,
      upper: sma + (stdDev * 2),
      lower: sma - (stdDev * 2)
    };
  });

  const validBbData = bbData.filter(d => d.sma !== null);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Volatility Analytics</h1>
        <p className="text-gray-400 mt-1">Monitor market risk and price fluctuations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="VIX Index" value="14.25" change={-1.5} icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />} />
        <KPICard title="Average True Range" value="3.42" icon={<Activity className="w-5 h-5" />} />
        <KPICard title="Historical Volatility" value="18.5" suffix="%" icon={<Zap className="w-5 h-5" />} />
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-400">Risk Meter</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 bg-black/40 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500" style={{ width: '33%' }}></div>
              <div className="h-full bg-yellow-500 opacity-20" style={{ width: '34%' }}></div>
              <div className="h-full bg-red-500 opacity-20" style={{ width: '33%' }}></div>
            </div>
            <span className="text-sm font-bold text-green-400">LOW</span>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Bollinger Bands Visualization (AAPL)</h2>
        <div className="h-[400px] w-full">
          <Plot
            data={[
              {
                x: validBbData.map(d => d.date),
                y: validBbData.map(d => d.close),
                type: 'scatter',
                mode: 'lines',
                name: 'Price',
                line: { color: '#f3f4f6', width: 2 }
              },
              {
                x: validBbData.map(d => d.date),
                y: validBbData.map(d => d.upper),
                type: 'scatter',
                mode: 'lines',
                name: 'Upper Band',
                line: { color: 'rgba(59, 130, 246, 0.5)', width: 1, dash: 'dash' }
              },
              {
                x: validBbData.map(d => d.date),
                y: validBbData.map(d => d.lower),
                type: 'scatter',
                mode: 'lines',
                fill: 'tonexty',
                fillcolor: 'rgba(59, 130, 246, 0.1)',
                name: 'Lower Band',
                line: { color: 'rgba(59, 130, 246, 0.5)', width: 1, dash: 'dash' }
              },
              {
                x: validBbData.map(d => d.date),
                y: validBbData.map(d => d.sma),
                type: 'scatter',
                mode: 'lines',
                name: '20-Day SMA',
                line: { color: '#f59e0b', width: 1 }
              }
            ]}
            layout={{
              autosize: true,
              margin: { t: 10, r: 10, l: 40, b: 30 },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              xaxis: { showgrid: false, color: '#6b7280' },
              yaxis: { showgrid: true, gridcolor: '#1f2937', color: '#6b7280' },
              legend: { orientation: 'h', y: -0.15, font: { color: '#9ca3af' } }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </div>
    </div>
  );
}