import { useRouter } from 'next/router';
import Button from './Button';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

const Breadcrumb = ({  items = [],  className = "", showBackButton = true, backButtonText = null, backButtonHref = null}) => {
  const router = useRouter();

  const handleBackClick = () => {
    if (backButtonHref) {
      router.push(backButtonHref);
    } else {
      router.back();
    }
  };

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center ${className}`}>
      {showBackButton && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="!px-2 !py-1 bg-white/80 hover:bg-primary-50 rounded-full shadow-none border border-gray-200 text-gray-700 font-medium flex items-center gap-1"
          >
            <ChevronRightIcon className="h-4 w-4 rotate-180" />
            {backButtonText || items[0]?.label || 'Back'}
          </Button>
          {items.length > 1 && (
            <span className="mx-2 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </>
      )}
      
      {items.slice(1).map((item, index) => (
        <div key={index} className="flex items-center">
          <span className="bg-gray-100 rounded-full px-2 py-1 flex items-center gap-1 text-xs font-medium text-gray-500 shadow-sm">
            {item.icon && <item.icon className="h-4 w-4 text-primary-400" />}
            <span className="truncate max-w-[100px]">{item.label}</span>
          </span>
          {index < items.slice(1).length - 1 && (
            <span className="mx-2 text-gray-400">
              <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb; 