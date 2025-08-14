import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1, perPage = 10, search = '', role = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      // Only add pagination parameters if they are provided
      if (page !== undefined) params.append('page', page.toString());
      if (perPage !== undefined) params.append('per_page', perPage.toString());
      
      if (search) params.append('search', search);
      if (role) params.append('role', role);

      const response = await axiosInstance.get(`/api/users/all?${params}`);
      
      return {
        users: response.data.users || [],
        pagination: response.data.pagination ? {
          currentPage: response.data.pagination.current_page || response.data.pagination.currentPage || 1,
          perPage: response.data.pagination.per_page || response.data.pagination.perPage || 10,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.total_pages || response.data.pagination.totalPages || 1,
          hasNextPage: response.data.pagination.has_next_page || response.data.pagination.hasNextPage || false,
          hasPrevPage: response.data.pagination.has_prev_page || response.data.pagination.hasPrevPage || false,
        } : null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch users');
    }
  }
);

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAllUsers',
  async ({ search = '', role = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (search) params.append('search', search);
      if (role) params.append('role', role);

      const response = await axiosInstance.get(`/api/users/all?${params}`);
      
      return {
        users: response.data.users || [],
        pagination: null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch all users');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/users/create', userData);
      if (response.data.status === false) {
        if (response.data.errors) {
          const errorMessages = response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.msg || 'Failed to create user');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.data?.status === false) {
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(error.response.data.msg || 'Failed to create user');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/users/update/${id}`, userData);
      
      if (response.data.status === false) {
        if (response.data.errors) {
          const errorMessages = response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.msg || 'Failed to update user');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.data?.status === false) {
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(error.response.data.msg || 'Failed to update user');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/users/delete/${id}`);
      
      if (response.data.status === false) {
        if (response.data.errors) {
          const errorMessages = response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.msg || 'Failed to delete user');
      }
      
      return { id, data: response.data };
    } catch (error) {
      if (error.response?.data?.status === false) {
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(error.response.data.msg || 'Failed to delete user');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete user');
    }
  }
);

// Delete agent and all related data by agent_code
export const deleteAgentByAgentCode = createAsyncThunk(
  'users/deleteAgentByAgentCode',
  async (agent_code, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/users/delete-agent/${agent_code}`);
      if (response.data.status === false) {
        return rejectWithValue(response.data.msg || 'Failed to delete agent');
      }
      return { agent_code, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to delete agent');
    }
  }
);

// Delete manager and all related data by manager_code
export const deleteManagerByManagerCode = createAsyncThunk(
  'users/deleteManagerByManagerCode',
  async (manager_code, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/users/delete-manager/${manager_code}`);
      if (response.data.status === false) {
        return rejectWithValue(response.data.msg || 'Failed to delete manager');
      }
      return { manager_code, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to delete manager');
    }
  }
);

// Get all admins (dropdown)
export const fetchAllAdmins = createAsyncThunk(
  'users/fetchAllAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/users/admins-dropdown');
      return response.data.admins || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to fetch admins');
    }
  }
);

// Get all managers (dropdown)
export const fetchAllManagers = createAsyncThunk(
  'users/fetchAllManagers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/users/all-managers');
      return response.data.managers || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to fetch managers');
    }
  }
);

// Get managers for current user (paginated, with search)
export const fetchManagersForCurrentUser = createAsyncThunk(
  'users/fetchManagersForCurrentUser',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search) params.append('search', search);
      const response = await axiosInstance.get(`/api/users/managers-for-current-user?${params}`);
      const backend = response.data;
      const pag = backend.pagination || {};
      const pagination = {
        current_page: pag.currentPage,
        per_page: pag.perPage,
        total: pag.total,
        total_pages: pag.totalPages,
        has_next_page: pag.hasNextPage,
        has_prev_page: pag.hasPrevPage
      };
      return {
        managers: backend.managers,
        pagination
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to fetch managers for current user');
    }
  }
);

// Get agents for current user (paginated, with search)
export const fetchAgentsForCurrentUser = createAsyncThunk(
  'users/fetchAgentsForCurrentUser',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search) params.append('search', search);
      const response = await axiosInstance.get(`/api/users/agents-for-current-user?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to fetch agents for current user');
    }
  }
);

const initialState = {
  users: [],
  pagination: null,
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCreateError: (state) => {
      state.createError = null;
    },
    clearUpdateError: (state) => {
      state.updateError = null;
    },
    clearDeleteError: (state) => {
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Managers For Current User
      .addCase(fetchManagersForCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagersForCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.managers || [];
        state.pagination = action.payload.pagination || null;
        state.error = null;
      })
      .addCase(fetchManagersForCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create User
      .addCase(createUser.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.createLoading = false;
        // Add the new user to the list
        state.users.unshift(action.payload);
        // Update pagination total if pagination exists
        if (state.pagination) {
          state.pagination.total += 1;
        }
        state.createError = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Update the user in the list
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload };
        }
        state.updateError = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove the user from the list
        state.users = state.users.filter(user => user.id !== action.payload.id);
        // Update pagination total if pagination exists
        if (state.pagination) {
          state.pagination.total -= 1;
        }
        state.deleteError = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Delete Agent By Agent Code
      .addCase(deleteAgentByAgentCode.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteAgentByAgentCode.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove the agent from the list by agent_code
        state.users = state.users.filter(user => user.user_code !== action.payload.agent_code);
        if (state.pagination) {
          state.pagination.total -= 1;
        }
        state.deleteError = null;
      })
      .addCase(deleteAgentByAgentCode.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Delete Manager By Manager Code
      .addCase(deleteManagerByManagerCode.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteManagerByManagerCode.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // Remove the manager from the list by manager_code
        state.users = state.users.filter(user => user.manager_code !== action.payload.manager_code);
        if (state.pagination) {
          state.pagination.total -= 1;
        }
        state.deleteError = null;
      })
      .addCase(deleteManagerByManagerCode.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Fetch Agents For Current User
      .addCase(fetchAgentsForCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentsForCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.agents || [];
        // Map backend camelCase pagination keys to frontend snake_case
        const pag = action.payload.pagination || {};
        state.pagination = {
          current_page: pag.currentPage,
          per_page: pag.perPage,
          total: pag.total,
          total_pages: pag.totalPages,
          has_next_page: pag.hasNextPage,
          has_prev_page: pag.hasPrevPage
        };
        state.error = null;
      })
      .addCase(fetchAgentsForCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCreateError, clearUpdateError, clearDeleteError } = usersSlice.actions;

export default usersSlice.reducer;

// Selectors
export const selectUsers = (state) => state.users.users;
export const selectUsersPagination = (state) => state.users.pagination;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;
export const selectCreateUserLoading = (state) => state.users.createLoading;
export const selectUpdateUserLoading = (state) => state.users.updateLoading;
export const selectDeleteUserLoading = (state) => state.users.deleteLoading;
export const selectCreateUserError = (state) => state.users.createError;
export const selectUpdateUserError = (state) => state.users.updateError;
export const selectDeleteUserError = (state) => state.users.deleteError;
