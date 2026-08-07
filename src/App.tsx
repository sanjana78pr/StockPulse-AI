import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LiveMarket from './pages/LiveMarket';
import StockDetails from './pages/StockDetails';
import TrendPrediction from './pages/TrendPrediction';
import VolatilityAnalytics from './pages/VolatilityAnalytics';
import PortfolioAnalytics from './pages/PortfolioAnalytics';
import AIRecommendations from './pages/AIRecommendations';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes (require authentication) */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="market" element={<LiveMarket />} />
              <Route path="stocks" element={<StockDetails />} />
              <Route path="predictions" element={<TrendPrediction />} />
              <Route path="volatility" element={<VolatilityAnalytics />} />
              <Route path="portfolio" element={<PortfolioAnalytics />} />
              <Route path="recommendations" element={<AIRecommendations />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
