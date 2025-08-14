import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import Hashids from 'hashids';
import { useRouter } from 'next/router';

// Redux
import { 
  fetchRoles,
  selectRoles,
  selectRolesLoading,
  selectRolesError
} from '../store/slices/rolesSlice';
import { 
  createUser,
  updateUser,
  selectUsers,
  selectUsersPagination,
  selectUsersLoading,
  selectUsersError,
  selectCreateUserLoading,
  selectUpdateUserLoading,
  selectDeleteUserLoading,
  fetchManagersForCurrentUser,
  deleteManagerByManagerCode
} from '../store/slices/usersSlice';

// Components
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import CodeBadge from '../components/ui/CodeBadge';
import Pagination from '../components/ui/Pagination';
import FilterSection from '../components/ui/FilterSection';
import CheckPermission from '../components/ui/CkeckPermission';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';

import { 
  PencilSquareIcon, 
  TrashIcon, 
  EyeIcon, 
  PlusIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import SearchService from '../utils/searchService';
import { numericInputProps } from '../utils/constants';

const UserForm = ({ initial, onSubmit, onClose, roles, loading }) => {
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
      confirm_password: ''
    }
  });

  // Prefill form when editing
  useEffect(() => {
    if (initial) {
      reset({
        ...initial,
        password: '',
        confirm_password: '',
      });
      if (initial.admin_code) {
        setValue('admin_code', initial.admin_code);
      }
    }
  }, [initial, reset]);

  const watchedPassword = watch('password');
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminCode, setAdminCode] = useState(initial?.admin_code || '');

  useEffect(() => {
    setAdminsLoading(true);
    SearchService.fetchAdminsDropdown().then((data) => {
      setAdmins(data);
      setAdminsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (initial && initial.admin_code) {
      setAdminCode(initial.admin_code);
    }
  }, [initial]);

  const onSubmitForm = (data) => {
    const managerRole = roles.find(role => role.name === 'Manager');
    if (managerRole) {
      data.roles = [managerRole.id];
    }
    if (adminCode) {
      data.admin_code = adminCode;
    }
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
          {initial ? 'Edit Manager' : 'Add New Manager'}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {initial 
            ? 'Update manager information and permissions.'
            : 'Create a new manager account with full access to property management.'
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
                  {...register('name', { 
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
              )}
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
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { 
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                      message: 'Invalid email address' 
                    }
                  })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-sm ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
              )}
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
                  {...register('phone', { 
                    required: 'Phone is required',
                    pattern: { 
                      value: /^[0-9]{10}$/,
                      message: 'Please enter a valid 10-digit mobile number' 
                    }
                  })}
                  {...numericInputProps.digits({ maxLength: 10 })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-sm ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>
          {/* Admin Dropdown for Manager - match Agent form select styling with validation */}
          <div className="mt-4 space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Assign Admin <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UsersIcon className="h-4 w-4 text-gray-400" />
              </div>
              <select
                {...register('admin_code', { required: 'Admin is required' })}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.admin_code ? 'border-red-300' : 'border-gray-300'} ${adminsLoading ? 'opacity-70' : ''}`}
                value={adminCode}
                onChange={e => { setAdminCode(e.target.value); setValue('admin_code', e.target.value, { shouldValidate: true }); }}
                disabled={adminsLoading}
              >
                <option value="">{adminsLoading ? 'Loading admins...' : 'Select admin'}</option>
                {admins.map(a => (
                  <option key={a.user_code} value={a.user_code}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
            {errors.admin_code && <span className="text-red-500 text-xs">{errors.admin_code.message}</span>}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
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
                {initial ? "New Password (leave blank for old)" : "Password"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  {...register('password', { 
                    required: initial ? false : 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-sm ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={initial ? "Enter new password" : "Enter password"}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                {initial ? "Confirm New Password" : "Confirm Password"} <span className="text-red-500">*</span>
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
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-sm ${
                    errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={initial ? "Confirm new password" : "Confirm password"}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-red-600 mt-1">{errors.confirm_password.message}</p>
              )}
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
            {initial ? 'Update Manager' : 'Create Manager'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function UsersPage() {
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, user: null });
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const router = useRouter();

  // Redux selectors
  const roles = useSelector(selectRoles);
  const rolesLoading = useSelector(selectRolesLoading);
  const rolesError = useSelector(selectRolesError);
  const managersState = useSelector(selectUsers);
  const loading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);
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
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchManagersForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
  }, [dispatch, currentPage, perPage, searchQuery]);

  useEffect(() => {
    const { search: urlSearch } = router.query;
    if (urlSearch && !searchQuery) setSearchQuery(urlSearch);
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
      toast.success('Manager created successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchManagersForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to create manager');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await dispatch(updateUser({ id: modal.user.user_id, userData: formData })).unwrap();
      toast.success('Manager updated successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchManagersForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to update manager');
    }
  };

  const handleDelete = async () => {
    try {
      const manager = managers.find(user => user.id === deleteId);
      if (!manager) throw new Error('Manager not found');
      await dispatch(deleteManagerByManagerCode(manager.manager_code)).unwrap();
      toast.success('Manager deleted successfully!');
      setDeleteId(null);
      dispatch(fetchManagersForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery }));
    } catch (error) {
      toast.error(error || 'Failed to delete manager');
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
      dispatch(fetchManagersForCurrentUser({ page: 1, limit: perPage, search: value }));
    }, 500);
    setSearchTimeout(timeoutId);
  };

  const hashids = new Hashids('your-salt-string', 6);
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
      key: 'user_code', 
      label: 'User Code', 
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <CheckPermission permission="manager-view">
            <Button
              size="square"
              variant="outline"
              onClick={() => {
                const encryptedId = hashids.encode(row.id);
                router.push(`/managers/${encryptedId}`);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="manager-edit">
            <Button
              size="square"
              variant="success"
              onClick={() => { setModal({ open: true, user: row }); }}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="manager-delete">
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
    },
  ];

  const managers = Array.isArray(managersState) ? managersState : managersState.managers || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Managers</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your manager users and their details.</p>
            </div>
            <CheckPermission permission="manager-create">
              <Button 
                variant="primary"
                icon={PlusIcon}
                size="sm"
                iconSize="h-5 w-5 sm:h-6 sm:w-6"
                onClick={() => setModal({ open: true, user: null })}
              >
                Add Manager
              </Button>
            </CheckPermission>
          </div>

          {/* Filter Section */}
          <FilterSection
            searchPlaceholder="Search managers..."
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            resultsCount={managers.length}
            totalCount={pagination.total}
            compact={true}
            showActiveFilters={false}
          />

          {/* Table Card */}
          <Card variant="elevated">
            <Table
              columns={columns}
              data={managers}
              loading={loading}
              emptyMessage="No managers found"
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
            <UserForm
              initial={modal.user}
              onSubmit={modal.user ? handleEdit : handleCreate}
              onClose={handleCloseModal}
              roles={roles}
              loading={modal.user ? updateLoading : createLoading}
            />
          </Modal>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
            title="Delete Manager"
            description="This action will permanently remove the manager from the system."
            itemType="manager"
            itemData={deleteId ? managers.find(manager => manager.id === deleteId) : null}
            confirmText="Delete Manager"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
} 