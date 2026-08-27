import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  allowed_to_contribute: boolean;
  is_banned: boolean;
}

export interface ScholarVersion {
  version_id: number;
  scholar_id: number;
  language_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  version_type: 'creation' | 'edition';
  canonical_name: string;
  created_by: number | null;
  created_at: string;
  image_url?: string | null;
  users?: Pick<User, 'id' | 'username' | 'email'>;
  languages?: any;
  regions?: any;
  scholar_aliases?: any[];
  scholar_dates?: any[];
  scholar_references?: any[];
  scholar_works?: any[];
  media?: any[];
  img_versions?: any[];
}

export interface DashboardStats {
  total_pending: number;
  overdue: number;
  new_today: number;
  this_week: number;
}

// Standard API Response Wrapper from your backend
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// ==========================================
// 2. AXIOS INSTANCE & INTERCEPTORS
// ==========================================

// Adjust the baseURL based on your environment (Vite, Next.js, CRA)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL  || 'http://localhost:5000/api/admin';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    // Replace with your actual token retrieval logic (localStorage, cookies, Zustand, etc.)
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
      window.location.href = '/login'; // Redirect to login if token is invalid/expired
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 3. ADMIN API ENDPOINTS
// ==========================================

export const adminApi = {
  // 👤 Users Management
  users: {
    getAll: () => api.get<ApiResponse<User[]>>('/users'),
    getById: (id: number) => api.get<ApiResponse<User>>(`/users/${id}`),
    ban: (id: number) => api.patch<ApiResponse>(`/users/${id}/ban`),
    unban: (id: number) => api.patch<ApiResponse>(`/users/${id}/unban`),
    toggleContribute: (id: number) => 
      api.patch<ApiResponse<{ allowed_to_contribute: boolean }>>(`/users/${id}/contribute`),
  },

  // 🎓 Scholars Management
  scholars: {
    getPendingCreated: () => 
      api.get<ApiResponse<ScholarVersion[]>>('/scholars/pending/created'),
    getPendingEdited: () => 
      api.get<ApiResponse<{ proposed: ScholarVersion; current: ScholarVersion | null }[]>>('/scholars/pending/edited'),
    approve: (id: number) => 
      api.put<ApiResponse<ScholarVersion>>(`/scholars/${id}/approve`),
    reject: (id: number, reason: string = '') => 
      api.put<ApiResponse<ScholarVersion>>(`/scholars/${id}/reject`, { reason }),
    getVersions: (id: number, lang?: string) => 
      api.get<ApiResponse<ScholarVersion[]>>(`/scholars/${id}/versions`, { 
        params: lang ? { lang } : undefined 
      }),
    getDashboardStats: () => 
      api.get<ApiResponse<DashboardStats>>('/scholars/states'),
  },

  // 🖼️ Media Management
  media: {
    getPending: () => api.get<ApiResponse<any[]>>('/media/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/media/${id}/approve`),
    reject: (id: number) => api.put<ApiResponse>(`/media/${id}/reject`),
    delete: (id: number) => api.delete<ApiResponse>(`/media/${id}`),
  },

  // 📚 References Management
  references: {
    getPending: () => api.get<ApiResponse<any[]>>('/reference/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/reference/${id}/approve`),
    reject: (id: number) => api.put<ApiResponse>(`/reference/${id}/reject`),
  },

  // 📝 Works Management
  works: {
    getPending: () => api.get<ApiResponse<any[]>>('/work/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/work/${id}/approve`),
    reject: (id: number) => api.put<ApiResponse>(`/work/${id}/reject`),
  },

  // 🖼️ Scholar Images Management
  scholarImages: {
    getPending: () => api.get<ApiResponse<any[]>>('/img/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/img/${id}/approve`),
    reject: (id: number) => api.put<ApiResponse>(`/img/${id}/reject`),
  },

  // 📐 Discipline Management
  discipline: {
    update: (id: number, data: any) => api.put<ApiResponse>(`/discipline/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse>(`/discipline/${id}`),
  },

  // 🌍 Region Management
  region: {
    update: (id: number, data: any) => api.put<ApiResponse>(`/region/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse>(`/region/${id}`),
  },
};

export default adminApi;