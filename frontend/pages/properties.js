import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Hashids from 'hashids';

// Redux
import {
  fetchProperties,
  deleteProperty,
  exportProperties,
  selectProperties,
  selectPropertiesLoading,
  selectPropertiesError,
  selectPropertiesPagination,
  selectDeletePropertyLoading,
  selectDeletePropertyError,
  selectExportPropertyLoading,
  selectExportPropertyError,
  clearDeleteError,
  clearExportError
} from '../store/slices/propertiesSlice';
import {
  fetchAgentsForCurrentUser,
  selectUsers,
  selectUsersLoading
} from '../store/slices/usersSlice';

// Components
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import CodeBadge from '../components/ui/CodeBadge';
import Pagination from '../components/ui/Pagination';
import ExportModal from '../components/ui/ExportModal';
import FilterSection from '../components/ui/FilterSection';
import CheckPermission from '../components/ui/CkeckPermission';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import { PROPERTY_TYPES } from '../utils/constants';

import {
  BuildingOfficeIcon, PlusIcon, MapPinIcon, CurrencyDollarIcon, HomeIcon,
  BuildingStorefrontIcon, Squares2X2Icon, ListBulletIcon, PhotoIcon, TrashIcon,
  ArrowDownTrayIcon, EyeIcon, PencilIcon
} from '@heroicons/react/24/outline';

