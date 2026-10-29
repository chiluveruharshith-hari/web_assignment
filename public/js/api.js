/**
 * CampusFind - Centralized API Service
 * Encapsulates Fetch API requests, error handling, and authorization headers.
 */

const API_BASE = '/api';

export const api = {
  // Retrieve token if stored in memory or fallback
  getToken() {
    return localStorage.getItem('campusfind_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('campusfind_token', token);
    } else {
      localStorage.removeItem('campusfind_token');
    }
  },

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
      credentials: 'include' // Sends HttpOnly cookie
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      let data = {};

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data.errors;
        throw error;
      }

      return data;
    } catch (err) {
      // Re-throw structured error for caller handling
      throw err;
    }
  },

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const fullPath = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(fullPath, { method: 'GET' });
  },

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }
};
