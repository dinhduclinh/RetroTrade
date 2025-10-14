import { store } from '../store/redux_store';
import { logout, login } from '../store/auth/authReducer';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999/api/v1';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token!);
        }
    });

    failedQueue = [];
};

// Extended RequestInit interface to include _retry property
interface ExtendedRequestInit extends RequestInit {
    _retry?: boolean;
}

// Custom fetch wrapper with interceptors functionality
const customFetch = async (url: string, options: ExtendedRequestInit = {}): Promise<Response> => {
    // Request interceptor - add auth token
    const token = store.getState().auth?.accessToken;
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };
    }

    // Add default headers
    if (!(options.body instanceof FormData)) {
     options.headers = {
       "Content-Type": "application/json",
       ...options.headers,
     };
   }

    console.log('Making request to:', url, 'with options:', options);

    try {
        // Make the request
        const response = await fetch(url, options);
        console.log('Response status:', response.status, 'for URL:', url);

        // Response interceptor - handle token refresh
        if (!response.ok && [401, 403].includes(response.status)) {
        const originalRequest = { url, options };
        
        if (!originalRequest.options._retry) {
            originalRequest.options._retry = true;
            const { refreshToken } = store.getState().auth || {};
            
            if (!refreshToken) {
                store.dispatch(logout());
                throw new Error('No refresh token available');
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.options.headers = {
                            ...originalRequest.options.headers,
                            'Authorization': 'Bearer ' + token,
                        };
                        return customFetch(originalRequest.url, originalRequest.options);
                    })
                    .catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshResponse = await fetch(`${BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!refreshResponse.ok) {
                    throw new Error('Token refresh failed');
                }

                const data = await refreshResponse.json();
                const { accessToken } = data;

                store.dispatch(login({ accessToken, refreshToken }));
                processQueue(null, accessToken);
                
                originalRequest.options.headers = {
                    ...originalRequest.options.headers,
                    'Authorization': 'Bearer ' + accessToken,
                };
                
                return customFetch(originalRequest.url, originalRequest.options);
            } catch (err) {
                processQueue(err as Error, null);
                store.dispatch(logout());
                throw err;
            } finally {
                isRefreshing = false;
            }
        }
    }

    return response;
    } catch (error) {
        console.error('Fetch error for URL:', url, 'Error:', error);
        throw error;
    }
};

// API methods using fetch
const api = {
  get: (url: string, options: ExtendedRequestInit = {}) =>
    customFetch(`${BASE_URL}${url}`, { ...options, method: "GET" }),

  post: (url: string, data?: any, options: ExtendedRequestInit = {}) => {
    const isFormData = data instanceof FormData;

    const headers = isFormData
      ? options.headers 
      : { "Content-Type": "application/json", ...options.headers };

    const body = isFormData ? data : data ? JSON.stringify(data) : undefined;

    return customFetch(`${BASE_URL}${url}`, {
      ...options,
      method: "POST",
      headers,
      body,
    });
  },

  put: (url: string, data?: unknown, options: ExtendedRequestInit = {}) =>
    customFetch(`${BASE_URL}${url}`, {
      ...options,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options: ExtendedRequestInit = {}) =>
    customFetch(`${BASE_URL}${url}`, { ...options, method: "DELETE" }),

  patch: (url: string, data?: unknown, options: ExtendedRequestInit = {}) =>
    customFetch(`${BASE_URL}${url}`, {
      ...options,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export default api;