export default function Properties() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const properties = useSelector(selectProperties);
  const loading = useSelector(selectPropertiesLoading);
  const error = useSelector(selectPropertiesError);
  const pagination = useSelector(selectPropertiesPagination);
  const deleteLoading = useSelector(selectDeletePropertyLoading);
  const deleteError = useSelector(selectDeletePropertyError);
  const exportLoading = useSelector(selectExportPropertyLoading);
  const exportError = useSelector(selectExportPropertyError);
  const agents = useSelector(selectUsers);
  const agentsLoading = useSelector(selectUsersLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({ property: '', city: '', p_type: 'all', ag_code: '' });
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportData, setExportData] = useState({ properties: [], cities: [], agentCodes: [] });
  const [exportDataLoading, setExportDataLoading] = useState(false);
  const [localPagination, setLocalPagination] = useState({ currentPage: 1, perPage: 9, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const hashids = new Hashids('your-salt-string', 6);

  useEffect(() => {
    const { search: urlSearch } = router.query;
    if (urlSearch && !searchTerm) {
      setSearchTerm(urlSearch);
      setSearchInputValue(urlSearch);
    }
  }, [router.query, searchTerm]);

  useEffect(() => {
    dispatch(fetchProperties({ page: localPagination.currentPage, perPage: localPagination.perPage, search: searchTerm, type: filterType }));
  }, [dispatch, localPagination.currentPage, localPagination.perPage, searchTerm, filterType]);

  useEffect(() => {
    if (deleteError) {
      toast.error(deleteError);
      dispatch(clearDeleteError());
    }
  }, [deleteError, dispatch]);

  useEffect(() => {
    if (exportError) {
      toast.error(exportError);
      dispatch(clearExportError());
    }
  }, [exportError, dispatch]);

  useEffect(() => {
    if (pagination) {
      setLocalPagination({
        currentPage: pagination.currentPage || pagination.current_page || 1,
        perPage: pagination.perPage || pagination.per_page || 9,
        total: pagination.total || 0,
        totalPages: pagination.totalPages || pagination.total_pages || 0,
        hasNextPage: pagination.hasNextPage || pagination.has_next_page || false,
        hasPrevPage: pagination.hasPrevPage || pagination.has_prev_page || false
      });
    }
  }, [pagination]);

  useEffect(() => {
    const { search: urlSearch } = router.query;
    if (urlSearch && !searchQuery) setSearchQuery(urlSearch);
  }, [router.query, searchQuery]);

  const handlePerPageChange = (perPageValue) => {
    setPerPage(perPageValue);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (agents.length > 0 && exportData.agentCodes.length === 0) {
      const agentCodes = agents
        .filter(agent => {
          const isAgent = agent.role === 'Agent' || agent.role === 'agent' || agent.agent_type || agent.user_code?.startsWith('AGT-');
          return isAgent;
        })
        .map(agent => ({
          value: agent.user_code,
          label: `${agent.user_code} - ${agent.name}`
        }));

      if (agentCodes.length === 0 && agents.length > 0) {
        const allUserCodes = agents.map(user => ({
          value: user.user_code,
          label: `${user.user_code} - ${user.name} (${user.role || 'no role'})`
        }));
        setExportData(prev => ({
          ...prev,
          agentCodes: [{ value: '', label: 'All Users (Debug)' }, ...allUserCodes]
        }));
        return;
      }

      setExportData(prev => ({
        ...prev,
        agentCodes: [{ value: '', label: 'All Agents' }, ...agentCodes]
      }));
    }
  }, [agents, exportData.agentCodes.length]);

  const fetchExportData = async () => {
    setExportDataLoading(true);
    let allAgents = [];

    try {
      let allProperties = properties;
      if (allProperties.length === 0) {
        const result = await dispatch(fetchProperties({ page: 1, perPage: 1000, search: '', type: 'all' })).unwrap();
        allProperties = result.properties || [];
      }
      const agentsResult = await dispatch(fetchAgentsForCurrentUser({ page: currentPage, limit: perPage, search: searchQuery })).unwrap();
      allAgents = agentsResult.users || agents || [];

      const cities = [...new Set(allProperties.map(p => p.city).filter(Boolean))];
      const agentCodes = allAgents
        .filter(agent => {
          const isAgent = agent.role === 'Agent' || agent.role === 'agent' || agent.agent_type || agent.user_code?.startsWith('AGT-');
          return isAgent;
        })
        .map(agent => ({
          value: agent.user_code,
          label: `${agent.user_code} - ${agent.name}`
        }));

      if (agentCodes.length === 0 && allAgents.length > 0) {
        const allUserCodes = allAgents.map(user => ({
          value: user.user_code,
          label: `${user.user_code} - ${user.name} (${user.role || 'no role'})`
        }));
        setExportData(prev => ({
          ...prev,
          agentCodes: [{ value: '', label: 'All Users (Debug)' }, ...allUserCodes]
        }));
        return;
      }

      const propertiesList = allProperties.map(p => ({
        value: p.property_code,
        label: `${p.property_code} - ${p.property_name}`
      }));

      setExportData({
        properties: [{ value: '', label: 'All Properties' }, ...propertiesList],
        cities: [{ value: '', label: 'All Cities' }, ...cities.map(city => ({ value: city, label: city }))],
        agentCodes: [{ value: '', label: 'All Agents' }, ...agentCodes]
      });
    } catch (error) {
      console.error('Error fetching export data:', error);
      toast.error('Failed to load export options');
    } finally {
      setExportDataLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchInputValue(value);
  };

  const handleSearchSubmit = () => {
    setSearchTerm(searchInputValue);
    setLocalPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleFilterChange = (key, value) => {
    switch (key) {
      case 'type':
        setFilterType(value);
        setLocalPagination(prev => ({ ...prev, currentPage: 1 }));
        break;
      case 'status':
        setStatusFilter(value);
        break;
      default:
        break;
    }
  };

  const handlePageChange = (page) => {
    setLocalPagination(prev => ({ ...prev, currentPage: page }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchInputValue('');
    setFilterType('all');
    setStatusFilter('all');
    setLocalPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Residential':
        return HomeIcon;
      case 'Commercial':
        return BuildingStorefrontIcon;
      default:
        return BuildingOfficeIcon;
    }
  };

  const handleDeleteClick = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (propertyToDelete) {
      try {
        await dispatch(deleteProperty(propertyToDelete.id)).unwrap();
        toast.success('Property deleted successfully!');
        setShowDeleteModal(false);
        setPropertyToDelete(null);
        dispatch(fetchProperties({ page: localPagination.currentPage, perPage: localPagination.perPage, search: searchTerm, type: filterType }));
      } catch (error) {
        toast.error('Error deleting property:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPropertyToDelete(null);
  };

  const handleExport = async () => {
    try {
      const apiFilters = { ...exportFilters };
      if (exportFilters.property && exportFilters.property !== '') {
        apiFilters.property_code = exportFilters.property;
      }
      delete apiFilters.property;
      await dispatch(exportProperties({ format: exportFormat, filters: apiFilters })).unwrap();
      toast.success(`Properties exported successfully as ${exportFormat.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) { }
  };

  const handleExportCancel = () => {
    setShowExportModal(false);
    setExportFilters({ property: '', city: '', p_type: 'all', ag_code: '' });
    setExportFormat('csv');
  };

  const handleExportFilterChange = (key, value) => {
    setExportFilters(prev => ({ ...prev, [key]: value }));
  };

  const filters = [
    {
      key: 'type',
      label: 'Type',
      placeholder: 'All Types',
      options: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'industrial', label: 'Industrial' },
      ]
    }
  ];

  const viewModeOptions = [
    { value: 'grid', label: 'Grid', icon: Squares2X2Icon },
    { value: 'list', label: 'List', icon: ListBulletIcon },
  ];

  const activeFilters = {
    type: filterType,
  };

  const exportFilterOptions = [
    {
      key: 'p_type',
      label: 'Property Type',
      options: PROPERTY_TYPES,
      loading: false,
    },
    {
      key: 'city',
      label: 'City',
      options: exportData.cities,
      loading: exportDataLoading,
    },
    {
      key: 'ag_code',
      label: 'Agent',
      options: exportData.agentCodes,
      loading: exportDataLoading || agentsLoading,
    },
    {
      key: 'property',
      label: 'Property',
      options: exportData.properties,
      loading: exportDataLoading,
    },
  ];

  const exportFormats = [
    {
      value: 'csv',
      label: 'CSV',
      icon: null,
      description: 'Spreadsheet format',
    },
    {
      value: 'pdf',
      label: 'PDF',
      icon: null,
      description: 'Document format',
    },
  ];

  if (loading && properties.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card variant="elevated">
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <BuildingOfficeIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error loading properties</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="primary" onClick={() => dispatch(fetchProperties({
              page: localPagination.currentPage,
              perPage: localPagination.perPage,
              search: searchTerm,
              type: filterType
            }))}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your property listings and track their performance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CheckPermission permission="property-export">
                <Button
                  variant="outline"
                  icon={ArrowDownTrayIcon}
                  size="sm"
                  onClick={() => {
                    setShowExportModal(true);
                    fetchExportData();
                  }}
                  disabled={exportLoading}
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </Button>
              </CheckPermission>
              <CheckPermission permission="property-create">
                <Button
                  variant="primary"
                  icon={PlusIcon}
                  size="sm"
                  iconSize="h-5 w-5 sm:h-6 sm:w-6"
                  onClick={() => router.push('/properties/create')}
                >
                  Add Property
                </Button>
              </CheckPermission>
            </div>
          </div>

          {/* Professional Filter Section */}
          <FilterSection
            searchPlaceholder="Search properties by name, city, or code..."
            searchValue={searchInputValue}
            onSearchChange={handleSearchInputChange}
            onSearchSubmit={handleSearchSubmit}
            onSearchKeyPress={handleSearchKeyPress}
            filters={filters}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewModeOptions={viewModeOptions}
            resultsCount={properties.length}
            totalCount={localPagination.total || 0}
            showActiveFilters={false}
          />

          {/* Properties Display */}
          <div className="relative">
            {loading && properties.length > 0 && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <Loader size="lg" />
                  <p className="text-sm text-gray-600 mt-2 text-center">Loading properties...</p>
                </div>
              </div>
            )}
            <div className={loading && properties.length > 0 ? "opacity-50 pointer-events-none" : ""}>
              {viewMode === 'grid' ? (
                // Grid View
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => {
                    const TypeIcon = getTypeIcon(property.property_type);
                    return (
                      <Card key={property.id} variant="elevated" className="group hover:scale-105 transition-transform duration-300">
                        <div className="space-y-4">
                          {/* Property Image */}
                          <div className="relative">
                            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                              {property.property_image ? (
                                <img
                                  src={property.property_image}
                                  alt={property.property_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`flex items-center justify-center ${property.property_image ? 'hidden' : 'flex'}`}>
                                <PhotoIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            </div>
                            <div className="absolute top-3 left-3">
                              <CodeBadge code={property.property_code} size="xxs" />
                            </div>
                            {/* Delete Button - Improved design */}
                            <CheckPermission permission="property-delete">
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                                <button
                                  onClick={() => handleDeleteClick(property)}
                                  className="p-1 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:border-red-200 transition-all duration-200"
                                  title="Delete Property"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </CheckPermission>
                          </div>

                          {/* Property Info */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h3 className="text-lg font-semibold text-gray-900 leading-tight">{property.property_name}</h3>
                              <div className="flex items-center gap-1 text-gray-500">
                                <TypeIcon className="h-4 w-4" />
                                <span className="text-xs font-medium">{property.property_type}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                              <p className="text-sm leading-relaxed">{property.city}</p>
                            </div>

                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="h-5 w-5 text-success-600" />
                              <p className="text-xl font-bold text-success-600">
                                ₹{parseFloat(property.full_deal_amount).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <BuildingOfficeIcon className="h-4 w-4" />
                                  {property.number_of_units} units
                                </span>
                              </div>
                              <span className="font-medium">{parseFloat(property.property_size).toLocaleString()} sqft</span>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                              <div><strong>Seller:</strong> {property.seller_name}</div>
                              <div><strong>Agent:</strong> {property.agent_code}</div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-3 pt-2">
                            <CheckPermission permission="property-view">
                              <Button
                                variant="outline"
                                className="flex-1"
                                size="sm"
                                onClick={() => router.push(`/properties/${hashids.encode(property.id)}`)}
                              >
                                <EyeIcon className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </CheckPermission>
                            <CheckPermission permission="property-edit">
                              <Button
                                variant="primary"
                                className="flex-1"
                                size="sm"
                                onClick={() => router.push(`/properties/edit/${hashids.encode(property.id)}`)}
                              >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </CheckPermission>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {properties.map((property) => {
                    const TypeIcon = getTypeIcon(property.property_type);
                    return (
                      <Card key={property.id} variant="elevated" className="group hover:shadow-medium transition-shadow duration-300">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Property Image */}
                          <div className="relative lg:w-64 lg:flex-shrink-0">
                            <div className="aspect-video lg:aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                              {property.property_image ? (
                                <img
                                  src={property.property_image}
                                  alt={property.property_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`flex items-center justify-center ${property.property_image ? 'hidden' : 'flex'}`}>
                                <PhotoIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            </div>
                            <div className="absolute top-3 left-3">
                              <CodeBadge code={property.property_code} size="xxs" />
                            </div>
                            {/* Delete Button - Improved design for list view */}
                            <CheckPermission permission="property-delete">
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                                <button
                                  onClick={() => handleDeleteClick(property)}
                                  className="p-2 bg-white/90 backdrop-blur-sm hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:border-red-200 transition-all duration-200"
                                  title="Delete Property"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </CheckPermission>
                          </div>

                          {/* Property Info */}
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-semibold text-gray-900">{property.property_name}</h3>
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <TypeIcon className="h-4 w-4" />
                                    <span className="text-sm font-medium">{property.property_type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                                  <p className="text-sm">{property.city}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <CurrencyDollarIcon className="h-6 w-6 text-success-600" />
                                <p className="text-2xl font-bold text-success-600">
                                  ₹{parseFloat(property.full_deal_amount).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                {property.number_of_units} units
                              </span>
                              <span className="font-medium">{parseFloat(property.property_size).toLocaleString()} sqft</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                              <div><strong>Seller:</strong> {property.seller_name}</div>
                              <div><strong>Agent:</strong> {property.agent_code}</div>
                              <div><strong>Rate:</strong> ₹{property.property_rate}/sqft</div>
                              <div><strong>Area:</strong> {property.area} sqft</div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                              <CheckPermission permission="property-view">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/properties/${hashids.encode(property.id)}`)}
                                >
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </CheckPermission>
                              <CheckPermission permission="property-edit">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => router.push(`/properties/edit/${hashids.encode(property.id)}`)}
                                >
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </CheckPermission>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {localPagination.totalPages > 1 && (
            <div className="pt-6 border-t border-gray-200">
              <Pagination
                currentPage={localPagination.currentPage}
                totalPages={localPagination.totalPages}
                onPageChange={handlePageChange}
                hasNextPage={localPagination.hasNextPage}
                hasPrevPage={localPagination.hasPrevPage}
                total={localPagination.total}
                perPage={localPagination.perPage}
                onPerPageChange={handlePerPageChange}
              />
            </div>
          )}

          {properties.length === 0 && (
            <Card variant="elevated">
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                  <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  {searchTerm || filterType !== 'all'
                    ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                    : 'Get started by adding your first property to begin managing your listings.'
                  }
                </p>
                {(searchTerm || filterType !== 'all') ? (
                  <div className="mt-6">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (

                  <CheckPermission permission="property-create">
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        icon={PlusIcon}
                        size="sm"
                        iconSize="h-5 w-5 sm:h-6 sm:w-6"
                        onClick={() => router.push('/properties/create')}
                      >
                        Add Property
                      </Button>
                    </div>
                  </CheckPermission>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title="Delete Property"
        description="This action will permanently remove the property from the system."
        itemType="property"
        itemData={propertyToDelete}
        confirmText="Delete Property"
        cancelText="Cancel"
      />

      {/* Reusable Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={handleExportCancel}
        onExport={handleExport}
        loading={exportLoading}
        filters={exportFilters}
        onFilterChange={handleExportFilterChange}
        filterOptions={exportFilterOptions}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        formats={exportFormats}
        title="Export Properties"
        description="Choose format and filters to export your property data."
        confirmText="Export"
        cancelText="Cancel"
      />
    </div>
  );
} 