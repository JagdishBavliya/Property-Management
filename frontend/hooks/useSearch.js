import { useState, useEffect, useCallback } from 'react';
import searchService from '../utils/searchService';

export const useSearch = (initialQuery = '', debounceMs = 300, userPermissions = []) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState({
    properties: [],
    agents: [],
    managers: [],
    brokerages: [],
    estimates: [],
    visits: [],
    admins: []
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const hasPermission = useCallback((permission) => {
    if (!userPermissions || userPermissions.length === 0) return false;    
    if (Array.isArray(userPermissions) && userPermissions.length > 0) {
      if (typeof userPermissions[0] === 'string') {
        return new Set(userPermissions).has(permission);
      }
      if (typeof userPermissions[0] === 'object') {
        const allPermissions = userPermissions.flatMap(item => 
          [item?.name, item?.code, item?.permission].filter(Boolean)
        );
        return new Set(allPermissions).has(permission);
      }
    }
    return false;
  }, [userPermissions]);

  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ 
        properties: [], 
        agents: [], 
        managers: [], 
        brokerages: [], 
        estimates: [], 
        visits: [], 
        admins: [] 
      });
      return;
    }

    setSearchLoading(true);
    try {
      const allowedSearches = {
        properties: hasPermission('property-list'),
        agents: hasPermission('agent-list'),
        managers: hasPermission('manager-list'),
        brokerages: hasPermission('brokerage-list'),
        estimates: hasPermission('estimate-list'),
        visits: hasPermission('visit-list'),
        admins: hasPermission('admin-list')
      };

      const results = await searchService.searchWithPermissions(query, 5, allowedSearches);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ 
        properties: [], 
        agents: [], 
        managers: [], 
        brokerages: [], 
        estimates: [], 
        visits: [], 
        admins: [] 
      });
    } finally {
      setSearchLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => performSearch(searchQuery), debounceMs);
      setSearchTimeout(timeoutId);
    } else {
      setSearchResults({ 
        properties: [], 
        agents: [], 
        managers: [], 
        brokerages: [], 
        estimates: [], 
        visits: [], 
        admins: [] 
      });
    }
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [searchQuery, performSearch, debounceMs]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults({ 
      properties: [], 
      agents: [], 
      managers: [], 
      brokerages: [], 
      estimates: [], 
      visits: [], 
      admins: [] 
    });
    if (searchTimeout) clearTimeout(searchTimeout);
  }, [searchTimeout]);

  const updateSearchQuery = useCallback((query) => setSearchQuery(query), []);
  const totalResults = searchResults.properties.length + 
                      searchResults.agents.length + 
                      searchResults.managers.length + 
                      searchResults.brokerages.length + 
                      searchResults.estimates.length + 
                      searchResults.visits.length + 
                      searchResults.admins.length;

  return {
    searchQuery,
    searchResults,
    searchLoading,
    totalResults,
    updateSearchQuery,
    clearSearch,
    performSearch
  };
};

export default useSearch; 