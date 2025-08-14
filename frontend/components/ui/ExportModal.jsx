import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import Button from './Button';
import { ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';

/**
 * Reusable ExportModal component for exporting data with filters and format selection.
 *
 * Usage:
 * <ExportModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onExport={handleExport}
 *   loading={loading}
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   filterOptions={filterOptions}
 *   exportFormat={exportFormat}
 *   onFormatChange={setExportFormat}
 *   formats={[{ value: 'csv', label: 'CSV', icon: ..., description: 'Spreadsheet' }, ...]}
 *   title="Export Data"
 *   description="Choose format and filters to export."
 *   confirmText="Export"
 *   cancelText="Cancel"
 * />
 */
const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  loading,
  filters,
  onFilterChange,
  filterOptions,
  exportFormat,
  onFormatChange,
  formats,
  title,
  description,
  confirmText = 'Export',
  cancelText = 'Cancel',
}) => {
  // Helper function to get format-specific colors
  const getFormatColors = (formatValue) => {
    switch (formatValue.toLowerCase()) {
      case 'csv':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-200',
          selectedBg: 'from-green-100 to-emerald-100',
          selectedBorder: 'border-green-500',
          icon: 'text-green-600',
          text: 'text-green-700'
        };
      case 'pdf':
        return {
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-200',
          selectedBg: 'from-red-100 to-rose-100',
          selectedBorder: 'border-red-500',
          icon: 'text-red-600',
          text: 'text-red-700'
        };
      case 'excel':
        return {
          bg: 'from-green-50 to-emerald-50',
          border: 'border-green-200',
          selectedBg: 'from-green-100 to-emerald-100',
          selectedBorder: 'border-green-500',
          icon: 'text-green-600',
          text: 'text-green-700'
        };
      case 'json':
        return {
          bg: 'from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          selectedBg: 'from-yellow-100 to-amber-100',
          selectedBorder: 'border-yellow-500',
          icon: 'text-yellow-600',
          text: 'text-yellow-700'
        };
      default:
        return {
          bg: 'from-primary-50 to-primary-100',
          border: 'border-primary-200',
          selectedBg: 'from-primary-100 to-primary-200',
          selectedBorder: 'border-primary-500',
          icon: 'text-primary-600',
          text: 'text-primary-700'
        };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="relative">
        {/* Header Section - Compact */}
        <div className="text-center mb-4">
          <div className="relative inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl opacity-10"></div>
            <ArrowDownTrayIcon className="h-6 w-6 text-primary-600 relative z-10" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto">{description}</p>
        </div>

        {/* Export Format Selection - Compact */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 rounded-xl opacity-60"></div>          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-lg flex-shrink-0">
                <SparklesIcon className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Export Format</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((fmt) => {
                const colors = getFormatColors(fmt.value);
                return (
                  <label
                    key={fmt.value}
                    className={`relative cursor-pointer group transition-all duration-300 ${
                      exportFormat === fmt.value ? 'scale-105' : 'hover:scale-102'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={fmt.value}
                      checked={exportFormat === fmt.value}
                      onChange={() => onFormatChange(fmt.value)}
                      className="sr-only"
                    />
                    <div
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        exportFormat === fmt.value
                          ? `${colors.selectedBorder} bg-gradient-to-r ${colors.selectedBg} shadow-lg`
                          : `${colors.border} bg-gradient-to-r ${colors.bg} hover:border-gray-300 hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                            exportFormat === fmt.value
                              ? `${colors.selectedBorder} bg-gradient-to-r ${colors.selectedBg.replace('100', '500').replace('200', '600')}`
                              : 'border-gray-300 group-hover:border-gray-400'
                          }`}
                        >
                          {exportFormat === fmt.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {fmt.icon && (
                              <span className={`w-4 h-4 ${colors.icon} flex-shrink-0`}>
                                {fmt.icon}
                              </span>
                            )}
                            <span
                              className={`text-sm font-semibold transition-colors duration-200 truncate ${
                                exportFormat === fmt.value ? colors.text : 'text-gray-700'
                              }`}
                              title={fmt.label}
                            >
                              {fmt.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate" title={fmt.description}>
                            {fmt.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filters Section - Compact */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl opacity-60"></div>          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Export Filters</h4>
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0">Optional</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterOptions.map((filter) => (
                <div className="space-y-1.5" key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 truncate" title={filter.label}>
                    {filter.label}
                  </label>
                  {filter.type === 'date' ? (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg blur-[2px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
                      <input
                        type="date"
                        name={filter.key}
                        value={filters[filter.key] || ''}
                        onChange={(e) => onFilterChange(filter.key, e.target.value)}
                        className="relative block w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg blur-[2px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none"></div>
                      <select
                        name={filter.key}
                        value={filters[filter.key] || ''}
                        onChange={(e) => onFilterChange(filter.key, e.target.value)}
                        className="relative block w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all duration-300 bg-white/80 backdrop-blur-sm hover:border-gray-300 hover:bg-white shadow-sm appearance-none cursor-pointer"
                        disabled={filter.loading || loading}
                      >
                        {/* <option value="">All</option> */}
                        {filter.options && filter.options.map(opt => (
                          <option key={opt.value} value={opt.value} title={opt.label}>
                            {opt.label.length > 35 ? `${opt.label.substring(0, 35)}...` : opt.label}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-sm"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={onExport}
            loading={loading}
            disabled={loading}
            icon={ArrowDownTrayIcon}
            className="px-6 py-2.5 text-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
      ),
      value: PropTypes.string,
      placeholder: PropTypes.string,
      loading: PropTypes.bool,
      type: PropTypes.string,
    })
  ).isRequired,
  exportFormat: PropTypes.string.isRequired,
  onFormatChange: PropTypes.func.isRequired,
  formats: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      description: PropTypes.string,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
};

export default ExportModal; 