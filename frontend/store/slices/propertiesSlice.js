import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, perPage = 9, search = '', type = '', city = '', ag_code = '', property_code = '' } = params;
      const queryParams = new URLSearchParams();
      
      // Only add pagination parameters if they are provided
      if (page !== undefined) queryParams.append('page', page.toString());
      if (perPage !== undefined) queryParams.append('limit', perPage.toString());
      
      if (search) queryParams.append('search', search);
      if (type && type !== 'all') queryParams.append('p_type', type);
      if (city) queryParams.append('city', city);
      if (ag_code && ag_code.trim()) queryParams.append('ag_code', ag_code);
      if (property_code && property_code.trim()) queryParams.append('property_code', property_code);
      
      const response = await axiosInstance.get(`/api/property?${queryParams.toString()}`);
      
      return {
        properties: response.data.properties || [],
        pagination: response.data.pagination ? {
          currentPage: response.data.pagination.current_page || response.data.pagination.currentPage || 1,
          perPage: response.data.pagination.per_page || response.data.pagination.perPage || 9,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.total_pages || response.data.pagination.totalPages || 1,
          hasNextPage: response.data.pagination.has_next_page || response.data.pagination.hasNextPage || false,
          hasPrevPage: response.data.pagination.has_prev_page || response.data.pagination.hasPrevPage || false,
        } : null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch properties');
    }
  }
);

export const fetchAllProperties = createAsyncThunk(
  'properties/fetchAllProperties',
  async ({ search = '', type = '', city = '', ag_code = '', property_code = '' } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (search) queryParams.append('search', search);
      if (type && type !== 'all') queryParams.append('p_type', type);
      if (city) queryParams.append('city', city);
      if (ag_code && ag_code.trim()) queryParams.append('ag_code', ag_code);
      if (property_code && property_code.trim()) queryParams.append('property_code', property_code);

      const response = await axiosInstance.get(`/api/property?${queryParams.toString()}`);
      
      return {
        properties: response.data.properties || [],
        pagination: null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch all properties');
    }
  }
);

export const fetchPropertyById = createAsyncThunk(
  'properties/fetchPropertyById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/property/${id}`);
      return response.data; // Return the full response to access data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch property details');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(propertyData).forEach(key => {
        if ((key === 'property_brochure' || key === 'property_image') && propertyData[key] instanceof File) {
          formData.append(key, propertyData[key]);
        } else if (propertyData[key] !== null && propertyData[key] !== undefined && propertyData[key] !== '') {
          formData.append(key, propertyData[key]);
        }
      });

      const response = await axiosInstance.post('/api/property/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ id, propertyData }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(propertyData).forEach(key => {
        if ((key === 'property_brochure' || key === 'property_image') && propertyData[key] instanceof File) {
          formData.append(key, propertyData[key]);
        } else if (propertyData[key] !== null && propertyData[key] !== undefined && propertyData[key] !== '') {
          formData.append(key, propertyData[key]);
        }
      });

      const response = await axiosInstance.put(`/api/property/edit/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/deleteProperty',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/property/delete/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete property');
    }
  }
);

export const exportProperties = createAsyncThunk(
  'properties/exportProperties',
  async ({ format = 'csv', filters = {} }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });

      // Determine the API endpoint based on format
      const endpoint = format === 'pdf' ? 'export-pdf' : 'export-csv';
      
      const response = await axiosInstance.get(`/api/property/${endpoint}?${params}`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `properties.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to export properties');
    }
  }
);

const initialState = {
  properties: [],
  currentProperty: null,
  pagination: {
    current_page: 1,
    per_page: 9,
    total: 0,
    total_pages: 0,
    has_next_page: false,
    has_prev_page: false
  },
  loading: false,
  propertyLoading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  exportLoading: false,
  error: null,
  propertyError: null,
  createError: null,
  updateError: null,
  deleteError: null,
  exportError: null,
};

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPropertyError: (state) => {
      state.propertyError = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
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
    clearExportError: (state) => {
      state.exportError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.error = null;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch All Properties
      .addCase(fetchAllProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties || [];
        // Don't overwrite pagination with null when fetching all properties
        // Keep the existing pagination state for the main listing
        if (action.payload.pagination !== null) {
          state.pagination = action.payload.pagination;
        }
        state.error = null;
      })
      .addCase(fetchAllProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Property by ID
      .addCase(fetchPropertyById.pending, (state) => {
        state.propertyLoading = true;
        state.propertyError = null;
      })
      .addCase(fetchPropertyById.fulfilled, (state, action) => {
        state.propertyLoading = false;
        state.currentProperty = action.payload.data || null;
        state.propertyError = null;
      })
      .addCase(fetchPropertyById.rejected, (state, action) => {
        state.propertyLoading = false;
        state.propertyError = action.payload;
      })
      // Create Property
      .addCase(createProperty.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createError = null;
        // Optionally add the new property to the list
        if (action.payload.data) {
          state.properties.unshift(action.payload.data);
        }
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      // Update Property
      .addCase(updateProperty.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;
        // Update the property in the list
        if (action.payload.data) {
          const index = state.properties.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) {
            state.properties[index] = action.payload.data;
          }
        }
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Delete Property
      .addCase(deleteProperty.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = null;
        // Remove the deleted property from the list
        if (action.payload.data && action.payload.data.id) {
          state.properties = state.properties.filter(p => p.id !== action.payload.data.id);
        } else {
          // If the API doesn't return the deleted property data, we can remove by the ID we sent
          // This is a fallback approach
          const deletedId = action.meta.arg; // The ID we passed to the thunk
          state.properties = state.properties.filter(p => p.id !== deletedId);
        }
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Export Properties
      .addCase(exportProperties.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportProperties.fulfilled, (state) => {
        state.exportLoading = false;
        state.exportError = null;
      })
      .addCase(exportProperties.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload;
      })
  },
});

export const { 
  clearError, 
  clearPropertyError,
  clearCurrentProperty,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
  clearExportError,
} = propertiesSlice.actions;

export default propertiesSlice.reducer;

// Selectors
export const selectProperties = (state) => state.properties.properties;
export const selectPropertiesLoading = (state) => state.properties.loading;
export const selectPropertiesError = (state) => state.properties.error;
export const selectPropertiesPagination = (state) => state.properties.pagination;
export const selectCurrentProperty = (state) => state.properties.currentProperty;
export const selectPropertyLoading = (state) => state.properties.propertyLoading;
export const selectPropertyError = (state) => state.properties.propertyError;
export const selectCreatePropertyLoading = (state) => state.properties.createLoading;
export const selectCreatePropertyError = (state) => state.properties.createError;
export const selectUpdatePropertyLoading = (state) => state.properties.updateLoading;
export const selectUpdatePropertyError = (state) => state.properties.updateError;
export const selectDeletePropertyLoading = (state) => state.properties.deleteLoading;
export const selectDeletePropertyError = (state) => state.properties.deleteError;
export const selectExportPropertyLoading = (state) => state.properties.exportLoading;
export const selectExportPropertyError = (state) => state.properties.exportError;