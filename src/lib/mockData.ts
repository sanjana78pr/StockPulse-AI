export const generateStockData = (days = 30, startPrice = 150, volatility = 0.02) => {
  let currentPrice = startPrice;
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = currentPrice * volatility * (Math.random() - 0.45);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * volatility);
    const low = Math.min(open, close) - (Math.random() * currentPrice * volatility);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    currentPrice = close;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  return data;
};

export const majorIndices = [
  { symbol: 'S&P 500', value: 5214.52, change: 42.15, changePercent: 0.82, chart: generateStockData(10, 5100, 0.01) },
  { symbol: 'NASDAQ', value: 16342.15, change: 185.42, changePercent: 1.15, chart: generateStockData(10, 16000, 0.015) },
  { symbol: 'NIFTY 50', value: 22453.30, change: -12.40, changePercent: -0.06, chart: generateStockData(10, 22400, 0.01) },
  { symbol: 'SENSEX', value: 73842.15, change: 15.20, changePercent: 0.02, chart: generateStockData(10, 73800, 0.01) }
];

export const topGainers = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 924.15, changePercent: 5.42, volume: '45.2M' },
  { symbol: 'META', name: 'Meta Platforms', price: 495.22, changePercent: 3.12, volume: '22.1M' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 185.34, changePercent: 2.85, volume: '35.6M' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', price: 142.15, changePercent: 2.15, volume: '18.4M' }
];

export const portfolioSummary = {
  totalValue: 124562.45,
  dayChange: 1245.32,
  dayChangePercent: 1.01,
  totalReturn: 24562.45,
  totalReturnPercent: 24.56,
  buyingPower: 12450.00
};

export const aiRecommendations = [
  { symbol: 'AAPL', action: 'BUY', confidence: 85, reason: 'Strong technical breakout above 50-day moving average combined with positive sentiment analysis.', currentPrice: 175.24, targetPrice: 195.00, riskLevel: 'Low' },
  { symbol: 'TSLA', action: 'SELL', confidence: 72, reason: 'Weakening momentum and increasing volatility. Analyst downgrades detected in news flow.', currentPrice: 172.15, targetPrice: 150.00, riskLevel: 'High' },
  { symbol: 'MSFT', action: 'HOLD', confidence: 65, reason: 'Trading at fair value. Waiting for next earnings catalyst.', currentPrice: 415.22, targetPrice: 420.00, riskLevel: 'Medium' }
];

export const latestNews = [
  { id: 1, title: 'Fed Signals Potential Rate Cuts Later This Year', source: 'Bloomberg', time: '2h ago', sentiment: 'positive' },
  { id: 2, title: 'Tech Stocks Rally on AI Optimism', source: 'Reuters', time: '4h ago', sentiment: 'positive' },
  { id: 3, title: 'Oil Prices Surge Amid Geopolitical Tensions', source: 'Wall Street Journal', time: '5h ago', sentiment: 'negative' },
  { id: 4, title: 'Retail Sales Data Shows Unexpected Consumer Weakness', source: 'CNBC', time: '6h ago', sentiment: 'negative' }
];

export const liveMarketStocks = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', price: 173.50, change: 1.2, volume: '52M', marketCap: '2.6T' },
  { id: '2', symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', price: 420.55, change: 0.8, volume: '22M', marketCap: '3.1T' },
  { id: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', price: 155.20, change: -0.5, volume: '28M', marketCap: '1.9T' },
  { id: '4', symbol: 'AMZN', name: 'Amazon.com', sector: 'Consumer Cyclical', price: 178.35, change: 2.1, volume: '45M', marketCap: '1.8T' },
  { id: '5', symbol: 'META', name: 'Meta Platforms', sector: 'Technology', price: 505.12, change: 3.5, volume: '18M', marketCap: '1.2T' },
  { id: '6', symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', price: 405.80, change: 0.2, volume: '4M', marketCap: '880B' },
  { id: '7', symbol: 'LLY', name: 'Eli Lilly', sector: 'Healthcare', price: 780.25, change: 1.5, volume: '3M', marketCap: '740B' },
  { id: '8', symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', price: 195.40, change: -0.8, volume: '11M', marketCap: '560B' },
  { id: '9', symbol: 'V', name: 'Visa Inc.', sector: 'Financials', price: 285.30, change: 0.4, volume: '6M', marketCap: '580B' },
  { id: '10', symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', price: 920.15, change: -1.2, volume: '65M', marketCap: '2.3T' },
  { id: '11', symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Cyclical', price: 172.50, change: -2.4, volume: '85M', marketCap: '550B' },
  { id: '12', symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Defensive', price: 60.25, change: 0.5, volume: '15M', marketCap: '480B' },
];
