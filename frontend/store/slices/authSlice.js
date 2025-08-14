import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

const getStoredToken = () => (typeof window !== 'undefined') ? localStorage.getItem('token') : null;

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', credentials);      
      if (response.data.status === false) {
        if (response.data.errors && Array.isArray(response.data.errors)) {
          const errorMessages = response.data.errors.map(err => err.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.message || 'Login failed');
      }
      
      let role = 'Agent'; 
      if (response.data.roles && Array.isArray(response.data.roles) && response.data.roles.length > 0) {
        role = response.data.roles[0].name;
      }
      else if (response.data.user && response.data.user.role) {
        role = response.data.user.role;
      }
      else if (response.data.role) {
        role = response.data.role;
      }
      else if (response.data.user && response.data.user.roles && Array.isArray(response.data.user.roles) && response.data.user.roles.length > 0) {
        role = response.data.user.roles[0].name;
      }
      
      const userPermissions = response.data.user?.permissions || response.data?.permissions || [];
      
      return {
        user: {
          id: response.data.user?.id,
          name: response.data.user?.name,
          email: response.data.user?.email,
          role: role,
          user_code: response.data.user?.user_code,
          avatar: response.data.user?.avatar || null,
          permissions: userPermissions,
        },
        token: response.data.token,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Login failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        throw new Error('No user ID found');
      }
      
      const response = await axiosInstance.get(`/api/users/${userId}`);      
      let role = 'Agent';
      if (response.data.roles && Array.isArray(response.data.roles) && response.data.roles.length > 0) {
        role = response.data.roles[0].name;
      }
      else if (response.data.user && response.data.user.role) {
        role = response.data.user.role;
      }
      else if (response.data.role) {
        role = response.data.role;
      }
      else if (response.data.user && response.data.user.roles && Array.isArray(response.data.user.roles) && response.data.user.roles.length > 0) {
        role = response.data.user.roles[0].name;
      }
      
      const userPermissions = response.data.permissions || [];
      
      return {
        user: {
          id: response.data.user?.id,
          name: response.data.user?.name,
          email: response.data.user?.email,
          role: role,
          user_code: response.data.user?.user_code,
          avatar: response.data.user?.avatar || null,
          permissions: userPermissions,
        },
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch user');
    }
  }
);

const initialState = {
  user: null,
  token: getStoredToken(),
  isAuthenticated: false,
  loading: !!getStoredToken(),
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user_id', user.id);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
          localStorage.setItem('user_id', action.payload.user.id);
        }
        // Ensure we have the user role properly set
        if (action.payload.user && action.payload.user.role) {
          state.user.role = action.payload.user.role;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;

      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
        }
      });
  },
});

export const { setCredentials, logout, setLoading, updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error; 