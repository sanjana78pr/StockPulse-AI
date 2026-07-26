import { aiRecommendations } from '../lib/mockData';
import { Brain, CheckCircle, XCircle, MinusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AIRecommendations() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Recommendations
          </h1>
          <p className="text-gray-400 mt-1">Algorithmic buy/sell signals based on deep market analysis.</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-black/20 border border-border/50 text-sm rounded-lg px-3 py-2 text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/50">
            <option>All Sectors</option>
            <option>Technology</option>
            <option>Financials</option>
          </select>
          <select className="bg-black/20 border border-border/50 text-sm rounded-lg px-3 py-2 text-gray-200 outline-none focus:ring-1 focus:ring-blue-500/50">
            <option>Highest Confidence</option>
            <option>Newest First</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {aiRecommendations.map(rec => {
          const isBuy = rec.action === 'BUY';
          const isSell = rec.action === 'SELL';
          const isHold = rec.action === 'HOLD';
          
          return (
            <div key={rec.symbol} className="glass-panel rounded-xl overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <div className="p-5 border-b border-border/20">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-100">{rec.symbol}</h2>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1
                    ${isBuy ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                      isSell ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
                  >
                    {isBuy && <CheckCircle className="w-3 h-3" />}
                    {isSell && <XCircle className="w-3 h-3" />}
                    {isHold && <MinusCircle className="w-3 h-3" />}
                    {rec.action}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 block text-xs">Current Price</span>
                    <span className="font-semibold text-gray-200">${rec.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Target Price</span>
                    <span className="font-semibold text-gray-200">${rec.targetPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">AI Confidence</span>
                    <span className="text-purple-400 font-bold">{rec.confidence}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" 
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-black/20">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Analysis</h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {rec.reason}
                </p>
                
                <div className="mt-4 flex items-center gap-2">
                  {rec.riskLevel === 'Low' && <ShieldCheck className="w-4 h-4 text-green-400" />}
                  {rec.riskLevel === 'Medium' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  {rec.riskLevel === 'High' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  <span className="text-xs text-gray-400 font-medium">{rec.riskLevel} Risk Profile</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}