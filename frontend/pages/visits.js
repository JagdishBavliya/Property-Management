"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import Hashids from "hashids";
import axiosInstance from "../utils/axiosInstance";

// Components
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import CodeBadge from "../components/ui/CodeBadge";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import ExportModal from '../components/ui/ExportModal';
import FilterSection from "../components/ui/FilterSection";
import CheckPermission from "../components/ui/CkeckPermission";
import DeleteConfirmationModal from "../components/ui/DeleteConfirmationModal";
import { exportFormats, visitStatuses, FORMATDATE, numericInputProps } from "../utils/constants";

// Redux
import usePropertyAgentLinkage from "../hooks/usePropertyAgentLinkage";
import { fetchAllProperties } from "@/store/slices/propertiesSlice";
import { useRoleFlags } from "../hooks/useRoleFlags";
import { useExportModal } from "../hooks/useExportModal";

import {
  CalendarIcon, PlusIcon, DocumentArrowDownIcon, EyeIcon,
  PencilIcon, TrashIcon, ChartBarIcon, TrophyIcon,
  CheckCircleIcon, XCircleIcon, ArrowPathIcon, ClockIcon,
  SparklesIcon, PencilSquareIcon, BuildingOfficeIcon, UsersIcon,
  ArrowDownTrayIcon, UserIcon, PhoneIcon, ClipboardDocumentListIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export const FormSection = ({ icon: Icon, title, children, bgClass = "bg-gradient-to-r from-gray-50 to-gray-100" }) => (
  <div className={`${bgClass} rounded-xl p-4`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
        <Icon className="w-3 h-3 text-blue-600" />
      </div>
      <h4 className="text-base font-semibold text-gray-900">{title}</h4>
    </div>
    {children}
  </div>
);

export const FormField = ({ label, required = false, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const StatsSummary = ({ stats, visitStatuses }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Visits</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">{stats.totalVisits}</p>
        </div>
      </div>
    </Card>
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Interested</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {stats.statusStats.find(s => s.visit_status === 'Interested')?.count || 0}
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
          <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Not Interested</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {stats.statusStats.find(s => s.visit_status === 'Not Interested')?.count || 0}
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
          <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Follow-Up</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {stats.statusStats.find(s => s.visit_status === 'Follow-Up')?.count || 0}
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {stats.statusStats.find(s => s.visit_status === 'Pending')?.count || 0}
          </p>
        </div>
      </div>
    </Card>
    <Card>
      <div className="flex items-center">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
          <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        </div>
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">Converted</p>
          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
            {stats.statusStats.find(s => s.visit_status === 'Converted')?.count || 0}
          </p>
        </div>
      </div>
    </Card>
  </div>
);

const TopAgentsLeaderboard = ({ topAgents }) => {
  const getRankStyling = (index) => {
    if (index === 0) return {
      bg: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600",
      text: "text-yellow-900", 
      icon: "🏆",
      ring: "ring-3 ring-yellow-300/50",
      glow: "shadow-xl shadow-yellow-400/30",
      size: "w-9 h-9 text-base",
      border: "border-2 border-yellow-300"
    };
    if (index === 1) return {
      bg: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500",
      text: "text-slate-800",
      icon: "🥈", 
      ring: "ring-3 ring-slate-300/50",
      glow: "shadow-xl shadow-slate-400/30",
      size: "w-8 h-8 text-sm",
      border: "border-2 border-slate-300"
    };
    if (index === 2) return {
      bg: "bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700",
      text: "text-amber-100",
      icon: "🥉",
      ring: "ring-3 ring-amber-400/50", 
      glow: "shadow-xl shadow-amber-500/30",
      size: "w-7 h-7 text-sm",
      border: "border-2 border-amber-400"
    };
    return {
      bg: "bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600",
      text: "text-white",
      icon: index + 1,
      ring: "ring-2 ring-indigo-300/50",
      glow: "shadow-lg shadow-indigo-400/20",
      size: "w-6 h-6 text-xs",
      border: "border border-indigo-300"
    };
  };

  const getConversionRate = (agent) => {
    return agent.total_visits > 0 ? ((agent.converted_count / agent.total_visits) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="mt-6">
      <Card className="shadow rounded-xl p-4">
        {/* Enhanced Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg">
            <TrophyIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Top Agents
          </span>
          <Badge variant="accent" size="xs" className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200">
            <SparklesIcon className="h-3 w-3 mr-1" />
            {topAgents.length}
          </Badge>
        </div>

        {/* Enhanced Compact Listing */}
        <div className="space-y-1">
          {topAgents.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm flex items-center justify-center gap-2">
              <UsersIcon className="h-4 w-4" />
              No agent data available
            </div>
          ) : (
            topAgents.slice(0, 3).map((agent, index) => {
              const conversionRate = getConversionRate(agent);
              const rankStyle = getRankStyling(index);
              
              return (
                <div
                  key={agent.agent_code}
                  className={`
                    flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200
                    hover:bg-gray-50 hover:shadow-md group
                    ${index < 3 ? 'bg-gradient-to-r from-gray-50/80 to-white border border-gray-100' : 'hover:bg-gray-50'}
                  `}
                >
                   <div className="flex items-center gap-3 min-w-0 flex-1">
                     <div className={`
                       ${rankStyle.size} rounded-full flex items-center justify-center font-bold
                       ${rankStyle.bg} ${rankStyle.text} ${rankStyle.ring} ${rankStyle.glow} ${rankStyle.border}
                       group-hover:scale-110 transition-all duration-200 relative overflow-hidden
                     `}>
                       <div className="absolute inset-0 bg-white/20 rounded-full"></div>
                       <span className="relative z-10 drop-shadow-sm">{rankStyle.icon}</span>
                     </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900">
                          {agent.agent_name || agent.agent_code}
                          {index === 0 && ' 👑'}
                        </span>
                      </div>
                   </div>

                  {/* Enhanced Stats with Black Text */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`
                        flex items-center gap-1 px-2 py-1 rounded-full font-bold text-xs border transition-all group-hover:shadow-sm
                        ${parseFloat(conversionRate) >= 50 ? 
                          'bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-400' :
                          parseFloat(conversionRate) >= 25 ? 
                          'bg-gradient-to-r from-orange-100 to-red-100 border-orange-400' :
                          'bg-gradient-to-r from-slate-100 to-gray-100 border-slate-400'}
                      `}>
                        <ChartBarIcon className={`h-3 w-3 ${parseFloat(conversionRate) >= 50 ? 'text-green-700' : parseFloat(conversionRate) >= 25 ? 'text-orange-700' : 'text-slate-700'}`} />
                        <span className="text-black">{conversionRate}%</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-violet-100 px-2 py-0.5 rounded-full border border-purple-300 group-hover:shadow-sm transition-all">
                      <CalendarIcon className="h-3 w-3 text-purple-700" />
                      <span className="font-medium text-black">{agent.total_visits}</span>
                      <span className="font-medium text-xs text-black">visits</span>
                    </div>                    
                    <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 px-2 py-0.5 rounded-full border border-yellow-400 group-hover:shadow-sm transition-all">
                      <ClockIcon className="h-3 w-3 text-yellow-700" />
                      <span className="font-medium text-black">{agent.interested_count}</span>
                      <span className="font-medium text-xs text-black">interested</span>
                    </div>                    
                    <div className="flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 px-2 py-0.5 rounded-full border border-green-400 group-hover:shadow-sm transition-all">
                      <CheckCircleIcon className="h-3 w-3 text-green-700" />
                      <span className="font-medium text-black">{agent.converted_count}</span>
                      <span className="font-medium text-xs text-black">converted</span>
                    </div>                    
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Enhanced Footer with Black Text */}
        {topAgents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {/* Total Visits Summary - Purple background, black text */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-violet-100 px-3 py-1.5 rounded-full border border-purple-300">
                  <CalendarIcon className="h-3 w-3 text-purple-700" />
                  <span className="font-bold text-black text-sm">
                    {topAgents.reduce((sum, agent) => sum + agent.total_visits, 0)}
                  </span>
                  <span className="text-xs text-black">total visits</span>
                </div>                
              </div>              
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default function Visits() {
  const { user } = useAuth();
  const dispatch = useDispatch();

  const [allAgents, setAllAgents] = useState([]);
  const [allAgentsLoading, setAllAgentsLoading] = useState(false);
  const [allManagers, setAllManagers] = useState([]);
  const [allManagersLoading, setAllManagersLoading] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(false);

  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  // const [showViewModal, setShowViewModal] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [deleteId, setDeleteId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    agentCode: "",
    propertyCode: "",
    visitStatus: "",
    // startDate: "",
    // endDate: "",
  })
  const { isAgent, isManager, isAdmin } = useRoleFlags();
  
  // Helper function to combine agents and managers for filter options
  const combinedAgentOptions = useMemo(() => {
    let options = allAgents.map(agent => ({ 
      value: agent.user_code, 
      label: `${agent.user_code} - ${agent.name}` 
    }));
    
    // Add managers based on user role
    if (user?.role === "Admin" || user?.role === "Super Admin") {
      const managerOptions = allManagers.map(manager => ({ 
        value: manager.manager_code, 
        label: `${manager.manager_code} - ${manager.name} (Manager)` 
      }));
      options = [...managerOptions, ...options];
    }
    
    return options;
  }, [allAgents, allManagers, user?.role]);
  
  // const availableReports = REPORT_TYPES.filter((report) => {
  //   if (isAgent) {
  //     return ["property", "agent", "visit"].includes(report.value);
  //   }
  //   if (isManager) {
  //     return ["property", "agent", "manager", "brokerage", "visit"].includes(report.value);
  //   }
  //   return true;
  // });

  const [exportFilters, setExportFilters] = useState({
    agentCode: '',
    propertyCode: '',
    visitStatus: '',
    // startDate: '',
    // endDate: '',
  });

  const hashids = new Hashids('your-salt-string', 6);
  const openEditModal = useCallback((visit) => {
    setSelectedVisit(visit);
    // Convert server value (often without timezone) to local input value (YYYY-MM-DDTHH:mm)
    let formattedDate = "";
    const raw = visit.visit_date;
    if (raw) {
      const normalized = raw.replace("T", " ");
      const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mon = Number(m[2]);
        const d = Number(m[3]);
        const hh = Number(m[4]);
        const mm = Number(m[5]);
        // Assume incoming time is UTC when no timezone info, then shift to local
        const utcMs = Date.UTC(y, mon - 1, d, hh, mm);
        formattedDate = new Date(utcMs - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } else {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
          formattedDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        }
      }
    }
    setForm({
      agentCode: visit.agent_code,
      propertyCode: visit.property_code,
      visitDate: formattedDate,
      clientName: visit.client_name,
      clientMobile: visit.client_mobile,
      visitNotes: visit.visit_notes || "",
      visitStatus: visit.visit_status,
    });
    // sync RHF values for edit mode
    reset({
      agentCode: visit.agent_code,
      propertyCode: visit.property_code,
      visitDate: formattedDate,
      clientName: visit.client_name,
      clientMobile: visit.client_mobile,
      visitNotes: visit.visit_notes || "",
      visitStatus: visit.visit_status,
    });
    setShowEditModal(true);
  }, []);

  const columns = useMemo(() => [
    {
      key: 'property_code',
      label: 'Property',
      render: (val) => <CodeBadge code={val} size="xxs" />,
      mobilePriority: true
    },
    !isAgent && {
      key: 'agent_code',
      label: 'Created By',
      render: (val) => <CodeBadge code={val} size="xxs" />,
      mobilePriority: true
    },
    {
      key: 'client',
      label: 'Client',
      render: (_, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.client_name}</div>
          <div className="text-sm text-gray-500">{row.client_mobile}</div>
        </div>
      ),
      mobilePriority: true
    },
    {
      key: 'visit_status',
      label: 'Status',
      render: (val) => {
        const status = visitStatuses.find(s => s.value === val);
        return <Badge variant={status?.variant || 'secondary'} size="xxs">{status?.label || val}</Badge>;
      },
      mobilePriority: true
    },
    {
      key: 'visit_date',
      label: 'Visit Date',
      render: (val) => <div className="text-sm text-gray-900">{FORMATDATE(val, 3)}</div>,
      mobilePriority: true
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <CheckPermission permission="visit-view">
            <Button size="square"
              variant="outline"
              onClick={() => {
                const encryptedId = hashids.encode(row.id);
                window.location.href = `/visits/${encryptedId}`;
              }}>
              <EyeIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="visit-edit">
            <Button  size="square"
                variant="success"
              onClick={() => openEditModal(row)}>
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="visit-delete">
            <Button size="square"
              variant="danger" onClick={() => setDeleteId(row.id)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
        </div>
      ),
      mobilePriority: true
    }
  ].filter(Boolean), [isAgent, visitStatuses, hashids, openEditModal]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [stats, setStats] = useState({
    totalVisits: 0,
    statusStats: [],
    dailyStats: [],
    topAgents: [],
  })

  const [form, setForm] = useState({
    agentCode: user?.code || "",
    managerCode: user?.role === "Manager" ? user.code : "",
    propertyCode: "",
    visitDate: "",
    clientName: "",
    clientMobile: "",
    visitNotes: "",
    visitStatus: "Pending",
  })

  // react-hook-form setup mirroring admins/agents create/edit forms
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      agentCode: form.agentCode,
      propertyCode: form.propertyCode,
      visitDate: form.visitDate,
      clientName: form.clientName,
      clientMobile: form.clientMobile,
      visitNotes: form.visitNotes,
      visitStatus: form.visitStatus,
    }
  });

  useEffect(() => {
    setAllAgentsLoading(true);
    axiosInstance.get('/api/users/agents-for-current-user')
      .then(res => {
        setAllAgents(res.data.agents || []);
      })
      .catch((error) => {
        console.error('Failed to fetch agents:', error);
      })
      .finally(() => setAllAgentsLoading(false));
  }, []);

  // Fetch managers based on user role
  useEffect(() => {
    if (user?.role === "Admin" || user?.role === "Super Admin") {
      setAllManagersLoading(true);
      axiosInstance.get('/api/users/managers-for-current-user')
        .then(res => {
          setAllManagers(res.data.managers || []);
        })
        .catch((error) => {
          console.error('Failed to fetch managers:', error);
        })
        .finally(() => setAllManagersLoading(false));
    }
  }, [user?.role]);

  useEffect(() => {
    setAllPropertiesLoading(true);
    dispatch(fetchAllProperties())
      .then((result) => {
        if (result.payload && result.payload.properties) {
          setAllProperties(result.payload.properties);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch properties:', error);
      })
      .finally(() => setAllPropertiesLoading(false));
  }, [dispatch]);

  const {
    agentOptions,
    propertyOptions,
    propertyDropdownDisabled,
    handleLinkedChange,
    ariaProps,
    validateAgentPropertyMatch,
  } = usePropertyAgentLinkage({
    allProperties,
    allAgents,
    allManagers,
    form,
    setForm,
    allAgentsLoading,
    allPropertiesLoading,
    allManagersLoading,
    user,
  });

  const debouncedFilters = useDebounce(filters, 400);
  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.perPage,
        ...Object.fromEntries(Object.entries(debouncedFilters).filter(([_, v]) => v !== "")),
      });
      const res = await axiosInstance.get(`/api/visits?${params}`);
      setVisits(res.data.visits || []);
      if (res.data.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: res.data.pagination.page || 1,
          perPage: res.data.pagination.limit || 10,
          total: res.data.pagination.total || 0,
          totalPages: res.data.pagination.pages || 0,
          hasNextPage: (res.data.pagination.page || 1) < (res.data.pagination.pages || 0),
          hasPrevPage: (res.data.pagination.page || 1) > 1
        }));
      }
      setError("");
    } catch (err) {
      setError("Failed to fetch visits");
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, pagination.currentPage, pagination.perPage]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(debouncedFilters).filter(([_, v]) => v !== "")))
      const res = await axiosInstance.get(`/api/visits/stats?${params}`)
      setStats(res.data)
    } catch (err) {
      console.error("Error fetching stats:", err)
    }
  }, [debouncedFilters])

  useEffect(() => {
    fetchVisits();
    fetchStats();
  }, [debouncedFilters, pagination.currentPage, pagination.perPage, fetchVisits, fetchStats]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success);
      const timer = setTimeout(() => setSuccess("") , 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  // const handleFilterChange = useCallback((e) => {
  //   const { name, value } = e.target
  //   setFilters((prev) => ({ ...prev, [name]: value }))
  //   setPagination((prev) => ({ ...prev, currentPage: 1 }))
  // }, [])

  // switch to RHF submit handlers
  const onSubmitCreate = useCallback(async (data) => {
    setError("");
    setSuccess("");
    const linkageError = validateAgentPropertyMatch(data);
    if (linkageError) {
      setError(linkageError);
      return;
    }
    setSubmitting(true);
    try {
      // Convert local input back to server format (UTC "YYYY-MM-DD HH:mm")
      let visitDateOut = "";
      if (data.visitDate) {
        const [datePart, timePart] = data.visitDate.split("T");
        const [y, m, d] = (datePart || '').split("-").map(Number);
        const [hh, mm] = (timePart || '').split(":").map(Number);
        const localDate = new Date(y, (m || 1) - 1, d || 1, Number(hh || 0), Number(mm || 0));
        const yU = localDate.getUTCFullYear();
        const mU = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const dU = String(localDate.getUTCDate()).padStart(2, '0');
        const hU = String(localDate.getUTCHours()).padStart(2, '0');
        const minU = String(localDate.getUTCMinutes()).padStart(2, '0');
        visitDateOut = `${yU}-${mU}-${dU} ${hU}:${minU}`;
      }
      await axiosInstance.post("/api/visits", { ...data, visitDate: visitDateOut, managerCode: form.managerCode });
      setSuccess("Visit created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchVisits();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create visit");
    } finally {
      setSubmitting(false);
    }
  }, [form.managerCode, fetchVisits, fetchStats, validateAgentPropertyMatch]);

  const onSubmitUpdate = useCallback(async (data) => {
    setError("");
    setSuccess("");
    const linkageError = validateAgentPropertyMatch(data);
    if (linkageError) {
      setError(linkageError);
      return;
    }
    setSubmitting(true);
    try {
      let visitDateOut = "";
      if (data.visitDate) {
        const [datePart, timePart] = data.visitDate.split("T");
        const [y, m, d] = (datePart || '').split("-").map(Number);
        const [hh, mm] = (timePart || '').split(":").map(Number);
        const localDate = new Date(y, (m || 1) - 1, d || 1, Number(hh || 0), Number(mm || 0));
        const yU = localDate.getUTCFullYear();
        const mU = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const dU = String(localDate.getUTCDate()).padStart(2, '0');
        const hU = String(localDate.getUTCHours()).padStart(2, '0');
        const minU = String(localDate.getUTCMinutes()).padStart(2, '0');
        visitDateOut = `${yU}-${mU}-${dU} ${hU}:${minU}`;
      }
      await axiosInstance.put(`/api/visits/${selectedVisit.id}`, { ...data, visitDate: visitDateOut, managerCode: form.managerCode });
      setSuccess("Visit updated successfully");
      setShowEditModal(false);
      resetForm();
      fetchVisits();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update visit");
    } finally {
      setSubmitting(false);
    }
  }, [selectedVisit, form.managerCode, fetchVisits, fetchStats, validateAgentPropertyMatch]);

  const handleDeleteVisit = useCallback(async () => {
    if (!deleteId) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await axiosInstance.delete(`/api/visits/${deleteId}`);
      setSuccess("Visit deleted successfully");
      setDeleteId(null);
      fetchVisits();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete visit");
    } finally {
      setSubmitting(false);
    }
  }, [deleteId, fetchVisits, fetchStats]);

  const resetForm = useCallback(() => {
    setForm({
      agentCode: user?.code || "",
      managerCode: user?.role === "manager" ? user.code : "",
      propertyCode: "",
      visitDate: "",
      clientName: "",
      clientMobile: "",
      visitNotes: "",
      visitStatus: "Pending",
    })
    setSelectedVisit(null)
  }, [user])

  // keep RHF state synced when opening create modal
  useEffect(() => {
    if (showCreateModal && !showEditModal) {
      reset({
        agentCode: form.agentCode || "",
        propertyCode: "",
        visitDate: "",
        clientName: "",
        clientMobile: "",
        visitNotes: "",
        visitStatus: "Pending",
      });
    }
  }, [showCreateModal, showEditModal]);

  const {
    showExportModal,
    setShowExportModal,
    exportFormat,
    setExportFormat,
    exportLoading,
    handleExport,
  } = useExportModal({
    endpoint: "/api/visits/export",
    getParams: () => Object.entries(exportFilters).filter(([_, v]) => v !== "").reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {}),
    filenamePrefix: "visits_export",
  });

  const handleExportFilterChange = (key, value) => {
    setExportFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportCancel = () => {
    setShowExportModal(false);
    setExportFilters({
      agentCode: '',
      propertyCode: '',
      visitStatus: '',
      // startDate: '',
      // endDate: '',
    });
    setExportFormat('csv');
  };

  const handleOpenExportModal = () => {
    setExportFilters({
      agentCode: filters.agentCode,
      propertyCode: filters.propertyCode,
      visitStatus: filters.visitStatus,
      // startDate: filters.startDate,
      // endDate: filters.endDate,
    });
    setShowExportModal(true);
  };

  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));
  const filteredColumns = columns.filter(col => visibleColumns.includes(col.key));
  const columnControlsColumns = columns.filter(col => !col.hideFromColumnControls);

  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const filterOptions = useMemo(() => [
    {
      key: 'agentCode',
      label: 'Agent',
      options: combinedAgentOptions,
      loading: allAgentsLoading || allManagersLoading,
    },
    {
      key: 'propertyCode',
      label: 'Property',
      options: allProperties.map(property => ({ value: property.property_code, label: `${property.property_code} - ${property.property_name}` })),
      loading: allPropertiesLoading,
    },
    {
      key: 'visitStatus',
      label: 'Status',
      options: visitStatuses.map(status => ({ value: status.value, label: status.label })),
      loading: false,
    },
    // startDate and endDate are currently not in use but kept for future reference
    // {
    //   key: 'startDate',
    //   label: 'Start Date',
    //   options: [],
    //   loading: false,
    //   type: 'date',
    // },
    // {
    //   key: 'endDate',
    //   label: 'End Date',
    //   options: [],
    //   loading: false,
    //   type: 'date',
    // },
  ], [combinedAgentOptions, allAgentsLoading, allManagersLoading, allProperties, allPropertiesLoading, visitStatuses]);

  const handleFilterSectionChange = (arg1, arg2) => {
    let name, value;
    if (typeof arg1 === 'string' && arg2 !== undefined) {
      name = arg1;
      value = arg2;
    } else if (arg1 && arg1.target) {
      name = arg1.target.name;
      value = arg1.target.value;
    } else if (arg1 && typeof arg1 === "object") {
      name = arg1.name;
      value = arg1.value;
    }
    if ((name === 'agentCode' || name === 'propertyCode' || name === 'visitStatus' /*|| name === 'startDate' || name === 'endDate'*/) && value === 'all') {
      value = '';
    }
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const exportFilterOptions = useMemo(() => [
    {
      key: 'agentCode',
      label: 'Agent',
      options: combinedAgentOptions,
      loading: allAgentsLoading || allManagersLoading,
    },
    {
      key: 'propertyCode',
      label: 'Property',
      options: allProperties.map(property => ({ value: property.property_code, label: `${property.property_code} - ${property.property_name}` })),
      loading: allPropertiesLoading,
    },
    {
      key: 'visitStatus',
      label: 'Visit Status',
      options: visitStatuses.map(status => ({ value: status.value, label: status.label })),
      loading: false,
    },
    // startDate and endDate are currently not in use but kept for future reference
    // {
    //   key: 'startDate',
    //   label: 'Start Date',
    //   options: [],
    //   loading: false,
    //   type: 'date',
    // },
    // {
    //   key: 'endDate',
    //   label: 'End Date',
    //   options: [],
    //   loading: false,
    //   type: 'date',
    // },
  ], [combinedAgentOptions, allAgentsLoading, allManagersLoading, allProperties, allPropertiesLoading, visitStatuses]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="w-full max-w-md">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <CalendarIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading visits</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchVisits}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Daily Visit Management</h1>
              <p className="mt-2 text-sm text-gray-600">Track and manage property visits</p>
            </div>
            <div className="flex items-center gap-3">
              <CheckPermission permission="visit-export">
                <Button
                  variant="outline"
                  icon={ArrowDownTrayIcon}
                  size="sm"
                  onClick={handleOpenExportModal}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </Button>
              </CheckPermission>

              <CheckPermission permission="visit-create">
                <Button
                  variant="primary"
                  icon={PlusIcon}
                  size="sm"
                  iconSize="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Visit
                </Button>
              </CheckPermission>
            </div>
          </div>

          <CheckPermission permission="visit-stats">
            <StatsSummary stats={stats} visitStatuses={visitStatuses} />
          </CheckPermission>

          <CheckPermission permission="visit-top_agent">
            <TopAgentsLeaderboard topAgents={stats.topAgents} />
          </CheckPermission>

          {/* Filter Section */}
          <FilterSection
            searchPlaceholder="Search visits..."
            searchValue={filters.search}
            onSearchChange={e => handleFilterSectionChange({ name: 'search', value: e })}
            resultsCount={visits.length}
            totalCount={pagination.total}
            compact={true}
            showActiveFilters={false}
            showSearch={true}
            columns={columnControlsColumns}
            visibleColumns={visibleColumns.filter(col => col !== 'actions')}
            onColumnVisibilityChange={(newColumns) => setVisibleColumns([...newColumns, 'actions'])}
            showColumnControls={true}
            filters={filterOptions}
            activeFilters={filters}
            onFilterChange={handleFilterSectionChange}
            // onClearFilters={() => setFilters({ search: "", agentCode: "", propertyCode: "", visitStatus: "", startDate: "", endDate: "" })}
            onClearFilters={() => setFilters({ search: "", agentCode: "", propertyCode: "", visitStatus: "" })}
          />

          {/* Table Card */}
          <Card variant="elevated">
            <Table
              columns={filteredColumns}
              data={visits}
              loading={loading}
              emptyMessage={loading ? "Loading visits..." : "No visits found"}
            />
            {pagination.totalPages > 1 && (
              <div className="pt-6 border-t border-gray-200">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  total={pagination.total}
                  perPage={pagination.perPage}
                />
              </div>
            )}
          </Card>

          {/* Modals */}
          <Modal isOpen={showCreateModal || showEditModal} onClose={() => { setShowCreateModal(false); setShowEditModal(false); resetForm(); }} title="" size="lg">
            <div className="relative">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-10"></div>
                  <CalendarIcon className="h-8 w-8 text-primary-600 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {showEditModal ? 'Edit Visit' : 'Log New Visit'}
                </h3>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  {showEditModal ? 'Update property visit details and notes.' : 'Log a new property visit and client interaction.'}
                </p>
              </div>
              <form onSubmit={handleSubmit(showEditModal ? onSubmitUpdate : onSubmitCreate)} className="space-y-6">
                {/* Property & Agent Selection */}
                <FormSection icon={CalendarIcon} title="Property & Agent Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   
                    <FormField label="Agent" required error={errors.agentCode?.message}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UsersIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          name="agentCode"
                          {...register('agentCode', { required: 'Agent is required' })}
                          value={form.agentCode}
                          onChange={(e) => { handleLinkedChange(e); setValue('agentCode', e.target.value, { shouldValidate: true }); }}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          disabled={allAgentsLoading}
                          {...ariaProps.agentDropdown}
                        >
                          <option value="">{allAgentsLoading ? 'Loading agents...' : 'Select Agent'}</option>
                          {agentOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                    <FormField label="Property" required error={errors.propertyCode?.message}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          name="propertyCode"
                          {...register('propertyCode', { required: 'Property is required' })}
                          value={form.propertyCode}
                          onChange={(e) => { handleLinkedChange(e); setValue('propertyCode', e.target.value, { shouldValidate: true }); }}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          disabled={allPropertiesLoading || propertyDropdownDisabled}
                          {...ariaProps.propertyDropdown}
                        >
                          <option value="">{allPropertiesLoading ? 'Loading properties...' : 'Select Property'}</option>
                          {propertyOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  </div>
                  {form.agentCode && propertyOptions.length === 0 && !allPropertiesLoading && (
                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2" {...ariaProps.noPropertyMessage}>
                      No properties available for the selected agent.
                    </div>
                  )}
                </FormSection>
                {/* Visit Details */}
                <FormSection icon={DocumentArrowDownIcon} title="Visit Details" bgClass="bg-white border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Visit Date & Time" required error={errors.visitDate?.message}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="datetime-local"
                          name="visitDate"
                          {...register('visitDate', { required: 'Visit date is required' })}
                          value={form.visitDate}
                          onChange={(e) => { handleInputChange(e); setValue('visitDate', e.target.value, { shouldValidate: true }); }}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </FormField>
                    <FormField label="Client Name" required error={errors.clientName?.message}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="clientName"
                          {...register('clientName', { required: 'Client name is required', minLength: { value: 2, message: 'Client name must be at least 2 characters' } })}
                          value={form.clientName}
                          onChange={(e) => { handleInputChange(e); setValue('clientName', e.target.value, { shouldValidate: true }); }}
                          placeholder="Enter client name"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </FormField>
                    <FormField label="Client Mobile" required error={errors.clientMobile?.message}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          name="clientMobile"
                          {...register('clientMobile', { required: 'Client mobile is required', pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' } })}
                          value={form.clientMobile}
                          onChange={(e) => {
                            numericInputProps.digits({ maxLength: 10 }).onInput(e);
                            handleInputChange({ target: { name: 'clientMobile', value: e.target.value } });
                            setValue('clientMobile', e.target.value, { shouldValidate: true });
                          }}
                          placeholder="10-digit mobile number"
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                        />
                      </div>
                    </FormField>
                    <FormField label="Visit Status">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          name="visitStatus"
                          {...register('visitStatus')}
                          value={form.visitStatus}
                          onChange={(e) => { handleInputChange(e); setValue('visitStatus', e.target.value, { shouldValidate: true }); }}
                          className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {visitStatuses.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </div>
                    </FormField>
                  </div>
                </FormSection>
                {/* Visit Notes */}
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-100 rounded-md flex items-center justify-center">
                      <DocumentTextIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900">Additional Information</h4>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm resize-none"
                      rows="3"
                      name="visitNotes"
                      value={form.visitNotes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about the visit..."
                    />
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={submitting}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting} disabled={submitting} icon={showEditModal ? PencilIcon : PlusIcon} className="px-6 py-2">
                    {showEditModal ? 'Update Visit' : 'Log Visit'}
                  </Button>
                </div>
              </form>
            </div>
          </Modal>

          <CheckPermission permission="visit-delete">

            <DeleteConfirmationModal
              isOpen={!!deleteId}
              onClose={() => setDeleteId(null)}
              onConfirm={handleDeleteVisit}
              loading={submitting}
              title="Delete Visit"
              description="This action will permanently remove the visit from the system."
              itemType="visit"
              itemData={deleteId ? visits.find(visit => visit.id === deleteId) : null}
              confirmText="Delete Visit"
              cancelText="Cancel"
            />
          </CheckPermission>


          {/* Reusable Export Modal for Visits */}
          <ExportModal
            isOpen={showExportModal}
            onClose={handleExportCancel}
            onExport={handleExport}
            loading={exportLoading}
            filters={exportFilters}
            onFilterChange={handleExportFilterChange}
            filterOptions={exportFilterOptions}
            exportFormat={exportFormat}
            onFormatChange={setExportFormat}
            formats={exportFormats}
            title="Export Visits"
            description="Choose format and filters to export your visit logs."
            confirmText="Export"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  )
}
