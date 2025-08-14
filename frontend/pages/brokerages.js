import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import Hashids from 'hashids';
import axiosInstance from '@/utils/axiosInstance';

// Redux
import {
  fetchBrokerages,
  createBrokerage,
  updateBrokerage,
  deleteBrokerage,
  selectBrokerages,
  selectBrokeragesPagination,
  selectBrokeragesLoading,
  selectBrokeragesError,
  selectCreateBrokerageLoading,
  selectUpdateBrokerageLoading,
  selectDeleteBrokerageLoading,
  selectCreateBrokerageError,
  selectUpdateBrokerageError,
  selectDeleteBrokerageError,
  clearError,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
} from '../store/slices/brokeragesSlice';
import { fetchAllProperties } from '../store/slices/propertiesSlice';
import { fetchAllUsers } from '../store/slices/usersSlice';

// Components
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CodeBadge from '../components/ui/CodeBadge';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import FilterSection from '../components/ui/FilterSection';
import CheckPermission from '../components/ui/CkeckPermission';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import { PAYMENT_MODES, FORMATDATE, numericInputProps } from '../utils/constants';

import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserIcon,
  UserGroupIcon,
  UsersIcon,
  HomeIcon,
  CreditCardIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const BrokerageForm = ({ initial, onSubmit, onClose, properties, agents, managers, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      property_code: '',
      agent_code: '',
      total_brokerage: '',
      mode_of_payment: '',
      agent_commission: '',
      manager_commission_type: 'percent',
      manager_commission_value: '',
      notes: '',
    }
  });

  const watchedPropertyCode = watch('property_code');
  const watchedAgentCode = watch('agent_code');
  const watchedBrokerageAmount = watch('total_brokerage');

  useEffect(() => {
    if (initial) {
      reset({
        property_code: initial.property_code || '',
        agent_code: initial.agent_code || '',
        total_brokerage: initial.total_brokerage || '',
        mode_of_payment: initial.mode_of_payment || '',
        agent_commission: initial.agent_commission || '',
        manager_commission_type: initial.manager_commission_type || 'percent',
        manager_commission_value: initial.manager_commission_value || '',
        notes: initial.notes || '',
      });
    } else {
      reset({
        property_code: '',
        agent_code: '',
        total_brokerage: '',
        mode_of_payment: '',
        agent_commission: '',
        manager_commission_type: 'percent',
        manager_commission_value: '',
        notes: '',
      });
    }
  }, [initial, reset]);

  useEffect(() => {
    if (!initial && watchedPropertyCode && watchedAgentCode && watchedBrokerageAmount) {
      const agent = agents.find(a => a.user_code === watchedAgentCode);
      const property = properties.find(p => p.property_code === watchedPropertyCode);

      if (agent && property) {
        if (agent.commission?.type === 'percent') {
          const agentCommission = (parseFloat(watchedBrokerageAmount) * parseFloat(agent.commission.value)) / 100;
          setValue('agent_commission', agentCommission.toFixed(2));
        } else {
          setValue('agent_commission', agent.commission?.value || '0');
        }
        const managerCommission = (parseFloat(watchedBrokerageAmount) * 0.10);
        setValue('manager_commission_value', managerCommission.toFixed(2));
      }
    }
  }, [watchedPropertyCode, watchedAgentCode, watchedBrokerageAmount, agents, properties, setValue, initial]);

  const onSubmitForm = (data) => {
    onSubmit(data);
  };

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-10"></div>
          <CurrencyDollarIcon className="h-8 w-8 text-primary-600 relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {initial ? 'Edit Brokerage' : 'Add New Brokerage'}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {initial
            ? 'Update brokerage details and commission information.'
            : 'Create a new brokerage deal with property, agent, and commission details.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 sm:space-y-6">
        {/* Deal Information Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <BuildingOfficeIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-gray-900">Deal Information</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Property Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Property <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HomeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.property_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                  {...register('property_code', { required: 'Property code is required' })}
                >
                  <option value="">Select property</option>
                  {properties.map(property => (
                    <option key={property.property_code} value={property.property_code}>
                      {property.property_code} - {property.property_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.property_code && (
                <p className="text-xs text-red-600 mt-1">{errors.property_code.message}</p>
              )}
            </div>

            {/* Agent Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Agent <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.agent_code ? 'border-red-300' : 'border-gray-300'
                    }`}
                  {...register('agent_code', { required: 'Agent code is required' })}
                >
                  <option value="">Select agent</option>
                  {agents.map(agent => (
                    <option key={agent.user_code} value={agent.user_code}>
                      {agent.user_code} - {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.agent_code && (
                <p className="text-xs text-red-600 mt-1">{errors.agent_code.message}</p>
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Payment Mode <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCardIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.mode_of_payment ? 'border-red-300' : 'border-gray-300'
                    }`}
                  {...register('mode_of_payment', { required: 'Payment mode is required' })}
                >
                  <option value="">Select payment mode</option>
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
              {errors.mode_of_payment && (
                <p className="text-xs text-red-600 mt-1">{errors.mode_of_payment.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Details Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-md flex items-center justify-center">
              <CurrencyDollarIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600" />
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-gray-900">Financial Details</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Brokerage Amount */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Brokerage Amount (INR) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('total_brokerage', {
                    required: 'Brokerage amount is required',
                    min: { value: 0, message: 'Amount cannot be negative' }
                  })}
                  {...numericInputProps.decimal({ decimalPlaces: 2 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.total_brokerage ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter brokerage amount"
                />
              </div>
              {errors.total_brokerage && (
                <p className="text-xs text-red-600 mt-1">{errors.total_brokerage.message}</p>
              )}
            </div>

            {/* Agent Commission */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Agent Commission (INR) <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('agent_commission', {
                    required: 'Agent commission is required',
                    min: { value: 0, message: 'Commission cannot be negative' }
                  })}
                  {...numericInputProps.decimal({ decimalPlaces: 2 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.agent_commission ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter agent commission"
                />
              </div>
              {errors.agent_commission && (
                <p className="text-xs text-red-600 mt-1">{errors.agent_commission.message}</p>
              )}
            </div>

            {/* Manager Commission */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Manager Commission <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('manager_commission_value', {
                      required: 'Manager commission is required',
                      min: { value: 0, message: 'Commission cannot be negative' }
                    })}
                    {...numericInputProps.decimal({ decimalPlaces: 2 })}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.manager_commission_value ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="Enter manager commission"
                  />
                </div>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                  {...register('manager_commission_type')}
                >
                  <option value="percent">%</option>
                  <option value="inr">INR</option>
                </select>
              </div>
              {errors.manager_commission_value && (
                <p className="text-xs text-red-600 mt-1">{errors.manager_commission_value.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
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
              {...register('notes')}
              placeholder="Additional notes about the brokerage deal..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            icon={initial ? PencilSquareIcon : PlusIcon}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm"
          >
            {initial ? 'Update Brokerage' : 'Create Brokerage'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function BrokeragesPage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const hashids = new Hashids('your-salt-string', 6);
  const [showModal, setShowModal] = useState(false);
  const [editingBrokerage, setEditingBrokerage] = useState(null);
  const [deletingBrokerage, setDeletingBrokerage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ propertyCode: '', agentCode: '', managerCode: '' });
  const [visibleColumns, setVisibleColumns] = useState([
    'brokerage_code',
    'property_code',
    'agent_code',
    'mode_of_payment',
    'manager_code',
    'actions'
  ]);

  // Redux selectors
  const brokerages = useSelector(selectBrokerages);
  const pagination = useSelector(selectBrokeragesPagination);
  const loading = useSelector(selectBrokeragesLoading);
  const error = useSelector(selectBrokeragesError);
  const createLoading = useSelector(selectCreateBrokerageLoading);
  const updateLoading = useSelector(selectUpdateBrokerageLoading);
  const deleteLoading = useSelector(selectDeleteBrokerageLoading);
  const createError = useSelector(selectCreateBrokerageError);
  const updateError = useSelector(selectUpdateBrokerageError);
  const deleteError = useSelector(selectDeleteBrokerageError);

  const [allProperties, setAllProperties] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [allManagers, setAllManagers] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const fetchFilterData = async () => {
      setDataLoading(true);
      try {
        const propertiesResult = await dispatch(fetchAllProperties()).unwrap();
        if (propertiesResult.properties) {
          setAllProperties(propertiesResult.properties);
        }
        const managersResult = await dispatch(fetchAllUsers({ role: 'Manager' })).unwrap();
        if (managersResult.users) {
          setAllManagers(managersResult.users);
        }
      } catch (error) {
        toast.error('Failed to load filter options');
      } finally {
        setDataLoading(false);
      }
    };
    fetchFilterData();
  }, [dispatch]);

  useEffect(() => {
    axiosInstance.get('/api/users/agents-for-current-user')
      .then(res => {
        setAllAgents(res.data.agents || []);
      }).catch((err) => {
        showErrorToast(err, "Failed to load agents");
      })
  }, []);

  useEffect(() => {
    dispatch(fetchBrokerages({
      page: pagination.currentPage,
      perPage: pagination.perPage,
      search: searchTerm,
      propertyCode: filters.propertyCode,
      agentCode: filters.agentCode,
      managerCode: filters.managerCode,
    }));
  }, [dispatch, pagination.currentPage, pagination.perPage, searchTerm, filters]);

  useEffect(() => {
    if (createError) {
      toast.error(createError);
      dispatch(clearCreateError());
    }
    if (updateError) {
      toast.error(updateError);
      dispatch(clearUpdateError());
    }
    if (deleteError) {
      toast.error(deleteError);
      dispatch(clearDeleteError());
    }
  }, [createError, updateError, deleteError, dispatch]);

  const handlePageChange = (page) => {
    dispatch(fetchBrokerages({
      page,
      perPage: pagination.perPage,
      search: searchTerm,
      propertyCode: filters.propertyCode,
      agentCode: filters.agentCode,
      managerCode: filters.managerCode,
    }));
  };

  const handleCreate = async (formData) => {
    try {
      await dispatch(createBrokerage(formData)).unwrap();
      toast.success('Brokerage created successfully');
      setShowModal(false);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleEdit = async (formData) => {
    try {
      await dispatch(updateBrokerage({ id: editingBrokerage.id, brokerageData: formData })).unwrap();
      toast.success('Brokerage updated successfully');
      setShowModal(false);
      setEditingBrokerage(null);
      dispatch(fetchBrokerages({
        page: pagination.currentPage,
        perPage: pagination.perPage,
        search: searchTerm,
        propertyCode: filters.propertyCode,
        agentCode: filters.agentCode,
        managerCode: filters.managerCode,
      }));
    } catch (error) {
      toast.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteBrokerage(deletingBrokerage.id)).unwrap();
      toast.success('Brokerage deleted successfully');
      setDeletingBrokerage(null);
    } catch (error) {
      toast.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBrokerage(null);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key, value) => {
    // Convert "all" values to empty strings to properly show all records
    const processedValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: processedValue }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ propertyCode: '', agentCode: '', managerCode: '' });
  };

  const filterOptions = [
    {
      key: 'propertyCode',
      label: 'Property Code',
      placeholder: 'All Properties',
      options: allProperties.map((p, index) => ({
        value: p.property_code,
        label: `${p.property_code} - ${p.property_name}`,
        key: `property-${index}-${p.property_code}`
      }))
    },
    {
      key: 'agentCode',
      label: 'Agent Code',
      placeholder: 'All Agents',
      options: allAgents.map((a, index) => ({
        value: a.user_code,
        label: `${a.user_code} - ${a.name}`,
        key: `agent-${index}-${a.user_code}`
      }))
    },
    {
      key: 'managerCode',
      label: 'Manager Code',
      placeholder: 'All Managers',
      options: allManagers.map((m, index) => ({
        value: m.user_code,
        label: `${m.user_code} - ${m.name}`,
        key: `manager-${index}-${m.user_code}`
      }))
    }
  ];

  const activeFilters = {
    propertyCode: filters.propertyCode,
    agentCode: filters.agentCode,
    managerCode: filters.managerCode,
  };

  const columns = [
    {
      key: 'brokerage_code',
      label: 'Brokerage Code',
      sortable: true,
      mobilePriority: true,
      render: (value, row) => (
        <CodeBadge code={value} size="xxs" />
      )
    },
    {
      key: 'total_brokerage',
      label: 'Brokerage Amount',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-primary-600">
          ₹{parseFloat(value).toLocaleString('en-IN')}
        </div>
      )
    },
    {
      key: 'property_code',
      label: 'Property',
      sortable: true,
      mobilePriority: true,
      render: (value, row) => {
        const propertyName = row.property_name || allProperties.find(p => p.property_code === value)?.property_name || 'N/A';
        return (
          <div key={`property-${row.id}-${value}`}>
            <CodeBadge code={value} size="xxs" />
            <div className="text-xs text-gray-500 mt-1">{propertyName}</div>
          </div>
        );
      }
    },
    {
      key: 'manager_code',
      label: 'Manager',
      sortable: true,
      render: (value, row) => {
        // Use joined data if available, otherwise fallback to array lookup
        const managerName = row.manager_name || allManagers.find(m => m.user_code === value)?.name || 'N/A';
        return (
          <div key={`manager-${row.id}-${value}`}>
            <CodeBadge code={value} size="xxs" />
            <div className="text-xs text-gray-500 mt-1">{managerName}</div>
          </div>
        );
      }
    },
    {
      key: 'manager_commission_value',
      label: 'Manager Commission',
      sortable: true,
      render: (value, row) => (
        <div className="font-medium text-warning-600">
          ₹{parseFloat(value).toLocaleString('en-IN')}
          {row.manager_commission_type === 'percent' && (
            <span className="text-xs text-gray-500 ml-1">({value}%)</span>
          )}
        </div>
      )
    },
    {
      key: 'agent_code',
      label: 'Agent',
      sortable: true,
      mobilePriority: true,
      render: (value, row) => {
        const agentName = row.agent_name || allAgents.find(a => a.user_code === value)?.name || 'N/A';
        return (
          <div key={`agent-${row.id}-${value}`}>
            <CodeBadge code={value} size="xxs" />
            <div className="text-xs text-gray-500 mt-1">{agentName}</div>
          </div>
        );
      }
    },
    {
      key: 'agent_commission',
      label: 'Agent Commission',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-success-600">
          ₹{parseFloat(value).toLocaleString('en-IN')}
        </div>
      )
    },
    {
      key: 'mode_of_payment',
      label: 'Payment Mode',
      sortable: true,
      render: (value, row) => (
        <Badge variant={value === 'cash' ? 'success' : value === 'bank_transfer' ? 'primary' : 'secondary'} key={`payment-badge-${row.id}-${value}`}>
          {PAYMENT_MODES.find(m => m.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created Date',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-gray-500">
          {FORMATDATE(value, 3)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      mobilePriority: true,
      hideFromColumnControls: true,
      render: (_, row) => (
        <div key={`actions-${row.id}`} className="flex space-x-2">
          <CheckPermission permission="brokerage-view">
            <Button
              key={`view-${row.id}`}
              size="square"
              variant="outline"
              onClick={() => {
                const encryptedId = hashids.encode(row.id);
                router.push(`/brokerages/${encryptedId}`);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="brokerage-edit">
            <Button
              key={`edit-${row.id}`}
              size="square"
              variant="success"
              onClick={() => {
                setEditingBrokerage(row);
                setShowModal(true);
              }}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="brokerage-delete">
            <Button
              key={`delete-${row.id}`}
              size="square"
              variant="danger"
              onClick={() => setDeletingBrokerage(row)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
        </div>
      ),
      hideFromColumnControls: true
    }
  ];
  const filteredColumns = columns.filter(col => visibleColumns.includes(col.key));
  const columnControlsColumns = columns.filter(col => !col.hideFromColumnControls);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card variant="elevated">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <BuildingOfficeIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading brokerages</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => {
              dispatch(clearError());
              dispatch(fetchBrokerages({
                page: pagination.currentPage,
                perPage: pagination.perPage,
                search: searchTerm,
                propertyCode: filters.propertyCode,
                agentCode: filters.agentCode,
                managerCode: filters.managerCode,
              }));
            }}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Brokerage Management</h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Track brokerage and commission details for each deal
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-2 sm:space-x-3">
              <CheckPermission permission="brokerage-create">
                <Button
                  variant="primary"
                  icon={PlusIcon}
                  size="sm"
                  iconSize="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => setShowModal(true)}
                  className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
                >
                  Add Brokerage
                </Button>
              </CheckPermission>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Brokerage</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    ₹{brokerages.reduce((sum, b) => sum + (parseFloat(b.total_brokerage) || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Agents Commissions</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    ₹{brokerages.reduce((sum, b) => sum + (parseFloat(b.agent_commission) || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Managers Commissions</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                    ₹{brokerages.reduce((sum, b) => sum + (parseFloat(b.manager_commission_value) || 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{brokerages.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters with Column Controls */}
          <FilterSection
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filterOptions}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            searchPlaceholder="Search brokerages..."
            showSearch={false}
            // Column visibility props - exclude actions column
            columns={columnControlsColumns}
            visibleColumns={visibleColumns.filter(col => col !== 'actions')}
            onColumnVisibilityChange={(newColumns) => {
              // Always include actions column in the final visible columns
              setVisibleColumns([...newColumns, 'actions']);
            }}
            showColumnControls={true}
            showActiveFilters={false}
          />

          {/* Table */}
          <Card>
            <Table
              columns={filteredColumns}
              data={brokerages}
              loading={loading || dataLoading}
              emptyMessage="No brokerages found"
            />
          </Card>

          {/* Pagination */}
          {brokerages.length > 0 && (
            <div className="flex justify-center px-2 sm:px-0">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                total={pagination.total}
                perPage={pagination.perPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title=""
        size="lg"
        className="mx-2 sm:mx-4"
      >
        <BrokerageForm
          initial={editingBrokerage}
          onSubmit={editingBrokerage ? handleEdit : handleCreate}
          onClose={handleCloseModal}
          properties={allProperties}
          agents={allAgents}
          managers={allManagers}
          loading={editingBrokerage ? updateLoading : createLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingBrokerage}
        onClose={() => setDeletingBrokerage(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Brokerage"
        description="This action will permanently remove the brokerage from the system."
        itemType="brokerage"
        itemData={deletingBrokerage}
        confirmText="Delete Brokerage"
        cancelText="Cancel"
      />
    </div>
  );
} 