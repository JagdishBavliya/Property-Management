"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import { fetchAllProperties } from "@/store/slices/propertiesSlice";
import usePropertyAgentLinkage from "../hooks/usePropertyAgentLinkage";
import axiosInstance from "../utils/axiosInstance";
import { useRoleFlags } from "../hooks/useRoleFlags";
import { useExportModal } from "../hooks/useExportModal";
import { useRouter } from 'next/router';
import Hashids from 'hashids';

// Redux
import {
  fetchEstimates,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  selectEstimates,
  selectEstimatesPagination,
  selectEstimatesLoading,
  selectCreateEstimateLoading,
  selectUpdateEstimateLoading,
  selectDeleteEstimateLoading,
  selectEstimatesError,
  clearError
} from '../store/slices/estimatesSlice';

// Components
import Card from "../components/ui/Card";
import Table from "../components/ui/Table";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CodeBadge from "../components/ui/CodeBadge";
import Pagination from "../components/ui/Pagination";
import ExportModal from '../components/ui/ExportModal';
import FilterSection from "../components/ui/FilterSection";
import CheckPermission from "../components/ui/CkeckPermission";
import DeleteConfirmationModal from "../components/ui/DeleteConfirmationModal";
import { ESTIMATE_STATUSES, DEFAULT_FORM_VALUES, FORMATDATE, FORMATCURRENCY, numericInputProps } from "../utils/constants";

import {
  CalculatorIcon, PlusIcon, BuildingOfficeIcon, CurrencyRupeeIcon,
  DocumentTextIcon, ClockIcon, ArrowDownTrayIcon, EyeIcon,
  PencilSquareIcon, TrashIcon
} from "@heroicons/react/24/outline";


const safeParseFloat = (value) => Number.parseFloat(value) || 0;
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function showErrorToast(error, fallback = "Something went wrong") {
  let message = fallback;
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.response?.data?.error) {
    message = error.response.data.error;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  }
  if (!toast.isActive(message)) {
    toast.error(message, { toastId: message, autoClose: 4000 });
  }
}

