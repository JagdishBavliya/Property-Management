import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Hashids from 'hashids';
import axiosInstance from '../utils/axiosInstance';

// Redux
import { 
  fetchRoles,
  selectRoles,
  selectRolesError
} from '../store/slices/rolesSlice';
import { 
  createUser,
  updateUser,
  selectCreateUserLoading,
  selectUpdateUserLoading,
  selectDeleteUserLoading,
  selectUsers,
  selectUsersPagination,
  selectUsersLoading,
  fetchAgentsForCurrentUser,
  deleteAgentByAgentCode,
} from '../store/slices/usersSlice';

// Components
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import CodeBadge from '../components/ui/CodeBadge';
import CheckPermission from '../components/ui/CkeckPermission';
import FilterSection from '../components/ui/FilterSection';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import { AGENT_TYPES, numericInputProps } from '../utils/constants';

import { 
  PencilSquareIcon, TrashIcon,  EyeIcon,  PlusIcon, 
  UserIcon, EnvelopeIcon, PhoneIcon, UsersIcon, 
  LockClosedIcon, ShieldCheckIcon, CurrencyDollarIcon
} from '@heroicons/react/24/outline';
const hashids = new Hashids('your-salt-string', 6);

const AgentForm = ({ initial, onSubmit, onClose, roles, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      agent_type: '',
      agent_salary: '',
      commission: '',
      commission_type: 'percent',
      overdraft: '',
      balance: '',
      manager_code: '',
      admin_code: ''
    }
  });

  const watchedPassword = watch('password');
  const [admins, setAdmins] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [adminCode, setAdminCode] = useState(initial?.admin_code || '');
  const [managerCode, setManagerCode] = useState(initial?.manager_code || '');
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [managersLoading, setManagersLoading] = useState(false);

  useEffect(() => {
    setAdminsLoading(true);
    axiosInstance.get('/api/users/admins-dropdown').then(res => {
      setAdmins(res.data.admins || []);
      setAdminsLoading(false);
    });
    setManagersLoading(true);
    axiosInstance.get('/api/users/all-managers').then(res => {
      setManagers(res.data.managers || []);
      setManagersLoading(false);
    });
  }, []);

  useEffect(() => {
    if (adminCode) {
      setFilteredManagers(managers.filter(m => m.admin_code === adminCode));
      if (!managers.some(m => m.admin_code === adminCode && m.user_code === managerCode)) {
        setManagerCode('');
      }
    } else {
      setFilteredManagers([]);
      setManagerCode('');
    }
  }, [adminCode, managers]);

  useEffect(() => {
    if (managerCode) {
      const manager = managers.find(m => m.user_code === managerCode);
      if (manager && manager.admin_code !== adminCode) {
        setAdminCode(manager.admin_code);
      }
    }
  }, [managerCode, managers, adminCode]);

  useEffect(() => {
    if (initial) {
      reset({
        ...initial,
        password: '',
        confirm_password: '',
      });
      setAdminCode(initial.admin_code || '');
      setManagerCode(initial.manager_code || '');
    }
  }, [initial, reset]);

  const onSubmitForm = (data) => {
    const agentRole = roles.find(role => role.name === 'Agent');
    if (agentRole) data.roles = [agentRole.id];
    data.admin_code = adminCode;
    data.manager_code = managerCode;
    onSubmit(data);
  };

  return (
    <div className="relative">
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-10"></div>
          <UserIcon className="h-8 w-8 text-primary-600 relative z-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {initial ? 'Edit Agent' : 'Add New Agent'}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {initial 
            ? 'Update agent information and permissions.'
            : 'Create a new agent account and assign details.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <UserIcon className="w-3 h-3 text-blue-600" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">Personal Information</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter full name"
                />
              </div>
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            {/* Phone */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' } })}
                  {...numericInputProps.digits({ maxLength: 10 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
          </div>
        </div>

        {/* Agent Details Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary-100 rounded-md flex items-center justify-center">
              <Badge variant="primary" size="xxs">A</Badge>
            </div>
            <h4 className="text-base font-semibold text-gray-900">Agent Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Agent Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Agent Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.agent_type ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('agent_type', { required: 'Agent type is required' })}
                >
                  <option value="">Select type</option>
                  {AGENT_TYPES.map((type, index) => (
                    <option key={index} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.agent_type && <span className="text-red-500 text-xs">{errors.agent_type.message}</span>}
            </div>
            {/* Admin Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Admin <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.admin_code ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('admin_code', { required: 'Admin is required' })}
                  value={adminCode}
                  onChange={e => { setAdminCode(e.target.value); setValue('admin_code', e.target.value, { shouldValidate: true }); }}
                  disabled={adminsLoading}
                >
                  <option value="">{adminsLoading ? 'Loading admins...' : 'Select admin'}</option>
                  {admins.map(admin => (
                    <option key={admin.user_code} value={admin.user_code}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
              {errors.admin_code && <span className="text-red-500 text-xs">{errors.admin_code.message}</span>}
            </div>
            {/* Manager Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Manager <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UsersIcon className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.manager_code ? 'border-red-300' : 'border-gray-300'}`}
                  {...register('manager_code', { required: 'Manager is required' })}
                  value={managerCode}
                  onChange={e => { setManagerCode(e.target.value); setValue('manager_code', e.target.value, { shouldValidate: true }); }}
                  disabled={managersLoading || !adminCode}
                >
                  <option value="">{managersLoading ? 'Loading managers...' : 'Select manager'}</option>
                  {filteredManagers.length > 0 ? (
                    filteredManagers.map(manager => (
                      <option key={manager.user_code} value={manager.user_code}>
                        {manager.name} ({manager.user_code})
                      </option>
                    ))
                  ) : (
                    !managersLoading && <option value="" disabled>No managers available</option>
                  )}
                </select>
              </div>
              {errors.manager_code && <span className="text-red-500 text-xs">{errors.manager_code.message}</span>}
            </div>
            {/* Agent Salary */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Agent Salary (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('agent_salary', { min: { value: 0, message: 'Salary cannot be negative' } })}
                  {...numericInputProps.decimal({ decimalPlaces: 2 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.agent_salary ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter salary"
                />
              </div>
              {errors.agent_salary && <span className="text-red-500 text-xs">{errors.agent_salary.message}</span>}
            </div>
            {/* Commission */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Commission</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    {...register('commission', { min: { value: 0, message: 'Commission cannot be negative' } })}
                    {...numericInputProps.decimal({ decimalPlaces: 2 })}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.commission ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Commission"
                  />
                </div>
                <select
                  className="border rounded-lg px-2 py-2 bg-white text-sm"
                  {...register('commission_type')}
                >
                  <option value="percent">%</option>
                  <option value="inr">INR</option>
                </select>
              </div>
              {errors.commission && <span className="text-red-500 text-xs">{errors.commission.message}</span>}
            </div>
            {/* Overdraft */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Overdraft (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('overdraft', { min: { value: 0, message: 'Overdraft cannot be negative' } })}
                  {...numericInputProps.decimal({ decimalPlaces: 2 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.overdraft ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter overdraft"
                />
              </div>
              {errors.overdraft && <span className="text-red-500 text-xs">{errors.overdraft.message}</span>}
            </div>
            {/* Balance */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Balance (INR)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('balance', { min: { value: 0, message: 'Balance cannot be negative' } })}
                  {...numericInputProps.decimal({ decimalPlaces: 2 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm ${errors.balance ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter balance"
                />
              </div>
              {errors.balance && <span className="text-red-500 text-xs">{errors.balance.message}</span>}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center">
              <ShieldCheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <h4 className="text-base font-semibold text-gray-900">Security Settings</h4>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {initial ? 'Optional' : 'Required'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {initial ? "New Password (leave blank to keep current)" : "Password"}
                {!initial && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password', { required: initial ? false : 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={initial ? "Enter new password" : "Enter password"}
                />
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {initial ? "Confirm New Password" : "Confirm Password"}
                {!initial && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('confirm_password', { 
                    required: initial ? false : 'Confirm password is required',
                    validate: value => {
                      if (initial && !watchedPassword) return true;
                      return value === watchedPassword || 'Passwords do not match';
                    }
                  })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm ${errors.confirm_password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={initial ? "Confirm new password" : "Confirm password"}
                />
              </div>
              {errors.confirm_password && <p className="text-xs text-red-600 mt-1">{errors.confirm_password.message}</p>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
            icon={initial ? PencilSquareIcon : PlusIcon}
            className="px-6 py-2"
          >
            {initial ? 'Update Agent' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function AgentsPage() {
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, user: null });
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState([
    'manager_code',
    'user_code',
    'name',
    'email',
    'phone',
    'agent_type',
    'actions'
  ]);
  const router = useRouter();

  // Redux selectors
  const roles = useSelector(selectRoles);
  const rolesError = useSelector(selectRolesError);
  const agents = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const pagination = useSelector(selectUsersPagination) || {
    current_page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_prev_page: false
  };
  const createLoading = useSelector(selectCreateUserLoading);
  const updateLoading = useSelector(selectUpdateUserLoading);
  const deleteLoading = useSelector(selectDeleteUserLoading);

  useEffect(() => {
    dispatch(fetchRoles());
    setManagersLoading(true);
    axiosInstance.get('/api/users/all-managers')
      .then(res => {
        if (res.data.managers) setManagers(res.data.managers);
      })
      .catch((error) => {
        console.error('Failed to fetch managers:', error);
        toast.error('Failed to load managers');
      })
      .finally(() => {
        setManagersLoading(false);
      });
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAgentsForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
  }, [dispatch, currentPage, perPage, searchQuery]);

  useEffect(() => {
    const { search: urlSearch } = router.query;
    if (urlSearch && !searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [router.query, searchQuery]);

  useEffect(() => {
    if (rolesError) toast.error(rolesError);
  }, [rolesError]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerPageChange = (perPageValue) => {
    setPerPage(perPageValue);
    setCurrentPage(1);
  };

  const handleCreate = async (formData) => {
    try {
      await dispatch(createUser(formData)).unwrap();
      toast.success('Agent created successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchAgentsForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to create agent');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await dispatch(updateUser({ id: modal.user.user_id, userData: formData })).unwrap();
      toast.success('Agent updated successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchAgentsForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to update agent');
    }
  };

  const handleDelete = async () => {
    try {
      const agent = agents.find(user => user.id === deleteId);
      if (!agent) throw new Error('Agent not found');
      await dispatch(deleteAgentByAgentCode(agent.user_code)).unwrap();
      toast.success('Agent deleted successfully!');
      setDeleteId(null);
      dispatch(fetchAgentsForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to delete agent');
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, user: null });
  };

  const handleSearchChange = (value) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchQuery(value);
    setCurrentPage(1);
    const timeoutId = setTimeout(() => {
      dispatch(fetchAgentsForCurrentUser({ page: 1, limit: perPage, search: value }));
    }, 500);
    setSearchTimeout(timeoutId);
  };


  const columns = [
    { 
      key: 'admin_code', 
      label: 'Admin Code', 
      render: (val) => (
        <CodeBadge code={val} size="xxs" />
      ),
      mobilePriority: true
    },
    { 
      key: 'manager_code', 
      label: 'Manager Code', 
      render: (val) => (
        <CodeBadge code={val} size="xxs" />
      ),
      mobilePriority: true
    },
    { 
      key: 'user_code', 
      label: 'Code', 
      render: (val) => (
        <CodeBadge code={val} size="xxs" />
      ),
      mobilePriority: true
    },
    { 
      key: 'name', 
      label: 'Name',
      render: (val) => (
        <div className="font-medium text-gray-900">{val}</div>
      ),
      mobilePriority: true
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (val) => (
        <div className="text-sm text-gray-600 truncate max-w-[200px]" title={val}>{val}</div>
      )
    },
    { 
      key: 'phone', 
      label: 'Phone',
      render: (val) => (
        <div className="text-sm text-gray-600 font-mono">{val}</div>
      )
    },
    { 
      key: 'agent_type', 
      label: 'Type', 
      render: (val) => {
        const typeToVariant = {
          Residential: 'primary',
          Commercial: 'success',
          Both: 'accent',
        };
        let idx = -1;
        if (typeof val === 'number') {
          idx = val;
        } else if (typeof val === 'string') {
          const num = Number(val);
          if (!isNaN(num) && num >= 0 && num < AGENT_TYPES.length) {
            idx = num;
          } else {
            idx = AGENT_TYPES.findIndex(opt => opt.value.toLowerCase() === val.toLowerCase());
          }
        }
        if (idx !== -1 && AGENT_TYPES[idx]) {
          const agentTypeValue = AGENT_TYPES[idx].value;
          const variant = typeToVariant[agentTypeValue] || 'secondary';
          return (
            <Badge variant={variant} size="xxs">
              {AGENT_TYPES[idx].label}
            </Badge>
          );
        }
        return <Badge variant="secondary" size="xxs">{val || 'N/A'}</Badge>;
      },
      mobilePriority: true
    },
    { 
      key: 'agent_salary', 
      label: 'Salary', 
      render: (val) => (
        <div className="text-sm font-semibold text-gray-900">
          ₹{Number(val || 0).toLocaleString()}
        </div>
      )
    },
    { 
      key: 'commission', 
      label: 'Commission', 
      render: (val, row) => {
        if (!val) return <span className="text-gray-400 text-sm">-</span>;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch { return val; }
        }
        const commissionType = row.commission_type || 'percent';
        const commissionValue = typeof val === 'object' ? val.value : val;
        
        if (commissionType === 'percent') {
          const salary = Number(row.agent_salary) || 0;
          const commissionAmount = salary * (Number(commissionValue) / 100);
          return (
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{commissionValue}%</div>
              <div className="text-xs text-gray-500">₹{commissionAmount.toLocaleString()}</div>
            </div>
          );
        } else {
          return (
            <div className="text-sm font-semibold text-gray-900">
              ₹{Number(commissionValue).toLocaleString()}
            </div>
          );
        }
      }
    },
    { 
      key: 'overdraft', 
      label: 'Overdraft', 
      render: (val) => (
        <div className="text-sm text-gray-600">
          ₹{Number(val || 0).toLocaleString()}
        </div>
      )
    },
    { 
      key: 'balance', 
      label: 'Balance', 
      render: (val) => (
        <div className="text-sm font-semibold text-gray-900">
          ₹{Number(val || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <CheckPermission permission="agent-view">
            <Button
              size="square"
              variant="outline"
              onClick={() => {
                const encryptedId = hashids.encode(row.id);
                router.push(`/agents/${encryptedId}`);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="agent-edit">
            <Button
              size="square"
              variant="success"
              onClick={() => setModal({ open: true, user: row })}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="agent-delete">
            <Button
              size="square"
              variant="danger"
              onClick={() => setDeleteId(row.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
        </div>
      ),
      hideFromColumnControls: true
    },
  ];
  const filteredColumns = columns.filter(col => visibleColumns.includes(col.key));
  const columnControlsColumns = columns.filter(col => !col.hideFromColumnControls);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your agent users and their details.</p>
            </div>
            <CheckPermission permission="agent-create">
              <Button 
                variant="primary"
                icon={PlusIcon}
                size="sm"
                iconSize="h-5 w-5 sm:h-6 sm:w-6"
                onClick={() => setModal({ open: true, user: null })}
              >
                Add Agent
              </Button>
            </CheckPermission>
          </div>

          {/* Filter Section with Column Controls */}
          <FilterSection
            searchPlaceholder="Search agents..."
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            resultsCount={agents.length}
            totalCount={pagination.total}
            compact={true}
            showActiveFilters={false}
            showSearch={true}
            // Column visibility props - exclude actions column
            columns={columnControlsColumns}
            visibleColumns={visibleColumns.filter(col => col !== 'actions')}
            onColumnVisibilityChange={(newColumns) => {
              // Always include actions column in the final visible columns
              setVisibleColumns([...newColumns, 'actions']);
            }}
            showColumnControls={true}
            // Add empty filters array to ensure column controls show up
            filters={[]}
            activeFilters={{}}
            onFilterChange={() => {}}
            onClearFilters={() => {}}
          />

          {/* Table Card */}
          <Card variant="elevated">
            <Table
              columns={filteredColumns}
              data={agents}
              loading={loading}
              emptyMessage="No agents found"
            />
            {pagination.total_pages > 1 && (
              <div className="pt-6 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.total_pages}
                  onPageChange={handlePageChange}
                  hasNextPage={pagination.has_next_page}
                  hasPrevPage={pagination.has_prev_page}
                  total={pagination.total}
                  perPage={perPage}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            )}
          </Card>

          {/* Create/Edit Modal */}
          <Modal
            isOpen={modal.open}
            onClose={handleCloseModal}
            title=""
            size="lg"
          >
            <AgentForm
              initial={modal.user}
              onSubmit={modal.user ? handleEdit : handleCreate}
              onClose={handleCloseModal}
              roles={roles}
              managers={managers}
              managersLoading={managersLoading}
              loading={modal.user ? updateLoading : createLoading}
            />
          </Modal>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
            title="Delete Agent"
            description="This action will permanently remove the agent from the system."
            itemType="agent"
            itemData={deleteId ? agents.find(user => user.id === deleteId) : null}
            confirmText="Delete Agent"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
} 