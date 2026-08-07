import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import * as portfolioService from '../services/portfolioService';
import KPICard from '../components/shared/KPICard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';
import CreatePortfolioModal from '../components/shared/CreatePortfolioModal';
import { PieChart, LineChart, Shield, Activity, TrendingUp, DollarSign, Briefcase, Plus } from 'lucide-react';
import Plot from 'react-plotly.js';
import type { PortfolioResponse } from '../types/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#06b6d4', '#f97316'];

export default function PortfolioAnalytics() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error, refetch } = useApi(
    () => portfolioService.listPortfolios({ page_size: 50 }),
    [],
  );

  const handlePortfolioCreated = useCallback((_portfolio: PortfolioResponse) => {
    refetch();
  }, [refetch]);

  if (loading) return <LoadingSpinner message="Loading portfolio…" />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const portfolios = data?.portfolios ?? [];

  if (portfolios.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-100">Portfolio Analytics</h1>
            <p className="text-gray-400 mt-1">Deep dive into your portfolio performance and risk metrics.</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Create Portfolio
          </button>
        </div>
        <EmptyState
          icon={<Briefcase className="w-6 h-6" />}
          message="No portfolios yet"
          subMessage="Create your first portfolio to start tracking your investments and performance."
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Plus className="w-4 h-4" />
              Create Your First Portfolio
            </button>
          }
        />
        <CreatePortfolioModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePortfolioCreated}
        />
      </div>
    );
  }

  // Use the first portfolio (default or most recent)
  const portfolio = portfolios.find((p) => p.is_default) ?? portfolios[0];

  const totalReturn = portfolio.current_value - portfolio.initial_balance;
  const totalReturnPct = portfolio.initial_balance > 0
    ? (totalReturn / portfolio.initial_balance) * 100
    : 0;

  // Mock 12-month performance curve (portfolio history endpoint not yet implemented)
  const mockMonthly = Array.from({ length: 12 }, (_, i) =>
    portfolio.initial_balance * Math.pow(1 + totalReturnPct / 100 / 12, i + 1),
  );
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100">Portfolio Analytics</h1>
          <p className="text-gray-400 mt-1">
            {portfolio.portfolio_name}
            {portfolio.is_default && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Default
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Portfolio count badge */}
          {portfolios.length > 1 && (
            <span className="text-xs text-gray-500">
              {portfolios.length} portfolios — showing default
            </span>
          )}
          {/* Create Portfolio button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Portfolio
          </button>
        </div>
      </div>

      <CreatePortfolioModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePortfolioCreated}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Value"
          value={portfolio.current_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          prefix="$"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          title="Total Return"
          value={Math.abs(totalReturn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          prefix={totalReturn >= 0 ? '+$' : '-$'}
          change={parseFloat(totalReturnPct.toFixed(2))}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Initial Balance"
          value={portfolio.initial_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          prefix="$"
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="P&amp;L"
          value={Math.abs(portfolio.total_profit_loss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          prefix={portfolio.total_profit_loss >= 0 ? '+$' : '-$'}
          change={parseFloat(portfolio.total_profit_loss_percentage.toFixed(2))}
          icon={<Shield className="w-5 h-5 text-orange-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-1 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-blue-400" />
            Projected 1Y Performance
          </h2>
          <p className="text-xs text-gray-500 mb-4">Projected curve based on current return rate</p>
          <div className="h-[300px] w-full">
            <Plot
              data={[
                {
                  x: months,
                  y: mockMonthly,
                  type: 'scatter',
                  mode: 'lines',
                  fill: 'tozeroy',
                  fillcolor: 'rgba(59, 130, 246, 0.1)',
                  name: 'Portfolio Value',
                  line: { color: '#3b82f6', width: 3, shape: 'spline' },
                },
              ]}
              layout={{
                autosize: true,
                margin: { t: 10, r: 10, l: 50, b: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { showgrid: false, color: '#6b7280' },
                yaxis: { showgrid: true, gridcolor: '#1f2937', color: '#6b7280' },
              }}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

        {/* Portfolio Details */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Portfolio Details
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border/20">
              <span className="text-gray-400">Currency</span>
              <span className="text-gray-200 font-medium">{portfolio.currency}</span>
            </div>
            {portfolio.risk_level && (
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-gray-400">Risk Level</span>
                <span className="capitalize text-gray-200 font-medium">{portfolio.risk_level}</span>
              </div>
            )}
            {portfolio.investment_goal && (
              <div className="flex justify-between items-center py-2 border-b border-border/20">
                <span className="text-gray-400">Goal</span>
                <span className="text-gray-200 font-medium text-right max-w-[160px] truncate">
                  {portfolio.investment_goal}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-border/20">
              <span className="text-gray-400">Created</span>
              <span className="text-gray-200 font-medium">
                {new Date(portfolio.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-gray-200 font-medium">
                {new Date(portfolio.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {portfolio.description && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-gray-300">{portfolio.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* All Portfolios List */}
      {portfolios.length > 1 && (
        <div className="glass-panel rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4">All Portfolios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-border/30">
                  <th className="text-left pb-3 font-medium">Name</th>
                  <th className="text-right pb-3 font-medium">Initial</th>
                  <th className="text-right pb-3 font-medium">Current Value</th>
                  <th className="text-right pb-3 font-medium">P&amp;L</th>
                  <th className="text-right pb-3 font-medium">P&amp;L %</th>
                  <th className="text-center pb-3 font-medium">Default</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.map((p, i) => (
                  <tr key={p.id} className="border-b border-border/10 hover:bg-white/[0.02]">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-gray-200 font-medium">{p.portfolio_name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      ${p.initial_balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-right text-gray-200">
                      ${p.current_value.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 text-right font-medium ${p.total_profit_loss >= 0 ? 'text-market-up' : 'text-market-down'}`}>
                      {p.total_profit_loss >= 0 ? '+' : ''}${p.total_profit_loss.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className={`py-3 text-right font-medium ${p.total_profit_loss_percentage >= 0 ? 'text-market-up' : 'text-market-down'}`}>
                      {p.total_profit_loss_percentage >= 0 ? '+' : ''}{p.total_profit_loss_percentage.toFixed(2)}%
                    </td>
                    <td className="py-3 text-center">
                      {p.is_default && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
