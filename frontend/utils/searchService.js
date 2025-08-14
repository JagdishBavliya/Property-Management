import axiosInstance from './axiosInstance';

class SearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  generateCacheKey(type, query, filters = {}) {
    return `${type}:${query}:${JSON.stringify(filters)}`;
  }
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheTimeout;
  }
  getCachedResults(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }
    return null;
  }
  setCachedResults(cacheKey, data) {
    this.cache.set(cacheKey, { data, timestamp: Date.now()});
  }

  // SEARCH PROPERTIES
  async searchProperties(query, limit = 5) {
    const cacheKey = this.generateCacheKey('properties', query, { limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const params = new URLSearchParams({ page: '1', per_page: limit.toString(), search: query});
      const response = await axiosInstance.get(`/api/property?${params}`);
      const result = response.data.properties || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching properties:', error);
      return [];
    }
  }

  // SEARCH USERS
  async searchUsers(query, role, limit = 5) {
    const cacheKey = this.generateCacheKey('users', query, { role, limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      let response;
      let result = [];
      if (role === 'Manager') {
        const params = new URLSearchParams({ page: '1', limit: limit.toString(), search: query });
        response = await axiosInstance.get(`/api/users/managers-for-current-user?${params}`);
        result = response.data.managers || [];
      } 
      if (role === 'Agent') {
        const params = new URLSearchParams({ page: '1', limit: limit.toString(), search: query });
        response = await axiosInstance.get(`/api/users/agents-for-current-user?${params}`);
        result = response.data.agents || [];
      }
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error searching ${role}s:`, error);
      return [];
    }
  }

  // Search all entities
  async searchAll(query, limit = 5) {
    try {
      const [properties, agents, managers] = await Promise.allSettled([
        this.searchProperties(query, limit),
        this.searchUsers(query, 'Agent', limit),
        this.searchUsers(query, 'Manager', limit)
      ]);
      return {
        properties: properties.status === 'fulfilled' ? properties.value : [],
        agents: agents.status === 'fulfilled' ? agents.value : [],
        managers: managers.status === 'fulfilled' ? managers.value : []
      };
    } catch (error) {
      console.error('Error in searchAll:', error);
      return { properties: [], agents: [], managers: []};
    }
  }

  // SEARCH BROKERAGES
  async searchBrokerages(query, limit = 5) {
    const cacheKey = this.generateCacheKey('brokerages', query, { limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const params = new URLSearchParams({ page: '1', limit: limit.toString(), search: query });
      const response = await axiosInstance.get(`/api/brokerage?${params}`);
      const result = response.data.brokerages || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching brokerages:', error);
      return [];
    }
  }

  // SEARCH ESTIMATES
  async searchEstimates(query, limit = 5) {
    const cacheKey = this.generateCacheKey('estimates', query, { limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const params = new URLSearchParams({ page: '1', limit: limit.toString(), search: query });
      const response = await axiosInstance.get(`/api/estimates?${params}`);
      const result = response.data.estimates || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching estimates:', error);
      return [];
    }
  }

  // SEARCH VISITS
  async searchVisits(query, limit = 5) {
    const cacheKey = this.generateCacheKey('visits', query, { limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const params = new URLSearchParams({ page: '1', limit: limit.toString(), search: query });
      const response = await axiosInstance.get(`/api/visits?${params}`);
      const result = response.data.visits || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching visits:', error);
      return [];
    }
  }

  // SEARCH ADMINS
  async searchAdmins(query, limit = 5) {
    const cacheKey = this.generateCacheKey('admins', query, { limit });
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const params = new URLSearchParams({ page: '1', per_page: limit.toString(), search: query, role: 'Super Admin,Admin'});
      const response = await axiosInstance.get(`/api/users?${params}`);
      const result = response.data.users || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching admins:', error);
      return [];
    }
  }

  // SEARCH WITH PERMISSION FILTERING
  async searchWithPermissions(query, limit = 5, allowedSearches = {}) {
    try {
      const searchPromises = [];      
      if (allowedSearches.properties) {
        searchPromises.push(['properties', this.searchProperties(query, limit)]);
      }
      if (allowedSearches.agents) {
        searchPromises.push(['agents', this.searchUsers(query, 'Agent', limit)]);
      }
      if (allowedSearches.managers) {
        searchPromises.push(['managers', this.searchUsers(query, 'Manager', limit)]);
      }
      if (allowedSearches.brokerages) {
        searchPromises.push(['brokerages', this.searchBrokerages(query, limit)]);
      }
      if (allowedSearches.estimates) {
        searchPromises.push(['estimates', this.searchEstimates(query, limit)]);
      }
      if (allowedSearches.visits) {
        searchPromises.push(['visits', this.searchVisits(query, limit)]);
      }
      if (allowedSearches.admins) {
        searchPromises.push(['admins', this.searchAdmins(query, limit)]);
      }

      const results = await Promise.allSettled(searchPromises.map(([_, promise]) => promise));      
      const searchResults = {
        properties: [],
        agents: [],
        managers: [],
        brokerages: [],
        estimates: [],
        visits: [],
        admins: []
      };
      searchPromises.forEach(([entityType], index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          searchResults[entityType] = result.value;
        }
      });

      return searchResults;
    } catch (error) {
      return {
        properties: [],
        agents: [],
        managers: [],
        brokerages: [],
        estimates: [],
        visits: [],
        admins: []
      };
    }
  }

  clearCache() {
    this.cache.clear();
  }
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (!this.isCacheValid(value.timestamp)) {
        this.cache.delete(key);
      }
    }
  }
  getCacheStats() {
    this.clearExpiredCache();
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  async fetchAdminsDropdown() {
    const cacheKey = 'adminsDropdown';
    const cached = this.getCachedResults(cacheKey);
    if (cached) return cached;
    try {
      const response = await axiosInstance.get('/api/users/admins-dropdown');
      const result = response.data.admins || [];
      this.setCachedResults(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching admins dropdown:', error);
      return [];
    }
  }
}
export default new SearchService(); 