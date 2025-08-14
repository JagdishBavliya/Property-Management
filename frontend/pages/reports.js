"use client"
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

// Chart
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement,
  LineElement,
} from "chart.js";
import { useRoleFlags } from "../hooks/useRoleFlags";
import { useExportModal } from "../hooks/useExportModal";
import { FORMATCURRENCY } from "../utils/constants";

// Components
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import CodeBadge from "../components/ui/CodeBadge";
import ExportModal from "../components/ui/ExportModal";
import CheckPermission from "../components/ui/CkeckPermission";
import FilterSection from "../components/ui/FilterSection";

import {
  ChartBarIcon, ArrowDownTrayIcon, CurrencyRupeeIcon, UsersIcon,
  BuildingOfficeIcon, CalendarIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const REPORT_TYPES = [
  { value: "property", label: "Property Reports", icon: BuildingOfficeIcon },
  { value: "agent", label: "Agent Reports", icon: UsersIcon },
  { value: "manager", label: "Manager Reports", icon: ChartBarIcon },
  { value: "brokerage", label: "Brokerage Reports", icon: CurrencyRupeeIcon },
  { value: "visit", label: "Visit Reports", icon: CalendarIcon },
]

function dedupeOptions(options) {
  const seen = new Set();
  return options.filter(opt => {
    if (opt.value === undefined || opt.value === null || opt.value === '') return false;
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}

export default function Reports() {
  const { user } = useAuth();
  const { isAgent, isManager, isAdmin } = useRoleFlags();

  const availableReports = REPORT_TYPES.filter((report) => {
    if (isAgent) {
      return ["property", "agent", "visit"].includes(report.value);
    }
    if (isManager) {
      return ["property", "agent", "manager", "brokerage", "visit"].includes(report.value);
    }
    return true; // Admin/Super Admin: all reports
  });

  const [activeReport, setActiveReport] = useState("property");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState({});
  const [exportFilters, setExportFilters] = useState({});
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const cityOptions = [
    ...(reportData.cityStats
      ? reportData.cityStats.map(item => ({ value: item.city, label: item.city }))
      : [])
  ];
  const propertyTypeOptions = [
    ...(reportData.propertyTypeStats
      ? reportData.propertyTypeStats.map(item => ({ value: item.property_type, label: item.property_type }))
      : [])
  ];
  const agentCodeOptions = [
    ...(reportData.agentStats
      ? reportData.agentStats.map(item => ({ value: item.agent_code, label: item.agent_code }))
      : [])
  ];
  const managerCodeOptions = [
    ...(reportData.teamStats
      ? reportData.teamStats.map(item => ({ value: item.manager_code, label: item.manager_code }))
      : [])
  ];
  const paymentModeOptions = [
    ...(reportData.paymentModeStats
      ? reportData.paymentModeStats.map(item => ({ value: item.payment_mode, label: item.payment_mode }))
      : [])
  ];
  const statusOptions = [
    ...(reportData.statusTrends
      ? reportData.statusTrends.map(item => ({ value: item.visit_status, label: item.visit_status }))
      : [])
  ];

  // Dynamic filter options for FilterSection (reuse dropdowns from export logic)
  const mainCityOptions = dedupeOptions(
    reportData.cityStats ? reportData.cityStats.map(item => ({ value: item.city, label: item.city })) : []
  );
  const mainPropertyTypeOptions = dedupeOptions(
    reportData.propertyTypeStats ? reportData.propertyTypeStats.map(item => ({ value: item.property_type, label: item.property_type })) : []
  );
  const mainAgentCodeOptions = dedupeOptions(
    reportData.agentStats ? reportData.agentStats.map(item => ({ value: item.agent_code, label: item.agent_code })) : []
  );
  const mainManagerCodeOptions = dedupeOptions(
    reportData.teamStats ? reportData.teamStats.map(item => ({ value: item.manager_code, label: item.manager_code })) : []
  );
  const mainPaymentModeOptions = dedupeOptions(
    reportData.paymentModeStats ? reportData.paymentModeStats.map(item => ({ value: item.payment_mode, label: item.payment_mode })) : []
  );
  const mainStatusOptions = dedupeOptions(
    reportData.statusTrends ? reportData.statusTrends.map(item => ({ value: item.visit_status, label: item.visit_status })) : []
  );

  // Function to get filter options based on report type
  const getExportFilterOptions = () => {
    switch (activeReport) {
      case "property":
        return [
          {
            label: "City",
            key: "city",
            type: "select",
            options: cityOptions,
            value: exportFilters.city || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, city: val })),
          },
          {
            label: "Property Type",
            key: "propertyType",
            type: "select",
            options: propertyTypeOptions,
            value: exportFilters.propertyType || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, propertyType: val })),
          },
          {
            label: "Date From",
            key: "dateFrom",
            type: "date",
            value: exportFilters.dateFrom || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateFrom: val })),
          },
          {
            label: "Date To",
            key: "dateTo",
            type: "date",
            value: exportFilters.dateTo || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateTo: val })),
          },
        ];
      case "agent":
        return [
          {
            label: "Agent Code",
            key: "agentCode",
            type: "select",
            options: agentCodeOptions,
            value: exportFilters.agentCode || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, agentCode: val })),
          },
          {
            label: "Date From",
            key: "dateFrom",
            type: "date",
            value: exportFilters.dateFrom || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateFrom: val })),
          },
          {
            label: "Date To",
            key: "dateTo",
            type: "date",
            value: exportFilters.dateTo || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateTo: val })),
          },
        ];
      case "manager":
        return [
          {
            label: "Manager Code",
            key: "managerCode",
            type: "select",
            options: managerCodeOptions,
            value: exportFilters.managerCode || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, managerCode: val })),
          },
          {
            label: "Date From",
            key: "dateFrom",
            type: "date",
            value: exportFilters.dateFrom || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateFrom: val })),
          },
          {
            label: "Date To",
            key: "dateTo",
            type: "date",
            value: exportFilters.dateTo || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateTo: val })),
          },
        ];
      case "brokerage":
        return [
          {
            label: "Payment Mode",
            key: "paymentMode",
            type: "select",
            options: paymentModeOptions,
            value: exportFilters.paymentMode || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, paymentMode: val })),
          },
          {
            label: "Date From",
            key: "dateFrom",
            type: "date",
            value: exportFilters.dateFrom || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateFrom: val })),
          },
          {
            label: "Date To",
            key: "dateTo",
            type: "date",
            value: exportFilters.dateTo || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateTo: val })),
          },
        ];
      case "visit":
        return [
          {
            label: "Status",
            key: "status",
            type: "select",
            options: statusOptions,
            value: exportFilters.status || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, status: val })),
          },
          {
            label: "Date From",
            key: "dateFrom",
            type: "date",
            value: exportFilters.dateFrom || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateFrom: val })),
          },
          {
            label: "Date To",
            key: "dateTo",
            type: "date",
            value: exportFilters.dateTo || "",
            onChange: (val) => setExportFilters((prev) => ({ ...prev, dateTo: val })),
          },
        ];
      default:
        return [];
    }
  };

  // Filter configs for FilterSection
  const getMainFilterConfigs = () => {
    switch (activeReport) {
      case 'property':
        return [
          {
            label: 'City',
            key: 'city',
            type: 'select',
            options: mainCityOptions,
            placeholder: 'All Cities',
          },
          {
            label: 'Property Type',
            key: 'propertyType',
            type: 'select',
            options: mainPropertyTypeOptions,
            placeholder: 'All Types',
          },
        ];
      case 'agent':
        return [
          {
            label: 'Agent Code',
            key: 'agentCode',
            type: 'select',
            options: mainAgentCodeOptions,
            placeholder: 'All Agents',
          },
        ];
      case 'manager':
        return [
          {
            label: 'Manager Code',
            key: 'managerCode',
            type: 'select',
            options: mainManagerCodeOptions,
            placeholder: 'All Managers',
          },
        ];
      case 'brokerage':
        return [
          {
            label: 'Payment Mode',
            key: 'paymentMode',
            type: 'select',
            options: mainPaymentModeOptions,
            placeholder: 'All Modes',
          },
        ];
      case 'visit':
        return [
          {
            label: 'Status',
            key: 'status',
            type: 'select',
            options: mainStatusOptions,
            placeholder: 'All Statuses',
          },
        ];
      default:
        return [];
    }
  };

  // Export modal logic via hook
  const {
    showExportModal,
    setShowExportModal,
    exportFormat,
    setExportFormat,
    exportLoading,
    handleExport,
  } = useExportModal({
    endpoint: "/api/reports/export",
    getParams: () => ({
      reportType: activeReport,
      ...exportFilters,
    }),
    filenamePrefix: `${activeReport}_report`,
  });

  // Update fetchReportData to use filters
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        reportType: activeReport,
        ...filters,
      });
      const res = await axiosInstance.get(`/api/reports/${activeReport}?${params}`);
      setReportData(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch report data");
      setReportData({});
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters or report type change
  useEffect(() => {
    fetchReportData();
  }, [activeReport, filters]);

  // Handler for filter changes
  const handleMainFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  // Handler for search changes - REQUIRED by FilterSection
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Handler to clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  // Add this function to handle search changes in the expected format
  // const handleFilterSectionChange = (arg1, arg2) => {
  //   if (typeof arg1 === 'object' && arg1.name === 'search') {
  //     setSearchTerm(arg1.value);
  //     setFilters(prev => ({ ...prev, search: arg1.value }));
  //   } else {
  //     handleMainFilterChange(arg1, arg2);
  //   }
  // };

  // Handler to open export modal and sync exportFilters with main filters
  const handleOpenExportModal = () => {
    setExportFilters(filters); // Copy current main filters to export filters
    setShowExportModal(true);
  };

  // Clear error after 4 seconds
  useEffect(() => {
    if (error) {
      toast.error(error);
      const timer = setTimeout(() => setError("") , 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear error when filters or report type change
  useEffect(() => {
    setError("");
  }, [activeReport, filters]);

  // Handler for retrying fetch
  const handleRetry = () => {
    fetchReportData();
  };


  const getChartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: title,
      },
    },
  })

  const renderPropertyReports = () => {
    if (!reportData.totalStats) return null

    const { totalStats, propertyTypeStats, cityStats, monthlyTrends } = reportData

    const propertyTypeChartData = {
      labels: propertyTypeStats?.map((item) => item.property_type) || [],
      datasets: [
        {
          data: propertyTypeStats?.map((item) => item.total_amount) || [],
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
          ],
        },
      ],
    }

    const cityChartData = {
      labels: cityStats?.map((item) => item.city) || [],
      datasets: [
        {
          label: 'Total Amount',
          data: cityStats?.map((item) => item.total_amount) || [],
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 2,
        },
      ],
    }

    const monthlyTrendsData = {
      labels: monthlyTrends?.map((item) => item.month) || [],
      datasets: [
        {
          label: 'Sales Amount',
          data: monthlyTrends?.map((item) => item.total_amount) || [],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    }

    return (
      <div className="space-y-6">
        <CheckPermission permission="report-stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Deals */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{totalStats.total_deals}</p>
                </div>
              </div>
            </Card>
            {/* Completed Deals */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Completed Deals</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{totalStats.completed_deals}</p>
                </div>
              </div>
            </Card>
            {/* Total Amount */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(totalStats.total_amount)}</p>
                </div>
              </div>
            </Card>
            {/* Avg Deal Amount */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Avg Deal Amount</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(totalStats.avg_deal_amount)}</p>
                </div>
              </div>
            </Card>
          </div>
        </CheckPermission>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CheckPermission permission="report-property">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deals by Property Type</h3>
              <div className="h-64">
                <Pie data={propertyTypeChartData} options={getChartOptions("Property Type Distribution")} />
              </div>
            </Card>
          </CheckPermission>

          <CheckPermission permission="report-city">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Deals by City</h3>
              <div className="h-64">
                <Bar data={cityChartData} options={getChartOptions("City-wise Performance")} />
              </div>
            </Card>
          </CheckPermission>

        </div>

        <CheckPermission permission="report-monthly">


          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
            <div className="h-64">
              <Line data={monthlyTrendsData} options={getChartOptions("Monthly Sales Trends")} />
            </div>
          </Card>
        </CheckPermission>
      </div>
    )
  }

  const renderAgentReports = () => {
    if (!reportData.agentStats) return null

    const { agentStats, topAgents, commissionTrends } = reportData

    const topAgentsChartData = {
      labels: topAgents?.map((agent) => agent.agent_code) || [],
      datasets: [
        {
          label: "Commission Earned (₹)",
          data: topAgents?.map((agent) => agent.total_commission) || [],
          backgroundColor: "#10B981",
        },
      ],
    }

    const commissionTrendsData = {
      labels: commissionTrends?.map((item) => item.month) || [],
      datasets: [
        {
          label: "Commission (₹)",
          data: commissionTrends?.map((item) => item.total_commission) || [],
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.4,
        },
      ],
    }

    return (
      <div className="space-y-6">

        <CheckPermission permission="report-agent">

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Performance</h3>
            <div className="overflow-x-auto">
              <Table
                columns={[
                  { label: "Agent Code", key: "agent_code", render: (val) => <CodeBadge code={val} size="xxs" /> },
                  { label: "Total Deals", key: "total_deals", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Completed", key: "completed_deals", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Commission", key: "total_commission", render: (val) => <span className="text-sm font-medium text-gray-900">{FORMATCURRENCY(val)}</span> },
                  { label: "Overdraft", key: "overdraft_amount", render: (val) => <span className={"text-sm font-medium text-gray-900 "}>{FORMATCURRENCY(val)}</span> },
                ]}
                data={agentStats}
                className="shadow-2xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50 rounded-2xl"
                FORMATCURRENCY={FORMATCURRENCY}
              />
            </div>
          </Card>
        </CheckPermission>

        {!isAgent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <CheckPermission permission="report-top_performance">

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Agents</h3>
                <div className="h-64">
                  <Bar data={topAgentsChartData} options={getChartOptions("Top Agents by Commission")} />
                </div>
              </Card>
            </CheckPermission>

            <CheckPermission permission="report-commission">

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Trends</h3>
                <div className="h-64">
                  <Line data={commissionTrendsData} options={getChartOptions("Monthly Commission Trends")} />
                </div>
              </Card>
            </CheckPermission>
          </div>
        )}
      </div>
    )
  }

  const renderManagerReports = () => {
    if (!reportData.teamStats) return null

    const { teamStats, agentPerformance } = reportData

    return (
      <div className="space-y-6">

        <CheckPermission permission="report-stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamStats.map((team) => (
              <Card key={team.manager_code}>
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">Manager: {team.manager_code}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(team.total_commission)}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="inline-block bg-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full">Team: {team.team_size}</span>
                      <span className="inline-block bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full">Deals: {team.completed_deals}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CheckPermission>

        <CheckPermission permission="report-tem_member">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Team Member Performance</h3>
            <div className="overflow-x-auto">
              <Table
                columns={[
                  { label: "Manager", key: "manager_code", render: (val) => <CodeBadge code={val} size="xxs" /> },
                  { label: "Agent", key: "agent_code", render: (val) => <CodeBadge code={val} size="xxs" /> },
                  { label: "Total Deals", key: "total_deals", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Completed", key: "completed_deals", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Commission", key: "total_commission", render: (val) => <span className="text-sm font-medium text-gray-900">{FORMATCURRENCY(val)}</span> },
                ]}
                data={agentPerformance}
                className="shadow-2xl border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50 rounded-2xl"
                FORMATCURRENCY={FORMATCURRENCY}
              />
            </div>
          </Card>
        </CheckPermission>
      </div>
    )
  }

  const renderBrokerageReports = () => {
    if (!reportData.brokerageStats) return null

    const { brokerageStats, paymentModeStats, commissionSplits, monthlyBrokerage } = reportData

    // Ensure commissionSplits is an array and has the expected structure
    const safeCommissionSplits = Array.isArray(commissionSplits) ? commissionSplits : []

    const paymentModeChartData = {
      labels: paymentModeStats?.map((item) => item.payment_mode) || [],
      datasets: [
        {
          label: 'Total Brokerage',
          data: paymentModeStats?.map((item) => item.total_brokerage) || [],
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 2,
        },
      ],
    }

    const commissionSplitData = {
      labels: safeCommissionSplits.map((item) => item.category || ''),
      datasets: [
        {
          data: safeCommissionSplits.map((item) => item.amount || 0),
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
          ],
        },
      ],
    }

    const monthlyBrokerageData = {
      labels: monthlyBrokerage?.map((item) => item.month) || [],
      datasets: [
        {
          label: 'Brokerage Amount',
          data: monthlyBrokerage?.map((item) => item.total_brokerage) || [],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ],
    }

    return (
      <div className="space-y-6">
        <CheckPermission permission="report-stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Transactions */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{brokerageStats.total_transactions}</p>
                </div>
              </div>
            </Card>
            {/* Total Brokerage */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Brokerage</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(brokerageStats.total_brokerage)}</p>
                </div>
              </div>
            </Card>
            {/* Total Commission */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Commission</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(brokerageStats.total_commission)}</p>
                </div>
              </div>
            </Card>
            {/* Avg Brokerage */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <CurrencyRupeeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Avg Brokerage</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{FORMATCURRENCY(brokerageStats.avg_brokerage)}</p>
                </div>
              </div>
            </Card>
          </div>
        </CheckPermission>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <CheckPermission permission="report-patment_mode">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Brokerage by Payment Mode</h3>
              <div className="h-64">
                <Bar data={paymentModeChartData} options={getChartOptions("Payment Mode Distribution")} />
              </div>
            </Card>
          </CheckPermission>

          <CheckPermission permission="report-commission">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Split</h3>
              <div className="h-64">
                <Pie data={commissionSplitData} options={getChartOptions("Agent vs Company Share")} />
              </div>
            </Card>
          </CheckPermission>
        </div>

        <CheckPermission permission="report-monthly_trends">

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Brokerage Trends</h3>
            <div className="h-64">
              <Line data={monthlyBrokerageData} options={getChartOptions("Monthly Brokerage Performance")} />
            </div>
          </Card>
        </CheckPermission>
      </div>
    )
  }

  const renderVisitReports = () => {
    if (!reportData.visitStats) return null

    const { visitStats, agentConversion, statusTrends, dailyVisits } = reportData

    const statusTrendsChartData = {
      labels: statusTrends?.map((item) => item.visit_status) || [],
      datasets: [
        {
          data: statusTrends?.map((item) => item.count) || [],
          backgroundColor: [
            '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
          ],
        },
      ],
    }

    const dailyVisitsData = {
      labels: dailyVisits?.map((item) => item.date) || [],
      datasets: [
        {
          label: 'Daily Visits',
          data: dailyVisits?.map((item) => item.count) || [],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
      ],
    }

    return (
      <div className="space-y-6">
        <CheckPermission permission="report-stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Visits */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Visits</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{visitStats.total_visits}</p>
                </div>
              </div>
            </Card>
            {/* Active Agents */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Active Agents</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{visitStats.active_agents}</p>
                </div>
              </div>
            </Card>
            {/* Converted Visits */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Converted Visits</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{visitStats.converted_visits}</p>
                </div>
              </div>
            </Card>
            {/* Conversion Rate */}
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{visitStats.conversion_rate}%</p>
                </div>
              </div>
            </Card>
          </div>
        </CheckPermission>

        <CheckPermission permission="report-agent_conversion">

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Conversion Rates</h3>
            <div className="overflow-x-auto">
              <Table
                columns={[
                  { label: "Created By", key: "agent_code", render: (val) => <CodeBadge code={val} size="xxs" /> },
                  { label: "Total Visits", key: "total_visits", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Converted", key: "converted_visits", render: (val) => <span className="text-sm font-medium text-gray-900">{val}</span> },
                  { label: "Conversion Rate", key: "conversion_rate", render: (val) => <Badge variant={val >= 20 ? "success" : val >= 10 ? "warning" : "danger"} size="xxs">{val}%</Badge> },
                ]}
                data={agentConversion}
                className="shadow-2xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50 rounded-2xl"
                FORMATCURRENCY={FORMATCURRENCY}
              />
            </div>
          </Card>
        </CheckPermission>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <CheckPermission permission="report-visit_status">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Status Distribution</h3>
              <div className="h-64">
                <Pie data={statusTrendsChartData} options={getChartOptions("Visit Status Breakdown")} />
              </div>
            </Card>
          </CheckPermission>

          <CheckPermission permission="report-daily_visit">

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Visit Trends</h3>
              <div className="h-64">
                <Line data={dailyVisitsData} options={getChartOptions("Daily Visit Activity")} />
              </div>
            </Card>
          </CheckPermission>
        </div>
      </div>
    )
  }

  const renderCurrentReport = () => {
    switch (activeReport) {
      case "property":
        return renderPropertyReports()
      case "agent":
        return renderAgentReports()
      case "manager":
        return renderManagerReports()
      case "brokerage":
        return renderBrokerageReports()
      case "visit":
        return renderVisitReports()
      default:
        return <div className="text-center py-8 text-gray-500">Select a report type to view data</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-sm text-gray-600">
                Generate insights for performance tracking and decision-making
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={ArrowDownTrayIcon} onClick={handleOpenExportModal}>
                Export
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center justify-between gap-4">
              <div className="text-sm text-red-700">{error}</div>
              <Button variant="outline" onClick={handleRetry} size="sm">Retry</Button>
            </div>
          )}

          {/* Report Types Card (restored) */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Report Types</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {availableReports.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.value}
                    onClick={() => setActiveReport(report.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${activeReport === report.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <Icon className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">{report.label}</div>
                  </button>
                );
              })}
            </div>
          </Card>
      

          {/* Export Modal Modern */}
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            loading={exportLoading}
            filterOptions={getExportFilterOptions()}
            filters={exportFilters}
            onFilterChange={(key, value) => setExportFilters((prev) => ({ ...prev, [key]: value }))}
            exportFormat={exportFormat}
            onFormatChange={setExportFormat}
            formats={[
              { value: 'csv', label: 'CSV', icon: null, description: 'Spreadsheet format' },
              { value: 'pdf', label: 'PDF', icon: null, description: 'Document format' },
            ]}
            title="Export Reports"
            description="Choose format to export your report data."
            confirmText="Export"
            cancelText="Cancel"
          />

          {/* Filter Section */}
          <FilterSection
            filters={getMainFilterConfigs()}
            activeFilters={filters}
            onFilterChange={handleMainFilterChange}
            onSearchChange={handleSearchChange}
            onClearFilters={handleClearFilters}
            searchValue={searchTerm}
            searchPlaceholder="Search reports..."
            showSearch={true}
            showActiveFilters={false}
            showColumnControls={false}
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="mt-2 text-sm text-gray-500">Loading report data...</div>
            </div>
          ) : (
            renderCurrentReport()
          )}
        </div>
      </div>
    </div>
  )
}
