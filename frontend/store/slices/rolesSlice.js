import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks
export const fetchRoles = createAsyncThunk(
  'roles/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/settings/roles');
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch roles');
    }
  }
);

export const fetchPermissions = createAsyncThunk(
  'roles/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/settings/permissions');
      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch permissions');
    }
  }
);

export const fetchRolePermissions = createAsyncThunk(
  'roles/fetchRolePermissions',
  async (roleId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/settings/role/${roleId}/permission`);
      const permissions = response.data.data || [];
      
      // Transform to array of IDs - handle both object and ID formats
      const permissionIds = permissions.map(permission => {
        if (typeof permission === 'object' && permission.id) {
          return permission.id;
        }
        return permission; // If it's already an ID
      });
      
      return { roleId, permissions: permissionIds };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch role permissions');
    }
  }
);

export const updateRolePermissions = createAsyncThunk(
  'roles/updateRolePermissions',
  async ({ roleId, permissions }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/settings/roles/${roleId}/permissions`, {
        permissions: permissions
      });

      // Defensive: ensure array
      const responsePermissions = Array.isArray(response.data.data) ? response.data.data : [];
      const permissionIds = responsePermissions.map(permission => {
        if (typeof permission === 'object' && permission.id) {
          return permission.id;
        }
        return permission;
      });

      return { roleId, permissions: permissionIds };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update role permissions');
    }
  }
);

const initialState = {
  roles: [],
  permissions: [],
  rolePermissions: {},
  loading: false,
  permissionsLoading: false,
  rolePermissionsLoading: false,
  updatePermissionsLoading: false,
  error: null,
  permissionsError: null,
  rolePermissionsError: null,
  updatePermissionsError: null,
};

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPermissionsError: (state) => {
      state.permissionsError = null;
    },
    clearRolePermissionsError: (state) => {
      state.rolePermissionsError = null;
    },
    clearUpdatePermissionsError: (state) => {
      state.updatePermissionsError = null;
    },
    updateLocalRolePermissions: (state, action) => {
      const { roleId, permissions } = action.payload;
      // Ensure permissions is always an array
      state.rolePermissions[roleId] = Array.isArray(permissions) ? permissions : [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Roles
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Permissions
      .addCase(fetchPermissions.pending, (state) => {
        state.permissionsLoading = true;
        state.permissionsError = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.permissionsLoading = false;
        state.permissions = action.payload;
        state.permissionsError = null;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.permissionsLoading = false;
        state.permissionsError = action.payload;
      })
      // Fetch Role Permissions
      .addCase(fetchRolePermissions.pending, (state) => {
        state.rolePermissionsLoading = true;
        state.rolePermissionsError = null;
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.rolePermissionsLoading = false;
        // Ensure we store an array of IDs
        state.rolePermissions[action.payload.roleId] = Array.isArray(action.payload.permissions) 
          ? action.payload.permissions 
          : [];
        state.rolePermissionsError = null;
      })
      .addCase(fetchRolePermissions.rejected, (state, action) => {
        state.rolePermissionsLoading = false;
        state.rolePermissionsError = action.payload;
      })
      // Update Role Permissions
      .addCase(updateRolePermissions.pending, (state) => {
        state.updatePermissionsLoading = true;
        state.updatePermissionsError = null;
      })
      .addCase(updateRolePermissions.fulfilled, (state, action) => {
        state.updatePermissionsLoading = false;
        if (action.payload.permissions && Array.isArray(action.payload.permissions) && action.payload.permissions.length > 0) {
          state.rolePermissions[action.payload.roleId] = action.payload.permissions;
        }
        state.updatePermissionsError = null;
      })
      .addCase(updateRolePermissions.rejected, (state, action) => {
        state.updatePermissionsLoading = false;
        state.updatePermissionsError = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearPermissionsError, 
  clearRolePermissionsError, 
  clearUpdatePermissionsError,
  updateLocalRolePermissions
} = rolesSlice.actions;

export default rolesSlice.reducer;

// Selectors
export const selectRoles = (state) => state.roles.roles;
export const selectPermissions = (state) => state.roles.permissions;
export const selectRolePermissions = (state) => state.roles.rolePermissions;
export const selectRolesLoading = (state) => state.roles.loading;
export const selectPermissionsLoading = (state) => state.roles.permissionsLoading;
export const selectRolePermissionsLoading = (state) => state.roles.rolePermissionsLoading;
export const selectUpdatePermissionsLoading = (state) => state.roles.updatePermissionsLoading;
export const selectRolesError = (state) => state.roles.error;
export const selectPermissionsError = (state) => state.roles.permissionsError;
export const selectRolePermissionsError = (state) => state.roles.rolePermissionsError;
export const selectUpdatePermissionsError = (state) => state.roles.updatePermissionsError; 