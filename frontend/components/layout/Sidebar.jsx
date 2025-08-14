import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/router';
import { Cinzel } from 'next/font/google';
import CheckPermission from '../ui/CkeckPermission';
import { LOGO_IMAGE } from '../../utils/constants';
import {
  HomeIcon, BuildingOfficeIcon, BuildingStorefrontIcon, 
  CalculatorIcon, EyeIcon, ChartBarIcon, BellIcon,
  CogIcon, UserIcon, ChevronLeftIcon, ChevronRightIcon,
  XMarkIcon, UsersIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
const cinzel = Cinzel({ subsets: ['latin'], weight: '700', display: 'swap'});


const Sidebar = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'] },
    { name: 'Admins', href: '/admins', icon: UserIcon, roles: ['Super Admin'], permission: 'admin-list' },
    { name: 'Managers', href: '/managers', icon: UsersIcon, roles: ['Super Admin', 'Admin'], permission: 'manager-list' },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon, roles: ['Super Admin', 'Admin', 'Manager'], permission: 'agent-list' },
    { name: 'Properties', href: '/properties', icon: BuildingOfficeIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'property-list' },
    { name: 'Brokerages', href: '/brokerages', icon: BuildingStorefrontIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'brokerage-list' },
    { name: 'Estimates', href: '/estimates', icon: CalculatorIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'estimate-list' },
    { name: 'Visits', href: '/visits', icon: EyeIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'visit-list' },
    { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'report-list' },
    { name: 'Notifications', href: '/notifications', icon: BellIcon, roles: ['Super Admin', 'Admin', 'Manager', 'Agent'], permission: 'notification-list' },
    { name: 'Settings', href: '/settings', icon: CogIcon, roles: ['Super Admin'] },
  ], []);

  const filteredNavigation = useMemo(() => 
    loading || !user?.role ? [] : navigation.filter(item => item.roles.includes(user.role)),
    [navigation, user?.role, loading]
  );

  const isActive = useCallback((href) => 
    href === '/dashboard' ? router.pathname === '/dashboard' || router.pathname.startsWith('/dashboard/') 
                        : router.pathname === href || router.pathname.startsWith(href),
    [router.pathname]
  );

  const handleNavigation = useCallback(async (href) => {
    if (isNavigating) return;
    const currentPath = router.pathname;
    if ((href === '/dashboard' && (currentPath === '/dashboard' || currentPath.startsWith('/dashboard/'))) ||
        (href !== '/dashboard' && currentPath === href)) return;
    
    setIsNavigating(true);
    try {
      await router.push(href);
      if (window.innerWidth < 1024) onClose();
    } catch (error) {
      if (error.message.includes('Invariant: attempted to hard navigate to the same URL')) {
        try { await router.push('/dashboard'); } catch {} 
      }
    } finally {
      setIsNavigating(false);
    }
  }, [isNavigating, router, onClose]);

  const LoadingSkeleton = () => (
    <div className={`${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${isCollapsed ? 'flex justify-center w-12 h-10 mx-auto rounded-xl' : 'px-3 py-2 rounded-lg'}`}>
          {isCollapsed ? (
            <div className="w-9 h-9 rounded-xl bg-gray-200 animate-pulse" />
          ) : (
            <div className="flex items-center">
              <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
              <div className="ml-3 flex-1 h-4 bg-gray-200 rounded animate-pulse w-20" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const buttonContent = (
      <button
        onClick={() => handleNavigation(item.href)}
        disabled={isNavigating}
        className={`
          group w-full text-left transition-all duration-200
          ${active ? 'text-primary-700' : 'text-gray-600 hover:text-gray-900'}
          ${isNavigating ? 'opacity-50 cursor-not-allowed' : ''}
          ${isCollapsed ? 'flex justify-center items-center w-12 h-10 mx-auto rounded-xl' : 'px-3 py-0 rounded-lg'}
        `}
        title={isCollapsed ? item.name : ''}
      >
        {isCollapsed ? (
          <div className={`
            w-9 h-9 rounded-xl shadow-sm border flex items-center justify-center transition-all duration-200
            ${active ? 'bg-primary-100 text-primary-700 border-primary-200 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200 hover:shadow-md'}
          `}>
            <Icon className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex items-center">
            <div className={`
              p-2 rounded-lg transition-all duration-200
              ${active ? 'bg-primary-100 text-primary-700' : 'text-gray-500 group-hover:text-primary-600 group-hover:bg-primary-50'}
            `}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <span className={`text-sm font-medium ${active ? 'text-primary-700' : 'text-gray-700 group-hover:text-gray-900'}`}>
                {item.name}
              </span>
            </div>
            {isNavigating && active && (
              <div className="ml-2 animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
            )}
          </div>
        )}
      </button>
    );

    return item.permission ? (
      <CheckPermission key={item.name} permission={item.permission}>
        {buttonContent}
      </CheckPermission>
    ) : (
      <div key={item.name}>{buttonContent}</div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-white shadow-xl border-r border-gray-100 transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
          flex flex-col h-full transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
        `}
        style={{ maxWidth: isCollapsed ? '4rem' : '16rem' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b border-gray-100 bg-white ${isCollapsed ? 'h-16' : 'h-16 px-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full h-full' : 'space-x-2'}`}>
            <img 
              src={LOGO_IMAGE} 
              alt="Property Management System" 
              width={isCollapsed ? 45 : 45} 
              height={isCollapsed ? 45 : 45} 
              className={`rounded-lg shadow-sm transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}
            />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={`text-2xl font-bold text-primary-700 ${cinzel.className}`} style={{ fontSize: '1.2rem', lineHeight: '1' }}>Property</span>
                <span className="text-xs text-gray-700 font-medium" style={{ lineHeight: '1' }}>Management System</span>
              </div>
            )}
          </div>
          
          <button
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="hidden lg:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -right-3 bg-white text-gray-600 shadow-lg border border-gray-200 p-1.5 h-7 w-7 transition-all duration-300 ease-in-out hover:bg-gray-50 rounded-full z-50 hover:shadow-xl"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronLeftIcon className="h-3 w-3" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2 py-2' : 'px-3 py-3'}`}>
          {loading ? <LoadingSkeleton /> : filteredNavigation.map(item => <NavItem key={item.name} item={item} />)}
        </nav>
        
      </aside>
    </>
  );
};

export default Sidebar; 