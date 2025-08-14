import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Table = ({ 
  columns, 
  data, 
  onSort, 
  sortColumn, 
  sortDirection = 'asc',
  onRowClick,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  const handleSort = (column) => {
    if (onSort) {
      const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(column, newDirection);
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ChevronUpIcon className="h-4 w-4 text-white/60" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4 text-white" />
      : <ChevronDownIcon className="h-4 w-4 text-white" />;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="animate-pulse p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Derive responsive column sets
  const actionColumn = columns.find((c) => c.key === 'actions');
  const selectableColumn = columns.find((c) => c.key === 'select');
  const priorityColumns = columns.filter(
    (c) => c.mobilePriority && c.key !== 'actions' && c.key !== 'select'
  );
  const defaultContentColumns = columns.filter(
    (c) => c.key !== 'actions' && c.key !== 'select'
  );
  const leadColumns = (priorityColumns.length > 0 ? priorityColumns : defaultContentColumns).slice(0, 2);
  const secondaryColumns = columns.filter(
    (c) => !leadColumns.some((p) => p.key === c.key) && c.key !== 'actions' && c.key !== 'select'
  );
  const tabletBaseColumns = (priorityColumns.length > 0 ? priorityColumns : defaultContentColumns).slice(0, 4);
  const tabletColumns = [
    ...([selectableColumn].filter(Boolean)),
    ...tabletBaseColumns,
    ...([actionColumn].filter(Boolean))
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 border-b border-primary-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-primary-500/20 transition-colors' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{emptyMessage}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-100 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tablet Table */}
      <div className="hidden lg:block xl:hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 border-b border-primary-700">
              <tr>
                {tabletColumns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-primary-500/20 transition-colors' : ''
                    }`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-gray-50">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={tabletColumns.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-medium text-sm">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-gray-100 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {tabletColumns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="block lg:hidden">
        {data.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium">{emptyMessage}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={`p-4 hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                <div className="space-y-3">
                  {/* Priority/Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      {selectableColumn && (
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          {selectableColumn.render ? selectableColumn.render(row[selectableColumn.key], row) : row[selectableColumn.key]}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        {leadColumns[0] && (
                          <div className="font-medium text-gray-900 break-words">
                            {leadColumns[0].render ? leadColumns[0].render(row[leadColumns[0].key], row) : row[leadColumns[0].key]}
                          </div>
                        )}
                        {leadColumns[1] && (
                          <div className="text-xs text-gray-600 break-words">
                            {leadColumns[1].render ? leadColumns[1].render(row[leadColumns[1].key], row) : row[leadColumns[1].key]}
                          </div>
                        )}
                      </div>
                    </div>
                    {actionColumn && (
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0 flex flex-wrap gap-2">
                        {actionColumn.render ? actionColumn.render(row[actionColumn.key], row) : row[actionColumn.key]}
                      </div>
                    )}
                  </div>

                  {/* Secondary Grid */}
                  {secondaryColumns.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {secondaryColumns.slice(0, 4).map((column) => (
                        <div key={column.key} className="space-y-1 min-w-0">
                          <span className="text-gray-500 font-medium">{column.label}</span>
                          <div className="text-gray-900 break-words">
                            {column.render ? column.render(row[column.key], row) : row[column.key]}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional overflow columns */}
                  {secondaryColumns.length > 4 && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {secondaryColumns.slice(4).map((column) => (
                          <div key={column.key} className="space-y-1 min-w-0">
                            <span className="text-gray-500 font-medium">{column.label}</span>
                            <div className="text-gray-900 break-words">
                              {column.render ? column.render(row[column.key], row) : row[column.key]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Table; 