"use client"
import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from "../hooks/useAuth";
import { useRoleFlags } from "../hooks/useRoleFlags";
import { toast } from "react-toastify";
import  axiosInstance  from "../utils/axiosInstance";

// Redux
import {
  fetchNotifications,
  fetchNotificationStats,
  createNotification,
  deleteNotification,
  bulkDeleteNotifications,
  markNotificationAsRead,
  bulkMarkNotificationsAsRead,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectNotificationsPagination,
  selectNotificationsStats,
  selectCreateNotificationLoading,
  selectDeleteNotificationLoading,
  clearError,
} from '../store/slices/notificationsSlice';
import { useExportModal } from "../hooks/useExportModal";

// Components
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Table from "../components/ui/Table";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import ExportModal from '../components/ui/ExportModal';
import FilterSection from "../components/ui/FilterSection";
import CheckPermission from "../components/ui/CkeckPermission";
import DeleteConfirmationModal from "../components/ui/DeleteConfirmationModal";
import { TARGET_AUDIENCES, PRIORITY_LEVELS, STATUS_OPTIONS, FORMATDATE, numericInputProps } from "../utils/constants";

import {
  BellIcon, PlusIcon, EyeIcon, UserGroupIcon,
  SpeakerWaveIcon, EnvelopeIcon, XMarkIcon, ArrowDownTrayIcon, CalendarIcon,
} from "@heroicons/react/24/outline";

const NOTIFICATION_TYPES = [
  { value: "announcement", label: "Announcement", icon: SpeakerWaveIcon },
  { value: "deal_update", label: "Deal Update", icon: BellIcon },
  { value: "payment_received", label: "Payment Received", icon: EnvelopeIcon },
  { value: "system_maintenance", label: "System Maintenance", icon: BellIcon },
  { value: "policy_update", label: "Policy Update", icon: BellIcon },
];

// Local UI helpers matching visits page styling
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
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

