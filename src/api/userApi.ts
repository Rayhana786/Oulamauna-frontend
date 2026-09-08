import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface BaseUserProfile {
  username: string;
  name: string | null;
  bio: string | null;
  profile_picture: string | null;
  links: any | null; // Consider replacing 'any' with a specific type (e.g., string[] or Record<string, string>) based on your Prisma schema
  contributorBadge: boolean | null;
  adminBadge: boolean;
}

export interface MyProfile extends BaseUserProfile {
  id: number;
  email: string;
  role_id: number;
  is_banned?: boolean;
  created_at?: string;
}

export interface PublicProfile extends BaseUserProfile {
  email: string | null; // Conditionally hidden based on user privacy settings
  role_id: number;      // ✅ ADDED: So the frontend knows the backend sends this now
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// ==========================================
// 2. AXIOS INSTANCE & INTERCEPTORS
// ==========================================

// Note: Updated to port 5000 to match your app.js configuration
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api/users`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
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
api.interceptors.response.use(
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
// 3. USER & PROFILE API ENDPOINTS
// ==========================================

export const userApi = {
  // 👤 Profile Management
  profile: {
    getMyProfile: () => api.get<ApiResponse<MyProfile>>('/profile/me'),
    
    getPublicProfile: (id: number) => api.get<ApiResponse<PublicProfile>>(`/profile/${id}`),
    
    // Requires FormData because of the file upload (profile_picture)
    updateMyProfile: (formData: FormData) => 
      api.patch<ApiResponse<MyProfile>>('/profile/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
  },

  // 🛡️ Admin User Management 
  // (Based on your controller exports. Ensure these routes are mounted in user.route.js, e.g., router.get('/', getAllUsers))
  admin: {
    getAllUsers: () => api.get<ApiResponse<{ users: any[] }>>('/'),
    getUserById: (id: number) => api.get<ApiResponse<{ user: any }>>(`/${id}`),
    banUser: (id: number) => api.patch<ApiResponse<{ message: string }>>(`/${id}/ban`),
    unbanUser: (id: number) => api.patch<ApiResponse<{ message: string }>>(`/${id}/unban`),
  }
};

export default userApi;