const FormSection = ({ icon: Icon, title, children, bgClass = "bg-gradient-to-r from-gray-50 to-gray-100" }) => (
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

const FormField = ({ label, required = false, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
  </div>
);

const EstimateForm = ({ initial, onSubmit, onClose, allProperties, allAgents, allPropertiesLoading, allAgentsLoading, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm({ defaultValues: DEFAULT_FORM_VALUES });

  const [calculated, setCalculated] = useState({ total: 0, totalBrokerage: 0 });
  const [form, setForm] = useState(DEFAULT_FORM_VALUES);
  const {
    agentOptions,
    propertyOptions,
    propertyDropdownDisabled,
    handleLinkedChange,
    ariaProps,
    validateAgentPropertyMatch,
  } = usePropertyAgentLinkage({ allProperties, allAgents, form, setForm });

  const watchedValues = watch(['propertySize', 'propertyRate', 'brokerageSeller', 'brokerageBuyer', 'additionalCosts']);
  const calculations = useMemo(() => {
    const [size, rate, brokerageSeller, brokerageBuyer, additional] = watchedValues.map(safeParseFloat);
    const propertyValue = size * rate;
    const total = propertyValue + additional;
    const totalBrokerage = brokerageSeller + brokerageBuyer;
    return {
      total: isNaN(total) ? 0 : total,
      totalBrokerage: isNaN(totalBrokerage) ? 0 : totalBrokerage,
      propertyValue: isNaN(propertyValue) ? 0 : propertyValue,
    };
  }, [watchedValues]);

  useEffect(() => {
    setCalculated(prev =>
      prev.total !== calculations.total || prev.totalBrokerage !== calculations.totalBrokerage
        ? { total: calculations.total, totalBrokerage: calculations.totalBrokerage }
        : prev
    );
  }, [calculations]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && ['propertyCode', 'agentCode'].includes(name)) {
        setForm(prev => ({ ...prev, [name]: value[name] }));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const formData = initial ? {
      propertyCode: initial.property_code || "",
      agentCode: initial.agent_code || "",
      propertySize: initial.property_size || "",
      propertyRate: initial.property_rate || "",
      brokerageSeller: initial.brokerage_seller || "",
      brokerageBuyer: initial.brokerage_buyer || "",
      additionalCosts: initial.additional_costs || "",
      status: initial.status || "Draft",
    } : DEFAULT_FORM_VALUES;
    reset(formData);
    setForm(prev => {
      const hasChanged = Object.keys(formData).some(key => prev[key] !== formData[key]);
      return hasChanged ? formData : prev;
    });
  }, [initial, reset]);

  const onSubmitForm = useCallback((data) => {
    const linkageError = validateAgentPropertyMatch(data);
    if (linkageError) {
      toast.error(linkageError);
      return;
    }
    const submitData = {
      propertyCode: data.propertyCode.trim(),
      agentCode: data.agentCode.trim(),
      propertySize: safeParseFloat(data.propertySize),
      propertyRate: safeParseFloat(data.propertyRate),
      brokerageSeller: safeParseFloat(data.brokerageSeller),
      brokerageBuyer: safeParseFloat(data.brokerageBuyer),
      additionalCosts: safeParseFloat(data.additionalCosts),
      total: calculated.total,
      totalBrokerage: calculated.totalBrokerage,
      status: data.status,
    };
    onSubmit(submitData);
  }, [calculated, validateAgentPropertyMatch, onSubmit]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-10"></div>
          <CalculatorIcon className="h-8 w-8 text-primary-600 relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {initial ? 'Edit Estimate' : 'Create New Estimate'}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {initial ? 'Update property estimate details and calculations.' : 'Calculate property value and create detailed estimates.'}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        {/* Property & Agent Selection */}
        <FormSection icon={BuildingOfficeIcon} title="Property & Agent Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="Agent" required error={errors.agentCode}>
              <select
                {...register('agentCode', { required: 'Agent is required' })}
                onChange={handleLinkedChange}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.agentCode ? 'border-red-300' : 'border-gray-300'}`}
                disabled={allAgentsLoading}
                {...ariaProps.agentDropdown}
              >
                <option value="">{allAgentsLoading ? "Loading agents..." : "Select agent"}</option>
                {agentOptions.map((agent) => (
                  <option key={agent.value} value={agent.value}>{agent.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Property" required error={errors.propertyCode}>
              <select
                {...register('propertyCode', { required: 'Property is required' })}
                onChange={handleLinkedChange}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.propertyCode ? 'border-red-300' : 'border-gray-300'}`}
                disabled={allPropertiesLoading || propertyDropdownDisabled}
                {...ariaProps.propertyDropdown}
              >
                <option value="">{allPropertiesLoading ? "Loading properties..." : "Select property"}</option>
                {propertyOptions.map((property) => (
                  <option key={property.value} value={property.value}>{property.label}</option>
                ))}
              </select>
            </FormField>
          </div>
          {form.agentCode && propertyOptions.length === 0 && !allPropertiesLoading && (
            <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2" {...ariaProps.noPropertyMessage}>
              No properties available for the selected agent.
            </div>
          )}
        </FormSection>
        {/* Property Valuation */}
        <FormSection icon={CurrencyRupeeIcon} title="Property Valuation" bgClass="bg-white border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Property Size (sq ft)" required error={errors.propertySize}>
              <input
                type="text"
                {...register('propertySize', { required: 'Property size is required', min: { value: 0, message: 'Size must be positive' } })}
                {...numericInputProps.decimal({ decimalPlaces: 2 })}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.propertySize ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter size in sq ft"
              />
            </FormField>
            <FormField label="Property Rate (₹ per sq ft)" required error={errors.propertyRate}>
              <input
                type="text"
                {...register('propertyRate', { required: 'Property rate is required', min: { value: 0, message: 'Rate must be positive' } })}
                {...numericInputProps.decimal({ decimalPlaces: 2 })}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.propertyRate ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter rate per sq ft"
              />
            </FormField>
          </div>
        </FormSection>
        {/* Brokerage & Costs */}
        <FormSection icon={DocumentTextIcon} title="Brokerage & Additional Costs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Brokerage - Seller (₹)" error={errors.brokerageSeller}>
              <input
                type="text"
                {...register('brokerageSeller', { min: { value: 0, message: 'Brokerage cannot be negative' } })}
                {...numericInputProps.decimal({ decimalPlaces: 2 })}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.brokerageSeller ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="0"
              />
            </FormField>
            <FormField label="Brokerage - Buyer (₹)" error={errors.brokerageBuyer}>
              <input
                type="text"
                {...register('brokerageBuyer', { min: { value: 0, message: 'Brokerage cannot be negative' } })}
                {...numericInputProps.decimal({ decimalPlaces: 2 })}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.brokerageBuyer ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="0"
              />
            </FormField>
            <FormField label="Additional Costs (₹)" error={errors.additionalCosts} className="md:col-span-2">
              <input
                type="text"
                {...register('additionalCosts', { min: { value: 0, message: 'Additional costs cannot be negative' } })}
                {...numericInputProps.decimal({ decimalPlaces: 2 })}
                className={`w-full border rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.additionalCosts ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="0"
              />
            </FormField>
          </div>
        </FormSection>
        {/* Status */}
        <FormSection icon={ClockIcon} title="Estimate Status" bgClass="bg-white border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Status">
              <select
                {...register('status')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {ESTIMATE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </FormField>
          </div>
        </FormSection>
        {/* Calculation Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <CalculatorIcon className="w-3 h-3 text-blue-600" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">Calculation Summary</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 font-medium">Property Value</div>
              <div className="text-xl font-bold text-blue-700">{FORMATCURRENCY(calculations.propertyValue)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 font-medium">Total Brokerage</div>
              <div className="text-xl font-bold text-green-700">{FORMATCURRENCY(calculated.totalBrokerage)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Grand Total</div>
              <div className="text-2xl font-bold text-gray-900">{FORMATCURRENCY(calculated.total)}</div>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="px-6 py-2">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading} icon={initial ? PencilSquareIcon : PlusIcon} className="px-6 py-2">
            {initial ? 'Update Estimate' : 'Create Estimate'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function Estimates() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { isAgent, isManager, isAdmin } = useRoleFlags();
  const router = useRouter();

  // Redux selectors
  const estimates = useSelector(selectEstimates);
  const estimatesPagination = useSelector(selectEstimatesPagination);
  const loading = useSelector(selectEstimatesLoading);
  const createLoading = useSelector(selectCreateEstimateLoading);
  const updateLoading = useSelector(selectUpdateEstimateLoading);
  const deleteLoading = useSelector(selectDeleteEstimateLoading);
  const error = useSelector(selectEstimatesError);

  // Local state
  const [modal, setModal] = useState({ open: false, estimate: null });
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [allAgents, setAllAgents] = useState([]);
  const [allAgentsLoading, setAllAgentsLoading] = useState(false);
  const [allProperties, setAllProperties] = useState([]);
  const [allPropertiesLoading, setAllPropertiesLoading] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    agentCode: '', propertyCode: '', estimateStatus: '', startDate: '', endDate: '',
  });
  const handleExportFilterChange = (key, value) => {
    setExportFilters(prev => ({ ...prev, [key]: value }));
  };

  const {
    showExportModal,
    setShowExportModal,
    exportFormat,
    setExportFormat,
    exportLoading,
    handleExport,
  } = useExportModal({
    endpoint: "/api/estimates/export",
    getParams: () => {
      const keyMap = {
        agentCode: 'agent_code',
        propertyCode: 'property_code',
        estimateStatus: 'status',
        startDate: 'start_date',
        endDate: 'end_date',
      };
      const baseFilters = Object.entries(exportFilters)
        .filter(([_, v]) => v !== "")
        .reduce((acc, [k, v]) => {
          acc[keyMap[k] || k] = v;
          return acc;
        }, {});
      if (isAgent && user?.user_code) {
        baseFilters.agent_code = user.user_code;
      }
      return baseFilters;
    },
    filenamePrefix: "estimates_export",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1, perPage: 10, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false
  });
  const [visibleColumns, setVisibleColumns] = useState([
    'property_code', 'agent_code', 'total', 'status', 'created_at', 'actions'
  ]);
  const exportFilterOptions = useMemo(() => [
    {
      key: 'agentCode', label: 'Agent',
      options: [{ value: '', label: 'All Agents' }, ...allAgents
        .filter(agent => agent.role?.toLowerCase() === 'agent' || agent.agent_type || agent.user_code?.startsWith('AGT-'))
        .map(agent => ({ value: agent.user_code, label: `${agent.user_code} - ${agent.name}` }))],
      loading: allAgentsLoading,
      disabled: isAgent,
    },
    {
      key: 'propertyCode', label: 'Property',
      options: [{ value: '', label: 'All Properties' }, ...allProperties
        .map(property => ({ value: property.property_code, label: `${property.property_code} - ${property.property_name}` }))],
      loading: allPropertiesLoading,
    },
    {
      key: 'estimateStatus', label: 'Estimate Status',
      options: [{ value: '', label: 'All Statuses' }, ...ESTIMATE_STATUSES.map(status => ({ value: status.value, label: status.label }))],
      loading: false,
    },
    { key: 'startDate', label: 'Start Date', options: [], loading: false, type: 'date' },
    { key: 'endDate', label: 'End Date', options: [], loading: false, type: 'date' },
  ], [allAgents, allProperties, allAgentsLoading, allPropertiesLoading, isAgent]);

  const columns = useMemo(() => [
    {
      key: 'property_code', label: 'Property Code',
      render: (val) => <CodeBadge code={val} size="xxs" />,
      mobilePriority: true
    },
    {
      key: 'agent_code', label: 'Agent Code',
      render: (val) => <CodeBadge code={val} size="xxs" />,
      mobilePriority: true
    },
    {
      key: 'property_size', label: 'Size (sq ft)',
      render: (val) => <div className="text-sm font-medium text-gray-900">{safeParseFloat(val).toLocaleString()}</div>,
      mobilePriority: true
    },
    {
      key: 'property_rate', label: 'Rate (₹/sq ft)',
      render: (val) => <div className="text-sm text-gray-600">{FORMATCURRENCY(val)}</div>
    },
    {
      key: 'total_brokerage', label: 'Total Brokerage',
      render: (val) => <div className="text-sm font-semibold text-green-700">{FORMATCURRENCY(val)}</div>
    },
    {
      key: 'total', label: 'Grand Total',
      render: (val) => <div className="text-sm font-bold text-gray-900">{FORMATCURRENCY(val)}</div>,
      mobilePriority: true
    },
    {
      key: 'status', label: 'Status',
      render: (val) => {
        const status = ESTIMATE_STATUSES.find(s => s.value === val);
        return <Badge variant={status?.variant || 'secondary'} size="xxs">{status?.label || val}</Badge>;
      },
      mobilePriority: true
    },
    {
      key: 'created_at', label: 'Created',
      render: (val) => <div className="text-sm text-gray-500">{FORMATDATE(val, 3)}</div>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const hashids = new Hashids('your-salt-string', 6);
        return (
          <div className="flex space-x-2">
            <CheckPermission permission="estimate-view">
              <Button
                size="square"
                variant="outline"
                onClick={() => {
                  const encryptedId = hashids.encode(row.id);
                  router.push(`/estimates/${encryptedId}`);
                }}
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            </CheckPermission>
            <CheckPermission permission="estimate-edit">
              <Button
                size="square"
                variant="success"
                onClick={() => setModal({ open: true, estimate: row })}
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
            </CheckPermission>
            <CheckPermission permission="estimate-delete">
              <Button
                size="square"
                variant="danger"
                onClick={() => setDeleteId(row.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </CheckPermission>
          </div>
        );
      },
    },
  ], [router]);

  useEffect(() => {
    setAllAgentsLoading(true);
    axiosInstance.get('/api/users/agents-for-current-user')
      .then(res => {
        setAllAgents(res.data.agents || []);
      })
      .catch((err) => { showErrorToast(err, "Failed to load agents"); })
      .finally(() => setAllAgentsLoading(false));
  }, []);

  useEffect(() => {
    setAllPropertiesLoading(true);
    dispatch(fetchAllProperties())
      .then((result) => {
        if (result.payload?.properties) setAllProperties(result.payload.properties);
      })
      .catch((err) => { showErrorToast(err, "Failed to load properties"); })
      .finally(() => setAllPropertiesLoading(false));
  }, [dispatch]);

  // Effects
  useEffect(() => {
    dispatch(fetchEstimates({
      page: pagination.currentPage,
      perPage: pagination.perPage,
      search: debouncedSearch,
      role: user?.role,
    }));
  }, [dispatch, pagination.currentPage, pagination.perPage, debouncedSearch]);

  useEffect(() => {
    if (estimatesPagination) {
      setPagination(estimatesPagination);
    }
  }, [estimatesPagination]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handlePageChange = useCallback((page) => { setPagination(prev => ({ ...prev, currentPage: page })); }, []);
  const handleCreate = async (formData) => {
    try {
      await dispatch(createEstimate(formData)).unwrap();
      toast.success('Estimate created successfully!');
      setModal({ open: false, estimate: null });
      dispatch(fetchEstimates({
        page: pagination.currentPage,
        perPage: pagination.perPage,
        search: debouncedSearch
      }));
    } catch (error) {
      toast.error(error || 'Failed to create estimate');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await dispatch(updateEstimate({ id: modal.estimate.id, estimateData: formData })).unwrap();
      toast.success('Estimate updated successfully!');
      setModal({ open: false, estimate: null });
      dispatch(fetchEstimates({
        page: pagination.currentPage,
        perPage: pagination.perPage,
        search: debouncedSearch
      }));
    } catch (error) {
      toast.error(error || 'Failed to update estimate');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteEstimate(deleteId)).unwrap();
      toast.success('Estimate deleted successfully!');
      setDeleteId(null);
      dispatch(fetchEstimates({
        page: pagination.currentPage,
        perPage: pagination.perPage,
        search: debouncedSearch
      }));
    } catch (error) {
      toast.error(error || 'Failed to delete estimate');
    }
  };

  const handleCloseModal = useCallback(() => { setModal({ open: false, estimate: null }); }, []);
  const handleSearchChange = setSearchQuery;
  const filteredColumns = useMemo(() => columns.filter(col => visibleColumns.includes(col.key)), [columns, visibleColumns]);
  const columnControlsColumns = useMemo(() => columns.filter(col => !col.hideFromColumnControls), [columns]);
  const handleOpenExportModal = () => { setShowExportModal(true); };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card variant="elevated">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <CalculatorIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading estimates</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => {
              setError(null);
              fetchEstimates();
            }}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <CheckPermission permission="estimate-list">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Property Estimates</h1>
                <p className="mt-2 text-sm text-gray-600">Calculate and manage property estimates and valuations</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckPermission permission="estimate-export">
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
                <CheckPermission permission="estimate-create">
                  <Button
                    variant="primary"
                    icon={PlusIcon}
                    size="sm"
                    iconSize="h-5 w-5 sm:h-6 sm:w-6"
                    onClick={() => setModal({ open: true, estimate: null })}
                  >
                    Create Estimate
                  </Button>
                </CheckPermission>
              </div>
            </div>
            {/* Filter Section */}
            <FilterSection
              searchPlaceholder="Search Property Code or Agent Code"
              searchValue={searchQuery}
              onSearchChange={handleSearchChange}
              resultsCount={estimates.length}
              totalCount={pagination.total}
              compact={true}
              showActiveFilters={false}
              showSearch={true}
              columns={columnControlsColumns}
              visibleColumns={visibleColumns.filter(col => col !== 'actions')}
              onColumnVisibilityChange={(newColumns) => setVisibleColumns([...newColumns, 'actions'])}
              showColumnControls={true}
              filters={[]}
              activeFilters={{}}
              onFilterChange={() => { }}
              onClearFilters={() => { }}
            />
            {/* Table Card */}
            <Card variant="elevated">
              <Table
                columns={filteredColumns}
                data={estimates}
                loading={loading}
                emptyMessage={loading ? "Loading estimates..." : "No estimates found"}
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
            <Modal isOpen={modal.open} onClose={handleCloseModal} title="" size="lg">
              <EstimateForm
                initial={modal.estimate}
                onSubmit={modal.estimate ? handleEdit : handleCreate}
                onClose={handleCloseModal}
                allProperties={allProperties}
                allAgents={allAgents}
                allPropertiesLoading={allPropertiesLoading}
                allAgentsLoading={allAgentsLoading}
                loading={modal.estimate ? updateLoading : createLoading}
              />
            </Modal>
            <DeleteConfirmationModal
              isOpen={!!deleteId}
              onClose={() => setDeleteId(null)}
              onConfirm={handleDelete}
              loading={deleteLoading}
              title="Delete Estimate"
              description="This action will permanently remove the estimate from the system."
              itemType="estimate"
              itemData={deleteId ? estimates.find(estimate => estimate.id === deleteId) : null}
              confirmText="Delete Estimate"
              cancelText="Cancel"
            />
            <ExportModal
              isOpen={showExportModal}
              onClose={() => setShowExportModal(false)}
              onExport={handleExport}
              loading={exportLoading}
              filters={exportFilters}
              onFilterChange={handleExportFilterChange}
              filterOptions={exportFilterOptions}
              exportFormat={exportFormat}
              onFormatChange={setExportFormat}
              formats={[
                { value: 'csv', label: 'CSV', icon: null, description: 'Spreadsheet format' },
                { value: 'pdf', label: 'PDF', icon: null, description: 'Document format' },
              ]}
              title="Export Estimates"
              description="Choose format and filters to export your estimate records."
              confirmText="Export"
              cancelText="Cancel"
            />
          </div>
        </div>
      </div>
    </CheckPermission>
  );
}   
