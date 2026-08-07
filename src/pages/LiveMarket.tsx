import { useState, useMemo, useEffect, useRef } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { Search, ArrowUpDown, AlertCircle, Wifi, WifiOff, Plus, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useLiveMarket } from '../hooks/useLiveMarket';
import * as stockService from '../services/stockService';
import type { StockResponse, StockExternalSearchResponse } from '../types/api';
import { ApiError } from '../types/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorMessage from '../components/shared/ErrorMessage';
import EmptyState from '../components/shared/EmptyState';

const columnHelper = createColumnHelper<StockResponse & { livePrice?: number; priceChange?: number; changePercent?: number; isLoading?: boolean; hasError?: boolean; }>();

export default function LiveMarket() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // External search & tracking states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockExternalSearchResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch stock list from database
  const { data, loading, error, refetch } = useApi(
    () => stockService.listStocks({ page_size: 1000, sort_by: 'symbol', sort_order: 'asc' }),
    [],
  );

  const stocks = data?.stocks ?? [];

  // Debounced search on Yahoo Finance
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await stockService.searchExternalStocks(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching external stocks:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Click outside dropdown handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Self-dismissing toast handler
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
        const selected = searchResults[focusedIndex];
        const isTracked = stocks.some(
          (s) => s.symbol.toUpperCase() === selected.symbol.toUpperCase()
        );
        if (!isTracked) {
          handleAddStock(selected.symbol);
        }
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleAddStock = async (symbol: string) => {
    if (addingSymbol) return;
    setAddingSymbol(symbol);
    try {
      await stockService.createStock({ symbol });
      setToast({
        type: 'success',
        message: `Successfully added ${symbol.toUpperCase()} to tracking list.`,
      });
      setSearchQuery('');
      setSearchResults([]);
      setIsDropdownOpen(false);
      setFocusedIndex(-1);
      refetch(); // Reload stocks list from database
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : `Failed to add ${symbol.toUpperCase()}`;
      setToast({
        type: 'error',
        message: msg,
      });
    } finally {
      setAddingSymbol(null);
    }
  };
  const symbols = useMemo(() => stocks.map(stock => stock.symbol), [stocks]);

  // Live market data polling
  const { quotes, errors, loading: liveLoading, clearError, clearAllErrors } = useLiveMarket(symbols, {
    interval: 5000, // Poll every 5 seconds
    enabled: symbols.length > 0,
  });

  // Enhanced stock data with live prices
  const enhancedStocks = useMemo(() => {
    return stocks.map(stock => {
      const quote = quotes[stock.symbol];
      const isLoading = liveLoading[stock.symbol] || false;
      const hasError = !!errors[stock.symbol];
      
      if (quote) {
        const currentPrice = quote.price;
        const previousClose = quote.previous_close || stock.current_price || currentPrice;
        const priceChange = currentPrice - previousClose;
        const changePercent = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;

        return {
          ...stock,
          livePrice: currentPrice,
          priceChange,
          changePercent,
          isLoading,
          hasError,
        };
      }

      return {
        ...stock,
        livePrice: undefined,
        priceChange: undefined,
        changePercent: undefined,
        isLoading,
        hasError,
      };
    });
  }, [stocks, quotes, liveLoading, errors]);

  // BUG FIX: memoize columns so TanStack Table receives a stable reference.
  // Previously columns were recreated on every render, forcing full table
  // reconstruction on every poll-triggered re-render.
  const columns = useMemo(() => [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-200">{info.getValue()}</span>
          {info.row.original.isLoading && (
            <div className="w-3 h-3 rounded-full border border-blue-500 border-t-transparent animate-spin" />
          )}
          {info.row.original.hasError && (
            <AlertCircle 
              className="w-3 h-3 text-red-400 cursor-pointer" 
              title={errors[info.getValue()]}
              onClick={() => clearError(info.getValue())}
            />
          )}
        </div>
      ),
    }),
    columnHelper.accessor('company_name', {
      header: 'Company Name',
      cell: (info) => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('sector', {
      header: 'Sector',
      cell: (info) =>
        info.getValue() ? (
          <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-border/50">
            {info.getValue()}
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    }),
    columnHelper.accessor('livePrice', {
      header: 'Live Price',
      cell: (info) => {
        const livePrice = info.getValue();
        const staticPrice = info.row.original.current_price;
        const changePercent = info.row.original.changePercent;
        const hasError = info.row.original.hasError;

        if (hasError) {
          return (
            <div className="flex items-center gap-1">
              <span className="text-gray-500">—</span>
              <WifiOff className="w-3 h-3 text-red-400" />
            </div>
          );
        }

        const displayPrice = livePrice ?? staticPrice;
        if (displayPrice == null) return <span className="text-gray-600">—</span>;

        const isLive = livePrice != null;
        const changeColor = changePercent && changePercent !== 0
          ? changePercent > 0 ? 'text-market-up' : 'text-market-down'
          : 'text-gray-200';

        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${changeColor}`}>
              ${displayPrice.toFixed(2)}
            </span>
            {isLive && <Wifi className="w-3 h-3 text-green-400" title="Live data" />}
            {!isLive && staticPrice != null && (
              <span className="text-xs text-gray-500" title="Static price from database">DB</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('changePercent', {
      header: 'Change %',
      cell: (info) => {
        const changePercent = info.getValue();
        const priceChange = info.row.original.priceChange;
        
        if (changePercent == null || priceChange == null) {
          return <span className="text-gray-600">—</span>;
        }

        const isPositive = changePercent > 0;
        const colorClass = isPositive ? 'text-market-up' : changePercent < 0 ? 'text-market-down' : 'text-gray-400';

        return (
          <div className={`text-sm font-medium ${colorClass}`}>
            <div>{isPositive ? '+' : ''}{changePercent.toFixed(2)}%</div>
            <div className="text-xs opacity-75">
              {isPositive ? '+' : ''}${Math.abs(priceChange).toFixed(2)}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('market_cap', {
      header: 'Market Cap',
      cell: (info) => {
        const v = info.getValue();
        if (v == null) return <span className="text-gray-600">—</span>;
        if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
        if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
        if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
        return `$${v.toLocaleString()}`;
      },
    }),
    columnHelper.accessor('exchange', {
      header: 'Exchange',
      cell: (info) =>
        info.getValue() ? (
          <span className="text-gray-400">{info.getValue()}</span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    }),
    columnHelper.accessor('is_active', {
      header: 'Status',
      cell: (info) =>
        info.getValue() ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Inactive
          </span>
        ),
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [errors, clearError]);

  // STABILITY FIX: memoize filtered so useReactTable receives a stable data
  // reference. Previously this was recomputed on every render (including renders
  // triggered by loading-state changes), causing TanStack to reconcile all rows
  // on every poll interval even when data hadn't changed.
  const filtered = useMemo(() =>
    enhancedStocks.filter((stock) => {
      const q = globalFilter.toLowerCase();
      return (
        stock.symbol.toLowerCase().includes(q) ||
        stock.company_name.toLowerCase().includes(q) ||
        (stock.sector ?? '').toLowerCase().includes(q)
      );
    }),
  [enhancedStocks, globalFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const liveCount = Object.keys(quotes).length;
  const errorCount = Object.keys(errors).length;
  const totalSymbols = symbols.length;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Live Market</h1>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-gray-400">
            {totalSymbols} stocks tracked — {liveCount} live prices
          </p>
          {liveCount > 0 && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <Wifi className="w-4 h-4" />
              <span>Live updates every 5s</span>
            </div>
          )}
          {errorCount > 0 && (
            <button
              onClick={clearAllErrors}
              className="flex items-center gap-1 text-red-400 text-sm hover:text-red-300 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-black/20">
          <div className="relative flex-1 max-w-md" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  setFocusedIndex(-1);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                type="text"
                placeholder="Search stocks to track (e.g. AAPL, RELIANCE.NS)..."
                className="w-full bg-[#0a0a0b] border border-border/50 rounded-lg pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200 placeholder-gray-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 rounded-full border border-blue-500 border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            {/* Dropdown */}
            {isDropdownOpen && searchQuery.trim() !== '' && (
              <div className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-border/50 bg-[#0c0c0d]/95 backdrop-blur-md shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {isSearching && searchResults.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">Searching market provider...</div>
                )}
                {!isSearching && searchResults.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-400">No stocks found matching "{searchQuery}"</div>
                )}
                {searchResults.length > 0 && (
                  <div className="py-1">
                    {searchResults.map((item, idx) => {
                      const isTracked = stocks.some(
                        (s) => s.symbol.toUpperCase() === item.symbol.toUpperCase()
                      );
                      const isFocused = idx === focusedIndex;
                      
                      return (
                        <div
                          key={item.symbol}
                          className={`flex items-center justify-between px-4 py-3 border-b border-border/10 last:border-0 cursor-pointer transition-colors ${
                            isFocused ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                          }`}
                          onClick={() => {
                            if (!isTracked) {
                              handleAddStock(item.symbol);
                            }
                          }}
                          onMouseEnter={() => setFocusedIndex(idx)}
                        >
                          <div className="flex flex-col min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-100">{item.symbol}</span>
                              {item.exchange && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 uppercase font-mono">
                                  {item.exchange}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 truncate mt-0.5">{item.company_name}</span>
                            {item.country && (
                              <span className="text-[10px] text-gray-500 mt-0.5">{item.country}</span>
                            )}
                          </div>
                          <div>
                            {isTracked ? (
                              <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                                Tracked
                              </span>
                            ) : (
                              <button
                                disabled={addingSymbol === item.symbol}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddStock(item.symbol);
                                }}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-medium transition-colors shadow-sm cursor-pointer"
                              >
                                {addingSymbol === item.symbol ? (
                                  <div className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Track</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                type="text"
                placeholder="Filter tracked list..."
                className="w-full bg-[#0a0a0b] border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
              />
            </div>
            {error && (
              <button
                onClick={refetch}
                className="text-xs text-blue-400 hover:text-blue-300 underline whitespace-nowrap cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        </div>

        {loading && <LoadingSpinner message="Loading stocks…" />}
        {!loading && error && <ErrorMessage message={error} onRetry={refetch} />}
        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            message="No stocks found"
            subMessage={
              globalFilter
                ? `No results for "${globalFilter}"`
                : 'No stocks are available in the database yet.'
            }
          />
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-border/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-4 font-medium">
                        {header.isPlaceholder ? null : (
                          <div
                            className={
                              header.column.getCanSort()
                                ? 'cursor-pointer select-none flex items-center gap-1 hover:text-gray-200 transition-colors'
                                : ''
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-200'
                : 'bg-red-500/10 border-red-500/30 text-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p className="text-sm font-medium pr-2">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="hover:bg-white/10 rounded p-1 transition-colors flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-200" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
