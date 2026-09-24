import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface BaseUserProfile {
  username: string;
  name: string | null;
  bio: string | null;
  profile_picture: string | null;
  links: any | null;
  contributorBadge: boolean | null;
  adminBadge: boolean;
}

export interface MyProfile extends BaseUserProfile {
  id: number;
  email: string;
  role_id: number;
  is_banned?: boolean;
  created_at?: string;
  is_active?: boolean;
}

export interface PublicProfile {
  username: string;
  name: string | null;
  bio: string | null;
  profile_picture: string | null;
  links: any | null;
  contributorBadge: boolean | null;
  adminBadge: boolean;
  email: string | null;
  role_id: number;
  is_active?: boolean;
  is_banned?: boolean;
  status?: "deleted" | "banned" | "deactivated" | "private" | "registered_only";
  show_contributions: boolean; // ADD
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// NEW: activity feed types
export interface UserContribution {
  type: 'scholar' | 'edition' | 'media' | 'work'; // added 'work'
  id: number;
  title: string | null;
  image_url: string | null;
  created_at: string | null; // now nullable
  scholar_id: number | null;
  lang: string | null;
  format?: string; // only present when type === 'work'
}

export interface UserForumPost {
  post_id: number;
  title: string;
  excerpt: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  category: string | null;
}

// ==========================================
// 2. AXIOS INSTANCE & INTERCEPTORS
// ==========================================

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api/users`;

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

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
  profile: {
    getMyProfile: () => api.get<ApiResponse<MyProfile>>('/profile/me'),

    getPublicProfile: (id: number) => api.get<ApiResponse<PublicProfile>>(`/profile/${id}`),

    updateMyProfile: (formData: FormData) =>
      api.patch<ApiResponse<MyProfile>>('/profile/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
      updatePassword: (data: { currentPassword: string; newPassword: string; confirmNewPassword: string }) =>
      api.put<ApiResponse<any>>('/profile/update-password', data),


    // NEW: activity feeds for the profile page
    getContributions: (id: number) =>
      api.get<ApiResponse<UserContribution[]>>(`/${id}/contributions`),

    getForumPosts: (id: number) =>
      api.get<ApiResponse<UserForumPost[]>>(`/${id}/posts`),
  },

  admin: {
    getAllUsers: () => api.get<ApiResponse<{ users: any[] }>>('/'),
    getUserById: (id: number) => api.get<ApiResponse<{ user: any }>>(`/${id}`),
    banUser: (id: number) => api.patch<ApiResponse<{ message: string }>>(`/${id}/ban`),
    unbanUser: (id: number) => api.patch<ApiResponse<{ message: string }>>(`/${id}/unban`),
  }
};

export default userApi;