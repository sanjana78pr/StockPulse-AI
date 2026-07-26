import { useState } from 'react';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  type SortingState
} from '@tanstack/react-table';
import { liveMarketStocks } from '../lib/mockData';
import { Search, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

type Stock = typeof liveMarketStocks[0];
const columnHelper = createColumnHelper<Stock>();

export default function LiveMarket() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = [
    columnHelper.accessor('symbol', {
      header: 'Symbol',
      cell: info => <span className="font-bold text-gray-200">{info.getValue()}</span>,
    }),
    columnHelper.accessor('name', {
      header: 'Company Name',
      cell: info => <span className="text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('sector', {
      header: 'Sector',
      cell: info => (
        <span className="px-2 py-1 rounded-full bg-white/5 text-xs text-gray-300 border border-border/50">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: info => <span className="font-medium">${info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor('change', {
      header: 'Change %',
      cell: info => {
        const val = info.getValue();
        const isPositive = val >= 0;
        return (
          <div className={cn("flex items-center", isPositive ? "text-market-up" : "text-market-down")}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(val)}%
          </div>
        );
      },
    }),
    columnHelper.accessor('volume', {
      header: 'Volume',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('marketCap', {
      header: 'Market Cap',
      cell: info => info.getValue(),
    }),
  ];

  const table = useReactTable({
    data: liveMarketStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(globalFilter.toLowerCase()) || 
      stock.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      stock.sector.toLowerCase().includes(globalFilter.toLowerCase())
    ),
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Live Market</h1>
        <p className="text-gray-400 mt-1">Real-time stock quotes, volume, and market capitalizations.</p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              type="text"
              placeholder="Filter symbols, names, or sectors..."
              className="w-full bg-[#0a0a0b] border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-border/50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-6 py-4 font-medium">
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1 hover:text-gray-200 transition-colors'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-border/20 hover:bg-white/[0.02] transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {table.getRowModel().rows.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No stocks found matching your filter.
          </div>
        )}
      </div>
    </div>
  );
}