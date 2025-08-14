import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch dashboard data');
    }
  }
);

const initialState = {
  dashboardStats: {
    totalProperties: 0,
    activeAgents: 0,
    totalBrokerages: 0,
    propertiesThisMonth: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    recentActivity: [],
    topBrokerages: [],
    systemHealth: {
      apiStatus: 'Operational',
      uptime: '99.98%',
      dbConnection: 'Healthy',
      lastBackup: '3 hours ago'
    }
  },
  propertyStats: {
    total: 0,
    thisMonth: 0,
    change: 0,
    changeType: 'increase'
  },
  agentStats: {
    total: 0,
    active: 0,
    change: 0,
    changeType: 'increase'
  },
  brokerageStats: {
    total: 0,
    change: 0,
    changeType: 'increase'
  },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
        state.propertyStats = action.payload.propertyStats;
        state.agentStats = action.payload.agentStats;
        state.brokerageStats = action.payload.brokerageStats;
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectDashboardStats = (state) => state.dashboard.dashboardStats;
export const selectPropertyStats = (state) => state.dashboard.propertyStats;
export const selectAgentStats = (state) => state.dashboard.agentStats;
export const selectBrokerageStats = (state) => state.dashboard.brokerageStats;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 