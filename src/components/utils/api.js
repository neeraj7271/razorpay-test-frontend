import axios from 'axios';

// Base URLs for API endpoints
const LOCAL_API_URL = 'http://localhost:5000/api';
const PRODUCTION_API_URL = '    ';

// Helper to get auth token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create axios instances
const localApi = axios.create({
    baseURL: LOCAL_API_URL,
});

const prodApi = axios.create({
    baseURL: PRODUCTION_API_URL,
});

// Add auth headers to requests
const addAuthHeader = (config) => {
    const token = getAuthToken();
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }
    return config;
};

// Add request interceptors for both instances
localApi.interceptors.request.use(addAuthHeader);
prodApi.interceptors.request.use(addAuthHeader);

/**
 * Make an API request with fallback between local and production
 * @param {string} endpoint - API endpoint (without leading slash)
 * @param {string} method - HTTP method (get, post, put, delete)
 * @param {Object} data - Request payload (for POST/PUT)
 * @param {Object} options - Additional axios options
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, method = 'get', data = null, options = {}) => {
    let error = null;

    // Try local API first
    try {
        const config = {
            ...options,
            method,
            url: endpoint,
            data: method !== 'get' ? data : undefined,
            params: method === 'get' ? data : undefined,
        };

        const response = await localApi(config);
        return response.data;
    } catch (localError) {
        console.log(`Local API request to ${endpoint} failed:`, localError);
        error = localError;

        // Try production API as fallback
        try {
            const config = {
                ...options,
                method,
                url: endpoint,
                data: method !== 'get' ? data : undefined,
                params: method === 'get' ? data : undefined,
            };

            const response = await prodApi(config);
            return response.data;
        } catch (prodError) {
            console.log(`Production API request to ${endpoint} failed:`, prodError);

            // If both failed, try fetch API for CORS issues
            try {
                const fetchOptions = {
                    method: method.toUpperCase(),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAuthToken()}`,
                    },
                    body: data ? JSON.stringify(data) : undefined,
                };

                const fetchUrl = `${PRODUCTION_API_URL}/${endpoint}`;
                const fetchResponse = await fetch(fetchUrl, fetchOptions);

                if (!fetchResponse.ok) {
                    throw new Error(`Fetch failed with status: ${fetchResponse.status}`);
                }

                return await fetchResponse.json();
            } catch (fetchError) {
                console.log(`Fetch API request to ${endpoint} failed:`, fetchError);
                // Throw original error from local API if all methods fail
                throw error;
            }
        }
    }
};

// Convenience methods
export const get = (endpoint, params, options) =>
    apiRequest(endpoint, 'get', params, options);

export const post = (endpoint, data, options) =>
    apiRequest(endpoint, 'post', data, options);

export const put = (endpoint, data, options) =>
    apiRequest(endpoint, 'put', data, options);

export const del = (endpoint, options) =>
    apiRequest(endpoint, 'delete', null, options);

export default {
    get,
    post,
    put,
    delete: del,
    apiRequest
}; 