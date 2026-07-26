import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  LineChart, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  Target, 
  Settings 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Live Market', path: '/app/market', icon: Activity },
  { name: 'Stocks', path: '/app/stocks', icon: LineChart },
  { name: 'Predictions', path: '/app/predictions', icon: TrendingUp },
  { name: 'Volatility', path: '/app/volatility', icon: BarChart2 },
  { name: 'Portfolio', path: '/app/portfolio', icon: PieChart },
  { name: 'Recommendations', path: '/app/recommendations', icon: Target },
  { name: 'Settings', path: '/app/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border/50 bg-[#0c0c0e] hidden md:flex flex-col h-full z-10">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            StockPulse AI
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/app');
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                  isActive 
                    ? "text-blue-400" 
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-blue-500/10 rounded-lg border border-blue-500/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5 z-10" />
                <span className="z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
