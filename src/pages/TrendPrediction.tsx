import { useState } from 'react';
import Plot from 'react-plotly.js';
import { generateStockData } from '../lib/mockData';
import { BrainCircuit, TrendingUp, Zap } from 'lucide-react';
import KPICard from '../components/shared/KPICard';

export default function TrendPrediction() {
  const [symbol] = useState('AAPL');
  
  // Mock data for historical vs predicted
  const historicalDays = 60;
  const predictedDays = 30;
  const historicalData = generateStockData(historicalDays, 160, 0.015);
  const lastPrice = historicalData[historicalData.length - 1].close;
  
  // Generate predicted path with upward trend
  const predictedData = generateStockData(predictedDays, lastPrice, 0.02).map((d, i) => ({
    ...d,
    close: lastPrice * (1 + (0.002 * i)) + (Math.random() * 5 - 2.5) // Upward bias
  }));
  
  const targetPrice = predictedData[predictedData.length - 1].close;
  const predictedChange = ((targetPrice - lastPrice) / lastPrice) * 100;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">AI Trend Prediction</h1>
        <p className="text-gray-400 mt-1">Deep learning forecast models for {symbol}.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Predicted Target (30D)" 
          value={targetPrice.toFixed(2)} 
          prefix="$"
          change={parseFloat(predictedChange.toFixed(2))}
          icon={<Target className="w-5 h-5 text-blue-400" />}
        />
        
        <div className="glass-panel rounded-xl p-5 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-400">Trend Probability</h3>
            <TrendingUp className="w-5 h-5 text-market-up" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-3xl font-bold text-market-up">78%</div>
            <div className="text-sm text-gray-400">Bullish bias detected based on momentum oscillators and institutional buying pressure.</div>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-medium text-gray-400">Model Confidence</h3>
            <BrainCircuit className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="text-3xl font-bold text-purple-400">High</div>
            <div className="text-sm text-gray-400">High alignment across ensemble models (LSTM + Transformer).</div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Forecast Trajectory</h2>
        <div className="h-[400px] w-full">
          <Plot
            data={[
              {
                x: historicalData.map(d => d.date),
                y: historicalData.map(d => d.close),
                type: 'scatter',
                mode: 'lines',
                name: 'Historical',
                line: { color: '#64748b', width: 2 }
              },
              {
                x: predictedData.map(d => d.date),
                y: predictedData.map(d => d.close),
                type: 'scatter',
                mode: 'lines',
                name: 'Predicted Path',
                line: { color: '#3b82f6', width: 3, dash: 'dot' }
              },
              // Confidence interval bounds (mock)
              {
                x: predictedData.map(d => d.date),
                y: predictedData.map(d => d.close * 1.05),
                type: 'scatter',
                mode: 'lines',
                name: 'Upper Bound',
                line: { width: 0 },
                showlegend: false
              },
              {
                x: predictedData.map(d => d.date),
                y: predictedData.map(d => d.close * 0.95),
                type: 'scatter',
                mode: 'lines',
                fill: 'tonexty',
                fillcolor: 'rgba(59, 130, 246, 0.1)',
                name: 'Confidence Interval',
                line: { width: 0 }
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

      {/* AI Explanation */}
      <div className="glass-panel rounded-xl p-5 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-200">AI Reasoning</h2>
        </div>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
            <p><strong>Technical Setup:</strong> The stock recently broke out of a multi-week consolidation pattern above the 50-day moving average, signaling strong near-term momentum.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
            <p><strong>Sentiment Analysis:</strong> Natural Language Processing (NLP) of recent earnings transcripts and news flow indicates a 22% increase in positive forward-looking statements from management.</p>
          </li>
          <li className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
            <p><strong>Options Market:</strong> Put/Call ratio has dropped to 0.65, showing heavy call buying and a bullish tilt among institutional options traders.</p>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Quick hack for Target icon missing in import
const Target = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);