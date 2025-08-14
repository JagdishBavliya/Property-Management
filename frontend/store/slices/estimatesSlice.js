import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks
export const fetchEstimates = createAsyncThunk(
  'estimates/fetchEstimates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.perPage || 10,
        ...(params.search && { search: params.search })
      });
      const response = await axiosInstance.get(`/api/estimates?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch estimates');
    }
  }
);

export const createEstimate = createAsyncThunk(
  'estimates/createEstimate',
  async (estimateData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/estimates', estimateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create estimate');
    }
  }
);

export const updateEstimate = createAsyncThunk(
  'estimates/updateEstimate',
  async ({ id, estimateData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/estimates/${id}`, estimateData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update estimate');
    }
  }
);

export const deleteEstimate = createAsyncThunk(
  'estimates/deleteEstimate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/estimates/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete estimate');
    }
  }
);

const initialState = {
  estimates: [],
  pagination: {
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  },
  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null
};

const estimatesSlice = createSlice({
  name: 'estimates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch estimates
      .addCase(fetchEstimates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEstimates.fulfilled, (state, action) => {
        state.loading = false;
        state.estimates = action.payload.estimates || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchEstimates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.estimates = [];
      })

      // Create estimate
      .addCase(createEstimate.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createEstimate.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(createEstimate.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // Update estimate
      .addCase(updateEstimate.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateEstimate.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateEstimate.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })

      // Delete estimate
      .addCase(deleteEstimate.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteEstimate.fulfilled, (state) => {
        state.deleteLoading = false;
      })
      .addCase(deleteEstimate.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  }
});

// Selectors
export const selectEstimates = (state) => state.estimates.estimates;
export const selectEstimatesPagination = (state) => state.estimates.pagination;
export const selectEstimatesLoading = (state) => state.estimates.loading;
export const selectCreateEstimateLoading = (state) => state.estimates.createLoading;
export const selectUpdateEstimateLoading = (state) => state.estimates.updateLoading;
export const selectDeleteEstimateLoading = (state) => state.estimates.deleteLoading;
export const selectEstimatesError = (state) => state.estimates.error;

export const { clearError, setPage } = estimatesSlice.actions;
export default estimatesSlice.reducer;