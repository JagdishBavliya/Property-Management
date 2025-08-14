import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';

// Redux
import {
  fetchRoles,
  fetchPermissions,
  fetchRolePermissions,
  updateRolePermissions,
  selectRoles,
  selectPermissions,
  selectRolePermissions,
  selectRolesLoading,
  selectPermissionsLoading,
  selectRolePermissionsLoading,
  selectUpdatePermissionsLoading,
  selectRolesError,
  selectPermissionsError,
  selectRolePermissionsError,
  selectUpdatePermissionsError,
  clearError,
  clearPermissionsError,
  clearRolePermissionsError,
  clearUpdatePermissionsError,
  updateLocalRolePermissions
} from '../store/slices/rolesSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import { ShieldCheckIcon, UserGroupIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const dispatch = useDispatch();
  const { user, hasPermission } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const canManageRoles = hasPermission('Admin');

  // Redux selectors
  const roles = useSelector(selectRoles);
  const permissions = useSelector(selectPermissions);
  const rolePermissions = useSelector(selectRolePermissions);
  const rolesLoading = useSelector(selectRolesLoading);
  const permissionsLoading = useSelector(selectPermissionsLoading);
  const rolePermissionsLoading = useSelector(selectRolePermissionsLoading);
  const updatePermissionsLoading = useSelector(selectUpdatePermissionsLoading);
  const rolesError = useSelector(selectRolesError);
  const permissionsError = useSelector(selectPermissionsError);
  const rolePermissionsError = useSelector(selectRolePermissionsError);
  const updatePermissionsError = useSelector(selectUpdatePermissionsError);

  const loading = rolesLoading || permissionsLoading;

  useEffect(() => {
    if (canManageRoles) loadData();
  }, [canManageRoles, dispatch]);

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].id);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    if (selectedRole && roles.length > 0) {
      dispatch(fetchRolePermissions(selectedRole));
    }
  }, [selectedRole, roles.length, dispatch]);

  useEffect(() => { }, [rolePermissions]);

  useEffect(() => {
    if (rolesError) {
      toast.error(rolesError);
      dispatch(clearError());
    }
    if (permissionsError) {
      toast.error(permissionsError);
      dispatch(clearPermissionsError());
    }
    if (rolePermissionsError) {
      toast.error(rolePermissionsError);
      dispatch(clearRolePermissionsError());
    }
    if (updatePermissionsError) {
      toast.error(updatePermissionsError);
      dispatch(clearUpdatePermissionsError());
    }
  }, [rolesError, permissionsError, rolePermissionsError, updatePermissionsError, dispatch]);

  useEffect(() => {
    if (roles.length > 0) {
      roles.forEach(role => {
        dispatch(fetchRolePermissions(role.id));
      });
    }
  }, [roles, dispatch]);

  const loadData = async () => {
    try {
      await Promise.all([dispatch(fetchRoles()), dispatch(fetchPermissions())]);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    }
  };

  const handlePermissionChange = (roleId, permissionId, checked) => {
    const currentPermissions = rolePermissions[roleId] || [];
    const newPermissions = checked ? [...currentPermissions, permissionId] : currentPermissions.filter(id => id !== permissionId);
    dispatch(updateLocalRolePermissions({ roleId, permissions: newPermissions }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      const currentPermissions = rolePermissions[selectedRole] || [];
      await dispatch(updateRolePermissions({ roleId: selectedRole, permissions: currentPermissions })).unwrap();

      setRefreshTrigger(prev => prev + 1);
      toast.success('Permissions updated successfully!');
      setMessage({ type: 'success', text: 'Permissions updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

      if (user && user.role === roles.find(r => r.id === selectedRole)?.name) {
        setTimeout(() => {
          dispatch(getCurrentUser());
        }, 500);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: error || 'Failed to save permissions' });
    }
  };

  const isPermissionChecked = (roleId, permissionId) => {
    const rolePerms = rolePermissions[roleId];
    if (!Array.isArray(rolePerms)) {
      return false;
    }
    return rolePerms.includes(permissionId);
  };

  const getPermissionCount = (roleId) => {
    const rolePerms = rolePermissions[roleId];
    if (!Array.isArray(rolePerms)) {
      return 0;
    }
    return rolePerms.length;
  };

  const getPermissionCategory = (permissionName) => {
    if (permissionName.startsWith('admin-')) return 'Admins';
    if (permissionName.startsWith('manager-')) return 'Managers';
    if (permissionName.startsWith('agent-')) return 'Agents';
    if (permissionName.startsWith('property-')) return 'Properties';
    if (permissionName.startsWith('report-')) return 'Reports';
    if (permissionName.startsWith('visit-')) return 'Visits';
    if (permissionName.startsWith('estimate-')) return 'Estimates';
    if (permissionName.startsWith('brokerage-')) return 'Brokerages';
    if (permissionName.startsWith('notification-')) return 'Notifications';
    if (permissionName.startsWith('role-')) return 'Roles';
    return 'Other';
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = getPermissionCategory(permission.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {});

  const getCategorySelectAllState = (categoryPermissions) => {
    if (!selectedRole) return { checked: false, indeterminate: false };
    const rolePerms = rolePermissions[selectedRole] || [];
    const ids = categoryPermissions.map(p => p.id);
    const checkedCount = ids.filter(id => rolePerms.includes(id)).length;
    if (checkedCount === 0) return { checked: false, indeterminate: false };
    if (checkedCount === ids.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  const handleSelectAllCategory = (categoryPermissions, checked) => {
    if (!selectedRole) return;
    const currentPermissions = rolePermissions[selectedRole] || [];
    const ids = categoryPermissions.map(p => p.id);
    let newPerms;
    if (checked) {
      newPerms = Array.from(new Set([...currentPermissions, ...ids]));
    } else {
      newPerms = currentPermissions.filter(id => !ids.includes(id));
    }
    dispatch(updateLocalRolePermissions({ roleId: selectedRole, permissions: newPerms }));
  };

  const handleSelectAllPermissions = () => {
    if (!selectedRole) return;
    const currentPermissions = rolePermissions[selectedRole] || [];
    const allPermissionIds = permissions.map(p => p.id);
    const allSelected = allPermissionIds.every(id => currentPermissions.includes(id));
    if (allSelected) {
      dispatch(updateLocalRolePermissions({ roleId: selectedRole, permissions: [] }));
    } else {
      dispatch(updateLocalRolePermissions({ roleId: selectedRole, permissions: allPermissionIds }));
    }
  };

  const isAllSelected = () => {
    if (!selectedRole || !permissions.length) return false;
    const currentPermissions = rolePermissions[selectedRole] || [];
    const allPermissionIds = permissions.map(p => p.id);
    return allPermissionIds.every(id => currentPermissions.includes(id));
  };

  if (!canManageRoles) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-sm text-gray-600">Manage your account and system settings</p>
              </div>
            </div>

            <Card>
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  You don&apos;t have permission to access role management settings.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="mt-2 text-sm text-gray-600">Manage your account and system settings</p>
              </div>
            </div>
            <Card>
              <div className="flex justify-center items-center py-12">
                <Loader />
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-2 text-sm text-gray-600">Manage your account and system settings</p>
            </div>
          </div>

          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Role Permissions</h2>
                  <p className="text-sm text-gray-600">Manage permissions for different user roles</p>
                </div>
              </div>

              {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Role Selection */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Select Role</h3>
                    <div className="space-y-2">
                      {roles.map((role) => {
                        const permissionCount = getPermissionCount(role.id);
                        return (
                          <button
                            key={`${role.id}-${refreshTrigger}`}
                            onClick={() => setSelectedRole(role.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${selectedRole === role.id
                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                : 'text-gray-700 hover:bg-gray-100'
                              }`}
                          >
                            <span>{role.name}</span>
                            <span
                              key={`count-${role.id}-${permissionCount}-${refreshTrigger}`}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedRole === role.id
                                  ? 'bg-primary-200 text-primary-800'
                                  : 'bg-gray-200 text-gray-700'
                                }`}>
                              {permissionCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="lg:col-span-3">
                  {selectedRole && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Permissions for {roles.find(r => r.id === selectedRole)?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {getPermissionCount(selectedRole)} of {permissions.length} permissions assigned
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleSelectAllPermissions}
                            disabled={updatePermissionsLoading}
                          >
                            {isAllSelected() ? (
                              <>
                                <XMarkIcon className="h-4 w-4 mr-1" />
                                Unselect All
                              </>
                            ) : (
                              <>
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Select All
                              </>
                            )}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSavePermissions}
                            loading={updatePermissionsLoading}
                            disabled={updatePermissionsLoading}
                          >
                            Update
                          </Button>
                        </div>
                      </div>

                      {rolePermissionsLoading ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                            <div key={category} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-medium text-gray-900">{category}</h4>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                    {categoryPermissions.filter(p => isPermissionChecked(selectedRole, p.id)).length}/{categoryPermissions.length}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {(() => {
                                    const state = getCategorySelectAllState(categoryPermissions);
                                    return (
                                      <>
                                        <button
                                          onClick={() => handleSelectAllCategory(categoryPermissions, true)}
                                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                          Select All
                                        </button>
                                        <button
                                          onClick={() => handleSelectAllCategory(categoryPermissions, false)}
                                          className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                                        >
                                          Clear All
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryPermissions.map((permission) => (
                                  <label
                                    key={`${permission.id}-${refreshTrigger}`}
                                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isPermissionChecked(selectedRole, permission.id)}
                                      onChange={(e) => handlePermissionChange(selectedRole, permission.id, e.target.checked)}
                                      className="h-4 w-4 appearance-none border-2 border-gray-300 rounded bg-white checked:bg-primary-600 checked:border-primary-600 checked:bg-[url('data:image/svg+xml,%3csvg_viewBox=%270_0_16_16%27_fill=%27white%27_xmlns=%27http://www.w3.org/2000/svg%27%3e%3cpath_d=%27M12.207_4.793a1_1_0_010_1.414l-5_5a1_1_0_01-1.414_0l-2-2a1_1_0_011.414-1.414L6.5_9.086l4.293-4.293a1_1_0_011.414_0z%27/%3e%3c/svg%3e')] checked:bg-[length:12px_12px] checked:bg-center checked:bg-no-repeat focus:ring-2 focus:ring-primary-500/30 focus:ring-offset-1 hover:border-primary-400 hover:checked:bg-primary-700 hover:checked:border-primary-700 transition-all duration-200"
                                    />
                                    <span className="text-sm text-gray-700">{permission.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 