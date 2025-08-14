import React from 'react';
import Button from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  hasNextPage, 
  hasPrevPage,
  total,
  perPage 
}) => {
  // Convert to numbers and provide fallbacks
  const currentPageNum = parseInt(currentPage) || 1;
  const perPageNum = parseInt(perPage) || 10;
  const totalNum = parseInt(total) || 0;
  const totalPagesNum = parseInt(totalPages) || 1;
  
  const startItem = (currentPageNum - 1) * perPageNum + 1;
  const endItem = Math.min(currentPageNum * perPageNum, totalNum);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPagesNum <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPagesNum; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPagesNum, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end === totalPagesNum) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (totalPagesNum <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPageNum - 1)}
            disabled={!hasPrevPage}
            className="flex items-center space-x-1"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={page === currentPageNum ? "primary" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPageNum + 1)}
            disabled={!hasNextPage}
            className="flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination; 