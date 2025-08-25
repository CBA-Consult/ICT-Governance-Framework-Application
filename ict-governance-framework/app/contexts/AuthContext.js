'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Create the authentication context
export const AuthContext = createContext();

// Authentication action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial authentication state
const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Authentication reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        tokens: action.payload.tokens
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user }
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Authentication provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Setup axios interceptors
  useEffect(() => {
    // Request interceptor to add auth token
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        if (state.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${state.tokens.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (state.tokens?.refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken: state.tokens.refreshToken
              });

              const newTokens = {
                ...state.tokens,
                accessToken: response.data.accessToken
              };

              dispatch({
                type: AUTH_ACTIONS.REFRESH_TOKEN,
                payload: { tokens: newTokens }
              });


              // Update localStorage with latest tokens and accessToken
              localStorage.setItem('tokens', JSON.stringify(newTokens));
              localStorage.setItem('token', newTokens.accessToken);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
              return apiClient(originalRequest);
            } catch (refreshError) {
              // Refresh failed, logout user
              logout();
              return Promise.reject(refreshError);
            }
          } else {
            // No refresh token, logout user
            logout();
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [state.tokens]);

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('tokens');
        const storedUser = localStorage.getItem('user');

        if (storedTokens && storedUser) {
          const tokens = JSON.parse(storedTokens);
          const user = JSON.parse(storedUser);

          // Verify token is still valid by fetching user info
          try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${tokens.accessToken}` }
            });

            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                tokens
              }
            });
          } catch (error) {
            // Token invalid, try to refresh
            if (tokens.refreshToken) {
              try {
                const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                  refreshToken: tokens.refreshToken
                });

                const newTokens = {
                  ...tokens,
                  accessToken: refreshResponse.data.accessToken
                };

                const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
                  headers: { Authorization: `Bearer ${newTokens.accessToken}` }
                });

                dispatch({
                  type: AUTH_ACTIONS.LOGIN_SUCCESS,
                  payload: {
                    user: userResponse.data.user,
                    tokens: newTokens
                  }
                });

                localStorage.setItem('tokens', JSON.stringify(newTokens));
              } catch (refreshError) {
                // Refresh failed, clear stored data
                localStorage.removeItem('tokens');
                localStorage.removeItem('user');
                dispatch({ type: AUTH_ACTIONS.LOGOUT });
              }
            } else {
              // No refresh token, clear stored data
              localStorage.removeItem('tokens');
              localStorage.removeItem('user');
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            }
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);

      if (response.data.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          tempToken: response.data.tempToken
        };
      }

      const { user, tokens } = response.data;


  // Store in localStorage with extra consistency
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tokens', JSON.stringify(tokens));
  localStorage.setItem('token', tokens.accessToken);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens }
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.tokens?.accessToken) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('tokens');

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await apiClient.put(`/users/${state.user.userId}`, userData);
      
      const updatedUser = { ...state.user, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { user: updatedUser }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await apiClient.post('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    return state.user?.permissions?.includes(permission) || false;
  };

  // Check if user has role
  const hasRole = (role) => {
    return state.user?.roles?.includes(role) || false;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  // Check if user has all specified permissions
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };

  const value = {
    // State
    user: state.user,
    tokens: state.tokens,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateUser,
    changePassword,
    clearError,

    // Utilities
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllPermissions,
    apiClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth(WrappedComponent, requiredPermissions = [], requiredRoles = []) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, hasAllPermissions, hasAnyRole } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Authentication Required
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please log in to access this page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Check permissions
    if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Access Denied
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Check roles
    if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Access Denied
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You don't have the required role to access this page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

