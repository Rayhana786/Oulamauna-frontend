import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface LanguagePreference {
  language_id: number;
  code: string;
  name: string;
}

export interface UserSettings {
  preferred_language_id: number | null;
  notifications_enabled: boolean;
  profile_visibility: 'public' | 'registered_only' | 'private';
  show_email: boolean;
  show_contributions: boolean;
  is_active: boolean;
  languages_preferred: LanguagePreference | null;
}

export interface UpdateSettingsPayload {
  preferred_language_id?: number;
  notifications_enabled?: boolean;
  profile_visibility?: 'public' | 'registered_only' | 'private';
  show_email?: boolean;
  show_contributions?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// ==========================================
// 2. AXIOS INSTANCE
// ==========================================

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5444';
const SETTINGS_BASE_URL = `${BASE_URL}/api/settings`;

const settingsApi: AxiosInstance = axios.create({
  baseURL: SETTINGS_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach JWT Token
settingsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); 
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
settingsApi.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 3. SETTINGS API ENDPOINTS
// ==========================================

export const settingsService = {
  /**
   * Get the current user's settings
   */
  getMySettings: () => 
    settingsApi.get<ApiResponse<UserSettings>>('/'),

  /**
   * Partially update the current user's settings
   */
  updateMySettings: (payload: UpdateSettingsPayload) => 
    settingsApi.patch<ApiResponse<UserSettings>>('/', payload),

  /**
   * Deactivate the current user's account (Reversible via login)
   */
  deactivateAccount: () => 
    settingsApi.post<ApiResponse>('/deactivate'),

  /**
   * Delete/Anonymize the current user's account (Irreversible)
   */
  deleteAccount: () => 
    settingsApi.post<ApiResponse>('/delete'),
};

export default settingsService;