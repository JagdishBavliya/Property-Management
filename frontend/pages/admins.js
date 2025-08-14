import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Hashids from 'hashids';

// Redux
import { 
  fetchRoles,
  selectRoles,
  selectRolesError
} from '../store/slices/rolesSlice';
import { 
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  selectUsers,
  selectUsersPagination,
  selectUsersLoading,
  selectUsersError,
  selectCreateUserLoading,
  selectUpdateUserLoading,
  selectDeleteUserLoading,
  clearError
} from '../store/slices/usersSlice';

// Components
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import CheckPermission from '../components/ui/CkeckPermission';
import FilterSection from '../components/ui/FilterSection';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import CodeBadge from '../components/ui/CodeBadge';

import { 
  PencilSquareIcon, TrashIcon, EyeIcon, PlusIcon,
  UserIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { numericInputProps } from '../utils/constants';

const AdminForm = ({ initial, onSubmit, onClose, roles, loading }) => {
  const { register, handleSubmit, formState: { errors }, watch, reset
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: ''
    }
  });

  const watchedPassword = watch('password');
  useEffect(() => {
    if (initial) {
      reset({
        name: initial.name || '',
        email: initial.email || '',
        phone: initial.phone || '',
        password: '',
        confirm_password: ''
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
      });
    }
  }, [initial, reset]);

  const onSubmitForm = (data) => {
    const adminRole = roles.find(role => role.name === 'Admin');
    if (adminRole) {
      data.roles = [adminRole.id];
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
          {initial ? 'Edit Admin' : 'Add New Admin'}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          {initial 
            ? 'Update admin information and permissions.'
            : 'Create a new admin account with administrative access to the system.'
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
            {initial ? 'Update Admin' : 'Create Admin'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function AdminsPage() {
  const dispatch = useDispatch();
  const [modal, setModal] = useState({ open: false, user: null });
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const router = useRouter();

  // Redux selectors
  const roles = useSelector(selectRoles);
  const rolesError = useSelector(selectRolesError);
  const users = useSelector(selectUsers);
  const usersPagination = useSelector(selectUsersPagination);
  const usersLoading = useSelector(selectUsersLoading);
  const usersError = useSelector(selectUsersError);
  const createLoading = useSelector(selectCreateUserLoading);
  const updateLoading = useSelector(selectUpdateUserLoading);
  const deleteLoading = useSelector(selectDeleteUserLoading);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    const { search: urlSearch } = router.query;
    if (urlSearch && !searchQuery) setSearchQuery(urlSearch);
  }, [router.query, searchQuery]);

  useEffect(() => {
    dispatch(fetchUsers({ page: pagination.currentPage, perPage: pagination.perPage, search: searchQuery, role: 'Admin' }));
  }, [dispatch, pagination.currentPage, pagination.perPage, searchQuery]);

  useEffect(() => {
    if (usersPagination) setPagination(usersPagination);
  }, [usersPagination]);

  useEffect(() => {
    if (usersError) {
      toast.error(usersError);
      dispatch(clearError());
    }
    if (rolesError) {
      toast.error(rolesError);
    }
  }, [usersError, rolesError, dispatch]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleCreate = async (formData) => {
    try {
      await dispatch(createUser(formData)).unwrap();
      toast.success('Admin created successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchUsers({ page: pagination.currentPage, perPage: pagination.perPage, search: searchQuery, role: 'Admin' }));
    } catch (error) {
      toast.error(error || 'Failed to create admin');
    }
  };

  const handleEdit = async (formData) => {
    try {
      await dispatch(updateUser({ id: modal.user.id, userData: formData })).unwrap();
      toast.success('Admin updated successfully!');
      setModal({ open: false, user: null });
      dispatch(fetchUsers({ page: pagination.currentPage, perPage: pagination.perPage, search: searchQuery, role: 'Admin' }));
    } catch (error) {
      toast.error(error || 'Failed to update admin');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteUser(deleteId)).unwrap();
      toast.success('Admin deleted successfully!');
      setDeleteId(null);
      dispatch(fetchUsers({ page: pagination.currentPage, perPage: pagination.perPage, search: searchQuery, role: 'Admin' }));
    } catch (error) {
      toast.error(error || 'Failed to delete admin');
    }
  };

  const handleCloseModal = () => {
    setModal({ open: false, user: null });
  };

  const handleSearchChange = (value) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchQuery(value);
    const timeoutId = setTimeout(() => {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    setSearchTimeout(timeoutId);
  };

  const hashids = new Hashids('your-salt-string', 6);
  const columns = [
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
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <CheckPermission permission="admin-view">
            <Button
              size="square"
              variant="outline"
              onClick={() => {
                const encryptedId = hashids.encode(row.id);
                router.push(`/admins/${encryptedId}`);
              }}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="admin-edit">
            <Button
              size="square"
              variant="success"
              onClick={() => setModal({ open: true, user: row })}
            >
              <PencilSquareIcon className="h-4 w-4" />
            </Button>
          </CheckPermission>
          <CheckPermission permission="admin-delete">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admins</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your admin users and their details.</p>
            </div>
            <CheckPermission permission="admin-create">
              <Button 
                variant="primary"
                icon={PlusIcon}
                size="sm"
                iconSize="h-5 w-5 sm:h-6 sm:w-6"
                onClick={() => setModal({ open: true, user: null })}
              >
                Add Admin
              </Button>
            </CheckPermission>
          </div>

          {/* Filter Section */}
          <FilterSection
            searchPlaceholder="Search admins..."
            searchValue={searchQuery}
            onSearchChange={handleSearchChange}
            resultsCount={users.length}
            totalCount={pagination.total}
            compact={true}
            showActiveFilters={false}
          />

          {/* Table Card */}
          <Card variant="elevated">
            <Table
              columns={columns}
              data={users}
              loading={usersLoading}
              emptyMessage="No admins found"
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

          {/* Create/Edit Modal */}
          <Modal
            isOpen={modal.open}
            onClose={handleCloseModal}
            title=""
            size="lg"
          >
            <AdminForm
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
            title="Delete Admin"
            description="This action will permanently remove the admin from the system."
            itemType="admin"
            itemData={deleteId ? users.find(user => user.id === deleteId) : null}
            confirmText="Delete Admin"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
} 