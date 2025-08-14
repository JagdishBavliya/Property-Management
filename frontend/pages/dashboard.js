import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

// Redux
import { 
  fetchDashboardData,
  selectDashboardStats,
  selectPropertyStats,
  selectAgentStats,
  selectBrokerageStats,
  selectDashboardLoading,
  selectDashboardError,
  clearError
} from '../store/slices/dashboardSlice';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FORMATCURRENCY } from '../utils/constants';

import {
  BuildingOfficeIcon, BuildingStorefrontIcon, EyeIcon, CurrencyDollarIcon,
  ChartBarIcon, ArrowUpIcon, ArrowDownIcon, UsersIcon,
} from '@heroicons/react/24/outline';

const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0);
const QuickActionButton = ({ icon: Icon, title, subtitle, color, onClick }) => (
  <Button 
    variant="primary" 
    className={`flex flex-col items-center py-6 px-4 h-auto min-h-[120px] bg-gradient-to-br ${color} hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0`}
    onClick={onClick}
  >
    <div className="mb-3 p-3 bg-white/20 rounded-full backdrop-blur-sm">
      <Icon className="h-8 w-8 text-white" />
    </div>
    <span className="text-sm font-semibold text-white">{title}</span>
    <span className="text-xs text-white/80 mt-1">{subtitle}</span>
  </Button>
);

const StatCard = ({ title, value, change, changeType, icon: Icon, color }) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center mt-2">
          {changeType === 'increase' ? (
            <ArrowUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm ml-1 ${
            changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
          <span className="text-sm text-gray-500 ml-1">from last month</span>
        </div>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch();

  // Redux selectors
  const dashboardStats = useSelector(selectDashboardStats);
  const propertyStats = useSelector(selectPropertyStats);
  const agentStats = useSelector(selectAgentStats);
  const brokerageStats = useSelector(selectBrokerageStats);
  const loading = useSelector(selectDashboardLoading);
  const error = useSelector(selectDashboardError);

  useEffect(() => { dispatch(fetchDashboardData()); }, [dispatch]);
  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const summaryData = useMemo(() => [
    {
      title: 'Total Properties',
      value: formatNumber(dashboardStats.totalProperties),
      change: `${propertyStats.change}%`,
      changeType: propertyStats.changeType,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Agents',
      value: formatNumber(dashboardStats.activeAgents),
      change: `${agentStats.change}%`,
      changeType: agentStats.changeType,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Total Brokerages',
      value: formatNumber(dashboardStats.totalBrokerages),
      change: `${brokerageStats.change}%`,
      changeType: brokerageStats.changeType,
      icon: BuildingStorefrontIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Properties Listed This Month',
      value: formatNumber(dashboardStats.propertiesThisMonth),
      change: '+8%',
      changeType: 'increase',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-400',
    },
    {
      title: 'Total Revenue',
      value: FORMATCURRENCY(dashboardStats.totalRevenue),
      change: '+18%',
      changeType: 'increase',
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
    },
    {
      title: 'Pending Approvals',
      value: formatNumber(dashboardStats.pendingApprovals),
      change: '+2',
      changeType: 'increase',
      icon: EyeIcon,
      color: 'bg-yellow-500',
    },
  ], [dashboardStats, propertyStats, agentStats, brokerageStats]);

  const quickActions = useMemo(() => [
    {
      icon: BuildingOfficeIcon,
      title: 'Add Property',
      subtitle: 'Create new listing',
      color: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      onClick: () => router.push('/properties/create'),
    },
    {
      icon: BuildingStorefrontIcon,
      title: 'Manage Brokerage',
      subtitle: 'View all brokerages',
      color: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      onClick: () => router.push('/brokerages'),
    },
    {
      icon: UsersIcon,
      title: 'Manage Visits',
      subtitle: 'Manage team',
      color: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      onClick: () => router.push('/visits'),
    },
    {
      icon: ChartBarIcon,
      title: 'View Reports',
      subtitle: 'View analytics',
      color: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      onClick: () => router.push('/reports'),
    },
  ], [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <QuickActionButton key={index} {...action} />
            ))}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaryData.map((item, index) => (
              <StatCard key={index} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 