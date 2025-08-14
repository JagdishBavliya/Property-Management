                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 10, filters = {} } = params || {};
      const query = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      });                                                                                                                                                                                                                           
      const res = await axiosInstance.get(`/api/notifications?${query}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch notifications');
    }
  }
);  
                                                                                            
export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchNotificationStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/api/notifications/stats');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch stats');
    }
  }
);

export const createNotification = createAsyncThunk(
  'notifications/createNotification',
  async (form, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/api/notifications', form);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create notification');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/notifications/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete notification');
    }
  }
);

export const bulkDeleteNotifications = createAsyncThunk(
  'notifications/bulkDeleteNotifications',
  async (ids, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/api/notifications/bulk-delete', { ids });
      return ids;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markNotificationAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to mark as read');
    }
  }
);

export const bulkMarkNotificationsAsRead = createAsyncThunk(
  'notifications/bulkMarkNotificationsAsRead',
  async (ids, { rejectWithValue }) => {
    try {
      await axiosInstance.post('/api/notifications/bulk-read', { ids });
      return ids;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to mark notifications as read');
    }
  }
);

// Initial State
const initialState = {
  notifications: [],
  loading: false,
  error: null,
  success: null,
  pagination: {
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  stats: {
    totalNotifications: 0,
    unreadCount: 0,
    sentToday: 0,
    activeNotifications: 0,
  },
  createLoading: false,
  createError: null,
  deleteLoading: false,
  deleteError: null,
  markReadLoading: false,
  markReadError: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
      state.createError = null;
      state.deleteError = null;
      state.markReadError = null;
    },
    clearSuccess(state) {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        if (action.payload.pagination) {
          state.pagination = {
            currentPage: action.payload.pagination.page || 1,
            perPage: action.payload.pagination.limit || 10,
            total: action.payload.pagination.total || 0,
            totalPages: action.payload.pagination.pages || 0,
            hasNextPage: (action.payload.pagination.page || 1) < (action.payload.pagination.pages || 0),
            hasPrevPage: (action.payload.pagination.page || 1) > 1,
          };
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.notifications = [];
      })
      // Fetch stats
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.stats = action.payload || initialState.stats;
      })
      // Create notification
      .addCase(createNotification.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createNotification.fulfilled, (state) => {
        state.createLoading = false;
        state.success = 'Notification created successfully';
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
        state.success = 'Notification deleted successfully';
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Bulk delete
      .addCase(bulkDeleteNotifications.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(bulkDeleteNotifications.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.notifications = state.notifications.filter(n => !action.payload.includes(n.id));
        state.success = 'Selected notifications deleted';
      })
      .addCase(bulkDeleteNotifications.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Mark as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markReadLoading = true;
        state.markReadError = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markReadLoading = false;
        state.notifications = state.notifications.map(n => n.id === action.payload ? { ...n, is_read: true } : n);
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markReadLoading = false;
        state.markReadError = action.payload;
      })
      // Bulk mark as read
      .addCase(bulkMarkNotificationsAsRead.pending, (state) => {
        state.markReadLoading = true;
        state.markReadError = null;
      })
      .addCase(bulkMarkNotificationsAsRead.fulfilled, (state, action) => {
        state.markReadLoading = false;
        state.notifications = state.notifications.map(n => action.payload.includes(n.id) ? { ...n, is_read: true } : n);
      })
      .addCase(bulkMarkNotificationsAsRead.rejected, (state, action) => {
        state.markReadLoading = false;
        state.markReadError = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectNotificationsPagination = (state) => state.notifications.pagination;
export const selectNotificationsStats = (state) => state.notifications.stats;
export const selectCreateNotificationLoading = (state) => state.notifications.createLoading;
export const selectCreateNotificationError = (state) => state.notifications.createError;
export const selectDeleteNotificationLoading = (state) => state.notifications.deleteLoading;
export const selectDeleteNotificationError = (state) => state.notifications.deleteError;
export const selectMarkReadNotificationLoading = (state) => state.notifications.markReadLoading;
export const selectMarkReadNotificationError = (state) => state.notifications.markReadError;

export default notificationsSlice.reducer; 