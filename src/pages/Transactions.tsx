import { useState, useCallback, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  X,
  DollarSign,
  BarChart2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useApi } from '../hooks/useApi';
import * as transactionService from '../services/transactionService';
import * as portfolioService from '../services/portfolioService';
import { ApiError } from '../types/api';
import type { TransactionResponse, TransactionType, PortfolioResponse } from '../types/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';
import KPICard from '../components/shared/KPICard';
import CreatePortfolioModal from '../components/shared/CreatePortfolioModal';

// ---------------------------------------------------------------------------
// Table column helper
// ---------------------------------------------------------------------------
const columnHelper = createColumnHelper<TransactionResponse>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(v: number) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Transactions() {
  // ---- filter / pagination state ----
  const [portfolioFilter, setPortfolioFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  // ---- sort state ----
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'transaction_date', desc: true },
  ]);

  // ---- trade form state ----
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    portfolio_id: '',
    stock_symbol: '',
    transaction_type: 'BUY' as TransactionType,
    quantity: '',
    price_per_share: '',
    fees: '0',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // ---- data fetch ----
  const sortField = sorting[0]?.id ?? 'transaction_date';
  const sortOrder = sorting[0]?.desc === false ? 'asc' : 'desc';

  const {
    data: txData,
    loading: txLoading,
    error: txError,
    refetch: txRefetch,
  } = useApi(
    () =>
      transactionService.listMyTransactions({
        page,
        page_size: PAGE_SIZE,
        sort_by: sortField,
        sort_order: sortOrder as 'asc' | 'desc',
        ...(portfolioFilter ? { portfolio_id: portfolioFilter } : {}),
        ...(typeFilter ? { transaction_type: typeFilter } : {}),
        ...(symbolSearch ? { search: symbolSearch } : {}),
      }),
    [page, sortField, sortOrder, portfolioFilter, typeFilter, symbolSearch],
  );

  // ---- create portfolio modal ----
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: portfolioData,
    refetch: portfolioRefetch,
  } = useApi(
    () => portfolioService.listPortfolios({ page_size: 50 }),
    [],
  );

  // Called when a new portfolio is created from the modal.
  // Refreshes the portfolios list, auto-selects the new portfolio,
  // and preserves all currently-entered trade field values.
  const handlePortfolioCreated = useCallback((portfolio: PortfolioResponse) => {
    portfolioRefetch();
    setForm((prev) => ({ ...prev, portfolio_id: portfolio.id }));
    setFormError(null);
    setFormSuccess(`Portfolio "${portfolio.portfolio_name}" created. Ready to trade!`);
    // Open the trade form so the user can execute immediately
    setShowForm(true);
  }, [portfolioRefetch]);

  const portfolios = portfolioData?.portfolios ?? [];
  const transactions = txData?.transactions ?? [];
  const totalPages = txData?.total_pages ?? 1;
  const totalCount = txData?.total ?? 0;

  // ---- KPI derivations ----
  const totalBought = transactions
    .filter((t) => t.transaction_type === 'BUY')
    .reduce((s, t) => s + t.total_amount, 0);
  const totalSold = transactions
    .filter((t) => t.transaction_type === 'SELL')
    .reduce((s, t) => s + t.total_amount, 0);
  const totalFees = transactions.reduce((s, t) => s + t.fees, 0);

  // ---- table columns ----
  // STABILITY FIX: memoize columns with no deps — column definitions are pure
  // JSX factories that don't depend on any state. Previously a new array was
  // created on every render, forcing TanStack to rebuild all headers and cells.
  const columns = useMemo(() => [
    columnHelper.accessor('transaction_date', {
      header: 'Date',
      cell: (info) => (
        <span className="text-gray-400 text-xs">{formatDate(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('stock_symbol', {
      header: 'Symbol',
      cell: (info) => (
        <span className="font-bold text-gray-200">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('transaction_type', {
      header: 'Type',
      cell: (info) => {
        const isBuy = info.getValue() === 'BUY';
        return (
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit',
              isBuy
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20',
            )}
          >
            {isBuy ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor('quantity', {
      header: 'Qty',
      cell: (info) => <span className="text-gray-200">{info.getValue()}</span>,
    }),
    columnHelper.accessor('price_per_share', {
      header: 'Price/Share',
      cell: (info) => (
        <span className="text-gray-200">${formatCurrency(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('total_amount', {
      header: 'Total',
      cell: (info) => (
        <span className="font-medium text-gray-200">${formatCurrency(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('fees', {
      header: 'Fees',
      cell: (info) => (
        <span className="text-gray-400">${formatCurrency(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor('notes', {
      header: 'Notes',
      cell: (info) =>
        info.getValue() ? (
          <span className="text-gray-500 text-xs truncate max-w-[140px] block">
            {info.getValue()}
          </span>
        ) : (
          <span className="text-gray-700">—</span>
        ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true, // sorting is server-side
    manualPagination: true,
  });

  // ---- form handlers ----
  const handleFormChange = useCallback(
    (field: string, value: string) =>
      setForm((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const handleSubmitTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const qty = parseFloat(form.quantity);
    const price = parseFloat(form.price_per_share);
    const fees = parseFloat(form.fees || '0');

    if (!form.portfolio_id) {
      setFormError('Please select a portfolio.');
      return;
    }
    if (!form.stock_symbol.trim()) {
      setFormError('Please enter a stock symbol.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setFormError('Price per share must be a positive number.');
      return;
    }

    setFormSubmitting(true);
    try {
      const tx = await transactionService.createTransaction({
        portfolio_id: form.portfolio_id,
        stock_symbol: form.stock_symbol.trim().toUpperCase(),
        transaction_type: form.transaction_type,
        quantity: qty,
        price_per_share: price,
        fees: isNaN(fees) ? 0 : fees,
        notes: form.notes.trim() || undefined,
      });
      setFormSuccess(
        `${tx.transaction_type} ${tx.quantity} × ${tx.stock_symbol} @ $${tx.price_per_share.toFixed(2)} executed successfully.`,
      );
      // Reset form
      setForm((prev) => ({
        ...prev,
        stock_symbol: '',
        quantity: '',
        price_per_share: '',
        fees: '0',
        notes: '',
      }));
      setPage(1);
      txRefetch();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Transaction failed. Please try again.',
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ---- filter reset ----
  const resetFilters = () => {
    setPortfolioFilter('');
    setTypeFilter('');
    setSymbolSearch('');
    setPage(1);
  };

  const hasActiveFilters = portfolioFilter || typeFilter || symbolSearch;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-400" />
            Transactions
          </h1>
          <p className="text-gray-400 mt-1">Execute trades and review your transaction history.</p>
        </div>
        <button
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
            setFormSuccess(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Trade'}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Transactions"
          value={totalCount}
          icon={<Receipt className="w-5 h-5" />}
        />
        <KPICard
          title="Page Bought"
          value={formatCurrency(totalBought)}
          prefix="$"
          icon={<TrendingUp className="w-5 h-5 text-market-up" />}
        />
        <KPICard
          title="Page Sold"
          value={formatCurrency(totalSold)}
          prefix="$"
          icon={<TrendingDown className="w-5 h-5 text-market-down" />}
        />
        <KPICard
          title="Page Fees"
          value={formatCurrency(totalFees)}
          prefix="$"
          icon={<DollarSign className="w-5 h-5 text-gray-400" />}
        />
      </div>

      {/* Trade Form */}
      {showForm && (
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-200 mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            Execute Trade
          </h2>

          {formSuccess && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
              {formSuccess}
            </div>
          )}
          {formError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmitTrade} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Portfolio */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Portfolio *
              </label>
              {portfolios.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Portfolio
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    required
                    value={form.portfolio_id}
                    onChange={(e) => handleFormChange('portfolio_id', e.target.value)}
                    className="flex-1 bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select portfolio…</option>
                    {portfolios.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.portfolio_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    title="Create new portfolio"
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-border/50 text-gray-400 hover:text-gray-200 rounded-lg text-sm transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </button>
                </div>
              )}
            </div>

            {/* Symbol */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Stock Symbol *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AAPL"
                value={form.stock_symbol}
                onChange={(e) =>
                  handleFormChange('stock_symbol', e.target.value.toUpperCase())
                }
                className="w-full bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 uppercase placeholder-gray-600"
              />
            </div>

            {/* Type toggle */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Type *
              </label>
              <div className="flex rounded-lg overflow-hidden border border-border/50">
                {(['BUY', 'SELL'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleFormChange('transaction_type', t)}
                    className={cn(
                      'flex-1 py-2.5 text-sm font-semibold transition-colors',
                      form.transaction_type === t
                        ? t === 'BUY'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-black/20 text-gray-400 hover:bg-white/5',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="0.000001"
                step="any"
                placeholder="10"
                value={form.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                className="w-full bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Price per Share ($) *
              </label>
              <input
                type="number"
                required
                min="0.000001"
                step="any"
                placeholder="175.50"
                value={form.price_per_share}
                onChange={(e) => handleFormChange('price_per_share', e.target.value)}
                className="w-full bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Fees */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Fees ($)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={form.fees}
                onChange={(e) => handleFormChange('fees', e.target.value)}
                className="w-full bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                Notes
              </label>
              <input
                type="text"
                maxLength={500}
                placeholder="Optional note…"
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="w-full bg-black/40 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Total preview */}
            {form.quantity && form.price_per_share && (
              <div className="md:col-span-2 lg:col-span-2 flex items-center gap-2 text-sm">
                <span className="text-gray-500">Estimated Total:</span>
                <span className="font-bold text-gray-200">
                  $
                  {(
                    parseFloat(form.quantity || '0') *
                      parseFloat(form.price_per_share || '0') +
                    parseFloat(form.fees || '0')
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-gray-600 text-xs">(incl. fees)</span>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end lg:col-span-1">
              <button
                type="submit"
                disabled={formSubmitting || portfolios.length === 0}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2',
                  form.transaction_type === 'BUY'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white',
                )}
              >
                {formSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing…
                  </>
                ) : (
                  `${form.transaction_type} ${form.stock_symbol || 'Stock'}`
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 bg-black/20 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Symbol search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={symbolSearch}
                onChange={(e) => {
                  setSymbolSearch(e.target.value.toUpperCase());
                  setPage(1);
                }}
                type="text"
                placeholder="Search symbol…"
                className="w-40 bg-[#0a0a0b] border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
              />
            </div>

            {/* Portfolio filter */}
            <select
              value={portfolioFilter}
              onChange={(e) => {
                setPortfolioFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#0a0a0b] border border-border/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Portfolios</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.portfolio_name}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as TransactionType | '');
                setPage(1);
              }}
              className="bg-[#0a0a0b] border border-border/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-gray-500 hover:text-gray-300 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          <span className="text-xs text-gray-500">
            {totalCount} transaction{totalCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table body */}
        {txLoading && <LoadingSpinner message="Loading transactions…" />}
        {!txLoading && txError && <ErrorMessage message={txError} onRetry={txRefetch} />}
        {!txLoading && !txError && transactions.length === 0 && (
          <EmptyState
            icon={<Receipt className="w-6 h-6" />}
            message="No transactions found"
            subMessage={
              hasActiveFilters
                ? 'No results match your filters. Try clearing them.'
                : 'Use the "New Trade" button above to execute your first trade.'
            }
          />
        )}

        {!txLoading && !txError && transactions.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-border/50">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th key={header.id} className="px-5 py-4 font-medium">
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort()
                                  ? 'cursor-pointer select-none flex items-center gap-1 hover:text-gray-200 transition-colors'
                                  : ''
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.column.getCanSort() && (
                                <ArrowUpDown className="w-3 h-3 opacity-50" />
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border/20 hover:bg-white/[0.02] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-black/10">
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages} · {totalCount} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Create Portfolio Modal */}
      <CreatePortfolioModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePortfolioCreated}
      />
    </div>
  );
}
