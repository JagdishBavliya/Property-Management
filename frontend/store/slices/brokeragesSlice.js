import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks
export const fetchBrokerages = createAsyncThunk(
  'brokerages/fetchBrokerages',
  async ({ page = 1, perPage = 10, search = '', propertyCode = '', agentCode = '', managerCode = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
      });
      
      if (search) params.append('search', search);
      if (propertyCode && propertyCode.trim()) params.append('property_code', propertyCode);
      if (agentCode && agentCode.trim()) params.append('ag_code', agentCode);
      if (managerCode && managerCode.trim()) params.append('manager_code', managerCode);

      const response = await axiosInstance.get(`/api/brokerage?${params}`);
      
      return {
        brokerages: response.data.brokerages || [],
        pagination: {
          currentPage: response.data.pagination?.current_page || response.data.pagination?.currentPage || 1,
          perPage: response.data.pagination?.per_page || response.data.pagination?.perPage || 10,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.total_pages || response.data.pagination?.totalPages || 1,
          hasNextPage: response.data.pagination?.has_next_page || response.data.pagination?.hasNextPage || false,
          hasPrevPage: response.data.pagination?.has_prev_page || response.data.pagination?.hasPrevPage || false,
        },
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch brokerages');
    }
  }
);

export const createBrokerage = createAsyncThunk(
  'brokerages/createBrokerage',
  async (brokerageData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/brokerage/create', brokerageData);
      
      if (response.data.status === false) {
        if (response.data.errors) {
          const errorMessages = response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.msg || 'Failed to create brokerage');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.data?.status === false) {
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(error.response.data.msg || 'Failed to create brokerage');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create brokerage');
    }
  }
);

export const updateBrokerage = createAsyncThunk(
  'brokerages/updateBrokerage',
  async ({ id, brokerageData }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/brokerage/edit/${id}`, brokerageData);
      
      if (response.data.status === false) {
        if (response.data.errors) {
          const errorMessages = response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(response.data.msg || 'Failed to update brokerage');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.data?.status === false) {
        if (error.response.data.errors) {
          const errorMessages = error.response.data.errors.map(error => error.msg).join(', ');
          return rejectWithValue(errorMessages);
        }
        return rejectWithValue(error.response.data.msg || 'Failed to update brokerage');
      }
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update brokerage');
    }
  }
);

export const deleteBrokerage = createAsyncThunk(
  'brokerages/deleteBrokerage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/brokerage/delete/${id}`);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete brokerage');
    }
  }
);

export const fetchBrokerageById = createAsyncThunk(
  'brokerages/fetchBrokerageById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/brokerage/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch brokerage details');
    }
  }
);

// export const exportBrokerages = createAsyncThunk(
//   'brokerages/exportBrokerages',
//   async ({ format = 'csv', filters = {} }, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams({ format });
//       Object.entries(filters).forEach(([key, value]) => {
//         if (value) params.append(key, value);
//       });

//       const response = await axiosInstance.get(`/api/brokerages/export?${params}`, {
//         responseType: 'blob',
//       });
      
//       // Create download link
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `brokerages.${format}`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       return { success: true };
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || error.message || 'Failed to export brokerages');
//     }
//   }
// );

const initialState = {
  brokerages: [],
  currentBrokerage: null,
  pagination: {
    currentPage: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  brokerageLoading: false,
  brokerageError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  // exportLoading: false,
};

const brokeragesSlice = createSlice({
  name: 'brokerages',
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
    clearBrokerageError: (state) => {
      state.brokerageError = null;
    },
    clearCurrentBrokerage: (state) => {
      state.currentBrokerage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Brokerages
      .addCase(fetchBrokerages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrokerages.fulfilled, (state, action) => {
        state.loading = false;
        state.brokerages = action.payload.brokerages;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchBrokerages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Brokerage by ID
      .addCase(fetchBrokerageById.pending, (state) => {
        state.brokerageLoading = true;
        state.brokerageError = null;
      })
      .addCase(fetchBrokerageById.fulfilled, (state, action) => {
        state.brokerageLoading = false;
        state.currentBrokerage = action.payload.data || null;
        state.brokerageError = null;
      })
      .addCase(fetchBrokerageById.rejected, (state, action) => {
        state.brokerageLoading = false;
        state.brokerageError = action.payload;
      })
      // Create Brokerage
      .addCase(createBrokerage.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createBrokerage.fulfilled, (state, action) => {
        state.createLoading = false;
        if (action.payload.data) {
          state.brokerages.unshift(action.payload.data);
          state.pagination.total += 1;
        }
        state.createError = null;
      })
      .addCase(createBrokerage.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      // Update Brokerage
      .addCase(updateBrokerage.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateBrokerage.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Don't update array directly, let the component refresh the list
        state.updateError = null;
      })
      .addCase(updateBrokerage.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Delete Brokerage
      .addCase(deleteBrokerage.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteBrokerage.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.brokerages = state.brokerages.filter(brokerage => brokerage.id !== action.payload.id);
        state.pagination.total -= 1;
        state.deleteError = null;
      })
      .addCase(deleteBrokerage.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Export Brokerages
      // .addCase(exportBrokerages.pending, (state) => {
      //   state.exportLoading = true;
      // })
      // .addCase(exportBrokerages.fulfilled, (state) => {
      //   state.exportLoading = false;
      // })
      // .addCase(exportBrokerages.rejected, (state) => {
      //   state.exportLoading = false;
      // });
  },
});

export const { 
  clearError, 
  clearCreateError, 
  clearUpdateError, 
  clearDeleteError,
  clearBrokerageError,
  clearCurrentBrokerage
} = brokeragesSlice.actions;

export default brokeragesSlice.reducer;

// Selectors
export const selectBrokerages = (state) => state.brokerages.brokerages;
export const selectBrokeragesPagination = (state) => state.brokerages.pagination;
export const selectBrokeragesLoading = (state) => state.brokerages.loading;
export const selectBrokeragesError = (state) => state.brokerages.error;
export const selectCurrentBrokerage = (state) => state.brokerages.currentBrokerage;
export const selectBrokerageLoading = (state) => state.brokerages.brokerageLoading;
export const selectBrokerageError = (state) => state.brokerages.brokerageError;
export const selectCreateBrokerageLoading = (state) => state.brokerages.createLoading;
export const selectUpdateBrokerageLoading = (state) => state.brokerages.updateLoading;
export const selectDeleteBrokerageLoading = (state) => state.brokerages.deleteLoading;
// export const selectExportBrokerageLoading = (state) => state.brokerages.exportLoading;
export const selectCreateBrokerageError = (state) => state.brokerages.createError;
export const selectUpdateBrokerageError = (state) => state.brokerages.updateError;
export const selectDeleteBrokerageError = (state) => state.brokerages.deleteError; 