export default function NotificationsWithPermissions() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { isAgent, isManager, isAdmin } = useRoleFlags();

  // --- Redux selectors ---
  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const pagination = useSelector(selectNotificationsPagination);
  const stats = useSelector(selectNotificationsStats);
  const createLoading = useSelector(selectCreateNotificationLoading);
  const deleteLoading = useSelector(selectDeleteNotificationLoading);

  // --- Local UI state ---
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filters, setFilters] = useState({ search: "", type: "", priority: "", status: "", startDate: "", endDate: "" });
  const [exportFilters, setExportFilters] = useState({ search: "", type: "", priority: "", status: "", startDate: "", endDate: "" });
  const [success, setSuccess] = useState("");
  // Add validation error state
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    priority: "medium",
    targetAudience: "all",
    specificUsers: "",
    sendEmail: false,
    scheduledAt: "",
    expiresAt: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const canCreateNotifications = isAdmin || isManager;

  // react-hook-form: align validation UX with visits page
  const {
    register,
    setValue,
    reset: resetRHF,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: form.title,
      message: form.message,
      type: form.type,
      priority: form.priority,
      targetAudience: form.targetAudience,
      scheduledAt: form.scheduledAt,
      expiresAt: form.expiresAt,
    }
  });

  const {
    showExportModal,
    setShowExportModal,
    exportFormat,
    setExportFormat,
    exportLoading,
    handleExport,
    exportError,
  } = useExportModal({
    endpoint: "/api/notifications/export",
    getParams: () => Object.fromEntries(Object.entries(exportFilters).filter(([_, v]) => v !== "" && v !== undefined)),
    filenamePrefix: "notifications_export",
  });

  // --- Data fetching ---
  useEffect(() => {
    dispatch(fetchNotifications({ page: pagination.currentPage, perPage: pagination.perPage, filters }));
    dispatch(fetchNotificationStats());
  }, [dispatch, filters, pagination.currentPage, pagination.perPage]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await axiosInstance.get('/api/users');
      const data = res.data;
      setUsers(
        data.users?.map((user) => ({
          value: user.id,
          label: `${user.name} (${user.email}) - ${Array.isArray(user.roles) ? user.roles.join(", ") : user.roles || "No Role"}`,
          user_code: user.user_code,
          name: user.name,
          email: user.email,
          roles: user.roles,
        })) || []
      );
    } catch (err){
      console.error("FETCH ERROR",err)
    } finally {
      setLoadingUsers(false);
    }
  }, [setLoadingUsers, setUsers]);

  useEffect(() => {
    if (form.targetAudience === "specific" && users.length === 0) {
      fetchUsers();
    }
  }, [form.targetAudience, users.length, fetchUsers]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Keep RHF in sync for validated fields
    if (name === 'title' || name === 'message') {
      setValue(name, type === "checkbox" ? checked : value, { shouldValidate: true });
    }
  }, []);

  const handleUserSelect = useCallback((userId) => {
    if (!userId) return;
    const user = users.find((u) => u.value.toString() === userId.toString());
    if (user && !selectedUsers.find((u) => u.value.toString() === userId.toString())) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setForm((prev) => ({ ...prev, specificUsers: newSelectedUsers.map((u) => u.user_code).join(", ") }));
    }
  }, [users, selectedUsers]);

  const removeSelectedUser = useCallback((userId) => {
    const newSelectedUsers = selectedUsers.filter((u) => u.value !== userId);
    setSelectedUsers(newSelectedUsers);
    setForm((prev) => ({ ...prev, specificUsers: newSelectedUsers.map((u) => u.user_code).join(", ") }));
  }, [selectedUsers]);

  const handleFilterChange = useCallback((arg1, arg2) => {
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
    if (["type", "priority", "status", "startDate", "endDate"].includes(name) && value === "all") value = '';
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];
    if (!form.title.trim()) errors.push("Title is required");
    if (!form.message.trim()) errors.push("Message is required");
    if (form.targetAudience === "specific" && !form.specificUsers.trim()) errors.push("Specific users are required when targeting specific users");
    return errors;
  }, [form]);

  const handleCreateNotification = useCallback(async (e) => {
    e.preventDefault();
    // RHF validation for required fields (matches visits UX)
    const isValid = await trigger(['title', 'message']);
    if (!isValid) return;
    dispatch(clearError());
    setSuccess("");
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setValidationError(validationErrors.join(', '));
      dispatch(clearError());
      setSuccess("");
      return;
    }
    setValidationError("");
    try {
      await dispatch(createNotification(form)).unwrap();
      setSuccess("Notification created and sent successfully");
      setShowCreateModal(false);
      resetForm();
      dispatch(fetchNotifications({ page: pagination.currentPage, perPage: pagination.perPage, filters }));
      dispatch(fetchNotificationStats());
    } catch (err) {
      toast.error(err?.error || err?.message || err || "Failed to create notification");
    }
  }, [dispatch, form, filters, pagination, validateForm]);

  // keep RHF state synced when opening create modal
  useEffect(() => {
    if (showCreateModal) {
      resetRHF({
        title: form.title || "",
        message: form.message || "",
        type: form.type,
        priority: form.priority,
        targetAudience: form.targetAudience,
        scheduledAt: form.scheduledAt,
        expiresAt: form.expiresAt,
      });
    }
  }, [showCreateModal]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    setDeleteTarget(notifications.filter(n => selectedIds.includes(n.id)));
    setShowDeleteModal(true);
  }, [selectedIds, notifications]);

  const confirmDelete = useCallback(async () => {
    try {
      if (Array.isArray(deleteTarget)) {
        await dispatch(bulkDeleteNotifications(deleteTarget.map(n => n.id))).unwrap();
        setSuccess("Selected notifications deleted");
        setSelectedIds([]);
      } else if (deleteTarget && deleteTarget.id) {
        await dispatch(deleteNotification(deleteTarget.id)).unwrap();
        setSuccess("Notification deleted successfully");
      }
      dispatch(fetchNotifications({ page: pagination.currentPage, perPage: pagination.perPage, filters }));
      dispatch(fetchNotificationStats());
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.error || err?.message || err || "Failed to delete notification");
    }
  }, [deleteTarget, dispatch, filters, pagination]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      dispatch(fetchNotifications({ page: pagination.currentPage, perPage: pagination.perPage, filters }));
      dispatch(fetchNotificationStats());
    } catch (err) {
      toast.error(err?.error || err?.message || err || "Failed to mark notification as read");
    }
  }, [dispatch, filters, pagination]);

  const resetForm = useCallback(() => {
    setForm({
      title: "",
      message: "",
      type: "announcement",
      priority: "medium",
      targetAudience: "all",
      specificUsers: "",
      sendEmail: false,
      scheduledAt: "",
      expiresAt: "",
    });
    setSelectedNotification(null);
    setSelectedUsers([]);
  }, []);

  const openViewModal = useCallback((notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
    if (!notification.is_read && isAgent) markAsRead(notification.id);
  }, [isAgent, markAsRead]);

  const handleSelectAll = useCallback((checked) => {
    setSelectedIds(checked ? notifications.map((n) => n.id) : []);
  }, [notifications]);

  const handleSelectOne = useCallback((id, checked) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((i) => i !== id));
  }, []);

  const handleBulkMarkAsRead = useCallback(async () => {
    if (selectedIds.length === 0) return;
    try {
      await dispatch(bulkMarkNotificationsAsRead(selectedIds)).unwrap();
      setSuccess("Selected notifications marked as read");
      setSelectedIds([]);
      dispatch(fetchNotifications({ page: pagination.currentPage, perPage: pagination.perPage, filters }));
      dispatch(fetchNotificationStats());
    } catch (err) {
      toast.error(err?.error || err?.message || err || "Failed to mark notifications as read");
    }
  }, [dispatch, selectedIds, filters, pagination]);

  const handleOpenExportModal = () => {
    setExportFilters(filters);
    setShowExportModal(true);
  };

  // --- Derived data ---
  const filterOptions = useMemo(() => [
    { key: "type", label: "Type", options: NOTIFICATION_TYPES, loading: false },
    { key: "priority", label: "Priority", options: PRIORITY_LEVELS, loading: false },
    { key: "status", label: "Status", options: STATUS_OPTIONS, loading: false },
    { key: "startDate", label: "Start Date", options: [], loading: false, type: "date" },
    { key: "endDate", label: "End Date", options: [], loading: false, type: "date" },
  ], []);

  // Handler for export filter changes
  const handleExportFilterChange = (key, value) => {
    setExportFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  const tableColumns = useMemo(() => [
    {
      key: "select",
      label: "",
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={e => handleSelectOne(row.id, e.target.checked)}
          onClick={e => e.stopPropagation()}
          className="mt-1 mr-2"
        />
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (value) => {
        const typeConfig = NOTIFICATION_TYPES.find((t) => t.value === value);
        const Icon = typeConfig?.icon || BellIcon;
        return <Icon className="h-5 w-5" />;
      },
    },
    {
      key: "title",
      label: "Title",
      render: (value, row) => (
        <span className={`font-medium ${!row.is_read && isAgent ? "font-bold" : ""}`}>{value}</span>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (value) => {
        const priorityConfig = PRIORITY_LEVELS.find((p) => p.value === value);
        return (
          <Badge variant={priorityConfig?.variant} size="xxs">
            {priorityConfig?.label || value}
          </Badge>
        );
      },
    },
    { key: "created_by_name", label: "From" },
    { key: "target_audience", label: "To" },
    {
      key: "created_at",
      label: "Created At",
      render: (value) => FORMATDATE(value, 3),
    },
    {
      key: "expires_at",
      label: "Expires At",
      render: (value) => value ? FORMATDATE(value, 3) : "-",
    },
    {
      key: "is_read",
      label: "Status",
      render: (value) => value ? (
        <Badge variant="success" size="xxs">Read</Badge>
      ) : (
        <Badge variant="primary" size="xxs">Unread</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Button
            size="square"
            variant="outline"
            onClick={e => {
              e.stopPropagation();
              openViewModal(row);
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [selectedIds, isAgent, handleSelectOne, openViewModal]);

  // --- Pagination handler ---
  const handlePageChange = useCallback((page) => {
    dispatch(fetchNotifications({ page, perPage: pagination.perPage, filters }));
  }, [dispatch, pagination.perPage, filters]);

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                {isAgent ? "View your notifications and updates" : "Manage and send notifications to your team"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={ArrowDownTrayIcon} onClick={handleOpenExportModal}>
                Export
              </Button>
              {canCreateNotifications && (
                <CheckPermission permission="notification-create">
                  <Button variant="primary" size="sm" iconSize="h-5 w-5 sm:h-6 sm:w-6" icon={PlusIcon} onClick={() => setShowCreateModal(true)}>
                    Add Notification
                  </Button>
                </CheckPermission>
              )}
            </div>
          </div>

          {/* Three-Box Layout */}
           <CheckPermission permission="notification-stats">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Box 1: Total Notifications */}
               <div className="lg:col-span-1">
                 <Card>
                   <div className="flex items-center">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                       <BellIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                     </div>
                     <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                       <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{stats.totalNotifications}</p>
                     </div>
                   </div>
                 </Card>
               </div>

               {/* Box 2: Sent Today */}
               <div className="lg:col-span-1">
                 <Card>
                   <div className="flex items-center">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                       <SpeakerWaveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                     </div>
                     <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-600">Sent Today</p>
                       <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{stats.sentToday}</p>
                     </div>
                   </div>
                 </Card>
               </div>

               {/* Box 3: Active */}
               <div className="lg:col-span-1">
                 <Card>
                   <div className="flex items-center">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                       <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                     </div>
                     <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                       <p className="text-sm font-medium text-gray-600">Active</p>
                       <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{stats.activeNotifications}</p>
                     </div>
                   </div>
                 </Card>
               </div>
             </div>
           </CheckPermission>

          {/* Filter Section */}
          <FilterSection
            searchPlaceholder="Search notifications..."
            searchValue={filters.search}
            onSearchChange={e => handleFilterChange({ name: 'search', value: e })}
            resultsCount={notifications.length}
            totalCount={pagination.total}
            compact={true}
            showActiveFilters={false}
            showSearch={true}
            columns={[]}
            visibleColumns={[]}
            onColumnVisibilityChange={() => { }}
            showColumnControls={false}
            filters={filterOptions}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={() => setFilters({ search: "", type: "", priority: "", status: "", startDate: "", endDate: "" })}
          />

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}
          {exportError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-700">{exportError}</div>
            </div>
          )}

          {/* Notifications List */}
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {isAgent ? "Your Notifications" : "Notification History"}
              </h3>
              <div className="text-sm text-gray-500">
                Showing {notifications.length > 0 ? ((pagination.currentPage - 1) * pagination.perPage + 1) : 0}
                {notifications.length > 0 ? ` to ${(pagination.currentPage - 1) * pagination.perPage + notifications.length}` : ''}
                of {pagination.total} notifications
              </div>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2 mb-4">
                <Button variant="secondary" onClick={handleBulkMarkAsRead} disabled={loading}>
                  Mark as Read
                </Button>
                <CheckPermission permission="notification-delete">
                  <Button variant="danger" onClick={handleBulkDelete} disabled={deleteLoading}>
                    Delete
                  </Button>
                </CheckPermission>
                <span className="text-xs text-gray-500">{selectedIds.length} selected</span>
              </div>
            )}
            <Table
              columns={tableColumns}
              data={notifications}
              loading={loading}
              emptyMessage="No notifications found"
              onRowClick={openViewModal}
              sortColumn={null}
              sortDirection={null}
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
        </div>
      </div>

      {/* Create Notification Modal */}
      <CheckPermission permission="notification-create">
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
            dispatch(clearError());
            setValidationError("");
          }}
          title=""
          size="lg"
        >
          <div className="relative">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl opacity-10"></div>
                <BellIcon className="h-8 w-8 text-primary-600 relative z-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create Notification</h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">Compose and schedule a notification for users.</p>
            </div>

            <form onSubmit={handleCreateNotification} className="space-y-6">
              {/* Show validation error above the form */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-sm text-red-700">{validationError}</div>
                </div>
              )}

              {/* Notification Details */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <BellIcon className="w-3 h-3 text-blue-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Notification Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Title" required error={errors.title?.message}>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SpeakerWaveIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="title"
                        {...register('title', { required: 'Title is required' })}
                        value={form.title}
                        onChange={handleInputChange}
                        placeholder="Enter notification title"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.title ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500' : ''}`}
                        aria-invalid={errors.title ? 'true' : 'false'}
                      />
                    </div>
                  </FormField>
                  <FormField label="Type">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BellIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {NOTIFICATION_TYPES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                  <FormField label="Priority">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BellIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="priority"
                        value={form.priority}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {PRIORITY_LEVELS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Targeting Options */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <UserGroupIcon className="w-3 h-3 text-blue-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Targeting</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Target Audience">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <select
                        name="targetAudience"
                        value={form.targetAudience}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {TARGET_AUDIENCES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </FormField>
                  {form.targetAudience === "specific" && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Specific Users <span className="text-red-500">*</span></label>
                      {loadingUsers ? (
                        <div className="flex items-center justify-center py-4 text-gray-500">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                          Loading users...
                        </div>
                      ) : (
                        <>
                          <select
                            onChange={e => handleUserSelect(e.target.value)}
                            value=""
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-3"
                          >
                            <option value="">Select a user to add...</option>
                            {users.filter((user) => !selectedUsers.find((selected) => selected.value === user.value)).map((user) => (
                              <option key={user.value} value={user.value}>{user.label}</option>
                            ))}
                          </select>
                          {selectedUsers.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700">Selected Users ({selectedUsers.length}):</div>
                              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                                {selectedUsers.map((user) => (
                                  <div key={user.value} className="flex items-center justify-between py-1 px-2 bg-white rounded border mb-1 last:mb-0">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                                      <div className="text-xs text-gray-500 truncate">{user.email} • {Array.isArray(user.roles) ? user.roles.join(", ") : user.roles || "No Role"}</div>
                                    </div>
                                    <button type="button" onClick={() => removeSelectedUser(user.value)} className="ml-2 text-red-500 hover:text-red-700 p-1" title="Remove user">
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <input type="hidden" name="specificUsers" value={form.specificUsers} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule & Expiry */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <CalendarIcon className="w-3 h-3 text-blue-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Schedule & Expiry</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Schedule For (Optional)">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        name="scheduledAt"
                        value={form.scheduledAt}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </FormField>
                  <FormField label="Expires At (Optional)">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="datetime-local"
                        name="expiresAt"
                        value={form.expiresAt}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </FormField>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                    <EnvelopeIcon className="w-3 h-3 text-blue-600" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900">Message</h4>
                </div>
                <FormField label="Message" required error={errors.message?.message}>
                  <textarea
                    name="message"
                    {...register('message', { required: 'Message is required' })}
                    value={form.message}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm resize-none ${errors.message ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500' : ''}`}
                    aria-invalid={errors.message ? 'true' : 'false'}
                    placeholder="Enter your notification message..."
                  />
                </FormField>
                <div className="mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="sendEmail"
                      checked={form.sendEmail}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Also send via email</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={createLoading} icon={PlusIcon}>
                  {createLoading ? "Sending..." : "Send Notification"}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </CheckPermission>

             {/* View Notification Modal */}
       <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title={null} size="md">
         {selectedNotification && (
           <div className="p-0 overflow-hidden max-h-[80vh] flex flex-col rounded-lg">
             {/* Header with gradient background */}
             <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-4 relative overflow-hidden flex-shrink-0 rounded-t-lg mx-4 mt-4 mb-4">
               {/* Background pattern for visual interest */}
               <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
               <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-12 translate-x-12"></div>
               <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
               
               <div className="relative flex items-start gap-3">
                 {/* Icon container */}
                 <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 flex items-center justify-center border border-white/30 flex-shrink-0">
                   {(() => {
                     const typeConfig = NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type);
                     const Icon = typeConfig?.icon || BellIcon;
                     return <Icon className="h-6 w-6 text-white" />;
                   })()}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <h2 className="text-xl font-bold text-white mb-2 leading-tight line-clamp-2">
                     {selectedNotification.title}
                   </h2>
                   <div className="flex flex-wrap gap-1.5 items-center">
                     <Badge 
                       variant="primary" 
                       size="sm"
                       className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                     >
                       {NOTIFICATION_TYPES.find(t => t.value === selectedNotification.type)?.label || selectedNotification.type}
                     </Badge>
                     <Badge 
                       variant="secondary" 
                       size="sm"
                       className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                     >
                       {PRIORITY_LEVELS.find(p => p.value === selectedNotification.priority)?.label || selectedNotification.priority}
                     </Badge>
                     <Badge 
                       variant={selectedNotification.is_read ? 'success' : 'accent'} 
                       size="sm"
                       className={selectedNotification.is_read 
                         ? "bg-green-500/20 text-green-100 border-green-400/30 backdrop-blur-sm" 
                         : "bg-accent-500/20 text-accent-100 border-accent-400/30 backdrop-blur-sm"
                       }
                     >
                       {selectedNotification.is_read ? 'Read' : 'Unread'}
                     </Badge>
                   </div>
                 </div>
               </div>
             </div>
             
             {/* Content section - scrollable */}
             <div className="px-4 pb-4 space-y-4 flex-1 overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">From</div>
                  <div className="font-semibold text-gray-900 text-sm">{selectedNotification.created_by_name}</div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Target Audience</div>
                  <div className="font-semibold text-gray-900 text-sm">{selectedNotification.target_audience}</div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created At</div>
                  <div className="font-semibold text-gray-900 text-sm">{FORMATDATE(selectedNotification.created_at, 3)}</div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Scheduled At</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {selectedNotification.scheduled_at ? FORMATDATE(selectedNotification.scheduled_at, 3) : '-'}
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Expires At</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {selectedNotification.expires_at ? FORMATDATE(selectedNotification.expires_at, 3) : '-'}
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email Sent</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    <Badge 
                      variant={selectedNotification.email_sent ? 'success' : 'secondary'} 
                      size="xs"
                    >
                      {selectedNotification.email_sent ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
                
                {selectedNotification.read_at && (
                  <div className="sm:col-span-2 bg-gray-100 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Read At</div>
                    <div className="font-semibold text-gray-900 text-sm">{FORMATDATE(selectedNotification.read_at, 3)}</div>
                  </div>
                )}
              </div>
              
              {/* Message section */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Message</div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-gray-900 whitespace-pre-line leading-relaxed text-sm min-h-[80px] max-h-[200px] overflow-y-auto">
                  {selectedNotification.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        loading={exportLoading}
        filters={exportFilters}
        onFilterChange={handleExportFilterChange}
        filterOptions={filterOptions}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        formats={[
          { value: 'csv', label: 'CSV', icon: null, description: 'Spreadsheet format' },
          { value: 'pdf', label: 'PDF', icon: null, description: 'Document format' },
        ]}
        title="Export Notifications"
        description="Choose format to export your notifications."
        confirmText="Export"
        cancelText="Cancel"
      />
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title={Array.isArray(deleteTarget) ? `Delete ${deleteTarget.length} Notifications` : "Delete Notification"}
        description={Array.isArray(deleteTarget)
          ? `Are you sure you want to delete ${deleteTarget.length} notifications? This action cannot be undone.`
          : "Are you sure you want to delete this notification? This action cannot be undone."}
        itemType="notification"
        itemData={Array.isArray(deleteTarget) ? null : deleteTarget}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
