import { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Card from './Card';
import Button from './Button';
import { createPortal } from 'react-dom';

const FilterSection = ({
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  onSearchKeyPress,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  viewMode,
  onViewModeChange,
  viewModeOptions = [],
  resultsCount,
  totalCount,
  className = "",
  showResultsSummary = true,
  showActiveFilters = true,
  showSearch = true,
  compact = false,
  columns = [],
  visibleColumns = [],
  onColumnVisibilityChange,
  showColumnControls = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const hasActiveFilters = Object.values(activeFilters).some(value => 
    value && value !== 'all' && value !== ''
  ) || searchValue;

  const clearAllFilters = () => {
    onSearchChange('');
    onClearFilters();
  };

  const removeFilter = (key) => {
    if (key === 'search') {
      onSearchChange('');
    } else {
      onFilterChange(key, 'all');
    }
  };

  const handleColumnToggle = (columnKey) => {
    if (onColumnVisibilityChange) {
      const newVisibleColumns = visibleColumns.includes(columnKey)
        ? visibleColumns.filter(col => col !== columnKey)
        : [...visibleColumns, columnKey];
      onColumnVisibilityChange(newVisibleColumns);
    }
  };

  const selectAllColumns = () => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(columns.map(col => col.key));
    }
  };

  const deselectAllColumns = () => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange([]);
    }
  };

  // Add refs and dropdown positioning logic
  const columnButtonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    if (showColumnSelector && columnButtonRef.current) {
      const rect = columnButtonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right - 320 + window.scrollX, // 320px is the dropdown width
        minWidth: '220px',
        maxWidth: '90vw',
      });
    }
  }, [showColumnSelector]);

  return (
    <div className={`relative ${className}`}>
      {/* Gradient Background - Updated to use theme colors */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 rounded-2xl opacity-60"></div>
      
      <Card 
        variant="elevated" 
        className="relative overflow-hidden border-0 shadow-xl backdrop-blur-sm bg-white/80"
        padding={compact ? "p-4 sm:p-5" : "p-6 sm:py-6 sm:px-8"}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 w-full">
            {/* Title - Updated to use theme colors */}
            <div className="flex items-center gap-3 flex-shrink-0 min-w-0 mb-2 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 whitespace-nowrap">Filters & Search</h3>
            </div>
            
            {/* Search Field - Updated to use theme colors */}
            {showSearch && (
              <div className="flex-1 min-w-0 mb-2 md:mb-0">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur-[2px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
                  <div className="relative flex">
                    <MagnifyingGlassIcon
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10 pointer-events-none"
                    />
                    <input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      onKeyPress={onSearchKeyPress}
                      className={`relative pl-10 ${onSearchSubmit ? 'pr-20' : 'pr-12'} w-full flex-1 sm:flex-none py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm min-w-0 appearance-none cursor-pointer`}
                    />
                    
                    {onSearchSubmit && (
                      <button
                        onClick={onSearchSubmit}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Search
                      </button>
                    )}
                    
                    {searchValue && !onSearchSubmit && (
                      <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-danger-500 hover:bg-danger-50 rounded-full transition-all duration-200"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons Container */}
            <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
              {/* Filters (if any) - Updated to use theme colors */}
              {filters.length > 0 && (
                <>
                  {filters.slice(0, 3).map((filter) => (
                    <div key={filter.key} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                      {filter.type === 'date' || filter.type === 'datetime-local' ? (
                        <input
                          type={filter.type || 'date'}
                          value={activeFilters[filter.key] || ''}
                          onChange={e => onFilterChange(filter.key, e.target.value)}
                          className="relative flex-1 sm:flex-none px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm min-w-0 appearance-none cursor-pointer"
                          placeholder={filter.placeholder || `All ${filter.label}`}
                        />
                      ) : (
                        <select
                          value={activeFilters[filter.key] || 'all'}
                          onChange={(e) => onFilterChange(filter.key, e.target.value)}
                          className="relative flex-1 sm:flex-none px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm min-w-0 appearance-none cursor-pointer"
                        >
                          <option value="all">{filter.placeholder || `All ${filter.label}`}</option>
                          {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {filter.type !== 'date' && filter.type !== 'datetime-local' && (
                        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      )}
                    </div>
                  ))}
                  
                  {/* Advanced Filters Toggle - Updated to use theme colors */}
                  {filters.length > 3 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <AdjustmentsHorizontalIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Advanced</span>
                      <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  )}
                </>
              )}
              
              {/* Column Visibility Toggle - Updated to use primary theme colors */}
              {showColumnControls && columns.length > 0 && (
                <div className="relative inline-block">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className="flex py-3 items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-xl duration-300 hover:text-white"
                    ref={buttonRef => {
                      if (buttonRef) columnButtonRef.current = buttonRef;
                    }}
                  >
                    <EyeIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Columns</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${showColumnSelector ? 'rotate-180' : ''}`} />
                  </Button>
                  {showColumnSelector && typeof window !== 'undefined' && createPortal(
                    <>
                      {/* Backdrop for click-away, but not covering the dropdown */}
                      <div
                        className="fixed inset-0 z-[1000]"
                        onClick={() => setShowColumnSelector(false)}
                      />
                      <div
                        ref={dropdownRef}
                        className="fixed z-[1010] w-80 max-w-[95vw] bg-white rounded-xl shadow-2xl border border-gray-200 p-5 animate-fade-in flex flex-col gap-4 max-h-96 overflow-y-auto"
                        style={dropdownStyle}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="p-1.5 bg-primary-100 rounded-lg">
                              <EyeIcon className="h-4 w-4 text-primary-600" />
                            </div>
                            <span className="font-medium">Column Visibility:</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {columns.map((column) => {
                            const isVisible = visibleColumns.includes(column.key);
                            const isHiddenByDefault = !visibleColumns.includes(column.key);
                            return (
                              <label
                                key={column.key}
                                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-200 w-full ${
                                  isVisible 
                                    ? 'border-primary-200 bg-primary-50 hover:bg-primary-100' 
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => handleColumnToggle(column.key)}
                                    className={`focus:outline-none transition-colors rounded-full p-1 ${isVisible ? 'hover:bg-primary-100' : 'hover:bg-gray-100'}`}
                                    title={isVisible ? 'Hide column' : 'Show column'}
                                  >
                                    {isVisible ? (
                                      <EyeIcon className="h-4 w-4 text-primary-600" />
                                    ) : (
                                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                  <span
                                    className={`text-sm ${isVisible ? 'text-gray-900' : 'text-gray-600'} flex-1 min-w-0 truncate whitespace-nowrap max-w-[260px]`}
                                    style={{ wordBreak: 'break-word' }}
                                    title={column.label}
                                  >
                                    {column.label}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span>Visible columns</span>
                          <div className="w-2 h-2 bg-gray-300 rounded-full ml-4"></div>
                          <span>Hidden columns</span>
                        </div>
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              )}
            </div>
            
            {/* Grid/List View Toggle - Updated to use theme colors */}
            {viewModeOptions.length > 0 && (
              <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-2 border-gray-200/200 mb-2 md:mb-0 self-start md:self-center">
                {viewModeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onViewModeChange(option.value)}
                    className={`p-2 rounded-xl transition-all duration-300 ${
                      viewMode === option.value
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg transform scale-110'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                    }`}
                    title={option.label}
                  >
                    {option.icon && <option.icon className="h-5 w-5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Advanced Filters (Collapsible) - Updated to use theme colors */}
          {isExpanded && filters.length > 3 && (
            <div className="pt-4 border-t border-gray-200/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filters.slice(3).map((filter) => (
                  <div key={filter.key} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl blur-sm opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    {filter.type === 'date' || filter.type === 'datetime-local' ? (
                      <input
                        type={filter.type || 'date'}
                        value={activeFilters[filter.key] || ''}
                        onChange={e => onFilterChange(filter.key, e.target.value)}
                        className="relative w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm appearance-none cursor-pointer"
                        placeholder={filter.placeholder || `All ${filter.label}`}
                      />
                    ) : (
                      <select
                        value={activeFilters[filter.key] || 'all'}
                        onChange={(e) => onFilterChange(filter.key, e.target.value)}
                        className="relative w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="all">{filter.placeholder || `All ${filter.label}`}</option>
                        {filter.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {filter.type !== 'date' && filter.type !== 'datetime-local' && (
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Active Filters Display - Updated to use theme colors */}
          {showActiveFilters && hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <FunnelIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <span className="font-medium">Active filters:</span>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors hover:bg-primary-50 px-3 py-1.5 rounded-lg"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchValue && (
                  <span className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                    <MagnifyingGlassIcon className="h-3 w-3" />
                    "{searchValue}"
                    <button 
                      onClick={() => removeFilter('search')} 
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.map((filter) => {
                  const value = activeFilters[filter.key];
                  if (value && value !== 'all') {
                    const option = filter.options.find(opt => opt.value === value);
                    return (
                      <span key={filter.key} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                        <FunnelIcon className="h-3 w-3" />
                        {filter.label}: {option?.label || value}
                        <button 
                          onClick={() => removeFilter(filter.key)} 
                          className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FilterSection;
