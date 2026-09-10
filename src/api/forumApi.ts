import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface ForumUser {
  id: number;
  username: string;
  name: string | null;
  profile_picture: string | null;
}

export interface ForumCategory {
  category_id: number;
  name: string;
  translations?: Record<string, string> | null; // ✅ Added: e.g., { ar: "تاريخ", fr: "Histoire" }
  description?: string | null;                  // ✅ Added
  display_order?: number;    
  post_count?: number;
}

export interface ForumPost {
  post_id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  like_count?: number;
  liked?: boolean; 
  users?: ForumUser;
  forum_categories?: ForumCategory | null;
  _count?: {
    forum_comments: number;
  };
}

export interface ForumComment {
  comment_id: number;
  post_id: number;
  user_id: number;
  parent_comment_id: number | null;
  content: string;
  created_at: string;
  deleted_at: string | null;
  like_count?: number;
  liked?: boolean; // ✅ ADD THIS: Needed for the red/green like button state
  users?: ForumUser;
}

export interface PostWithComments {
  post: ForumPost;
  comments: ForumComment[];
}

export interface LikeResponse {
  liked: boolean;
  like_count: number;
}

export interface ForumReport {
  id?: number;
  report_id?: number;
  reporter_id: number;
  content_type: 'forum_post' | 'forum_comment';
  content_id: number;
  reason: string | null;
  status: string;
  created_at: string;
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
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5444';
const API_BASE_URL = `${BASE_URL}/api/forum`;

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
// 3. FORUM API ENDPOINTS
// ==========================================

export const forumApi = {
  // 📝 Posts Management
  posts: {
    getAll: (params?: { category_id?: number; page?: number; limit?: number }) => 
      api.get<ApiResponse<ForumPost[]>>('/posts', { params }),
    
    getById: (id: number) => 
      api.get<ApiResponse<PostWithComments>>(`/posts/${id}`),
    
    create: (data: { title: string; content: string; category_id: number }) => 
      api.post<ApiResponse<ForumPost>>('/posts', data),
    
    delete: (id: number) => 
      api.delete<ApiResponse>(`/posts/${id}`),
    
    toggleLike: (id: number) => 
      api.post<ApiResponse<LikeResponse>>(`/posts/${id}/like`),
    
    report: (id: number, reason: string) => 
      api.post<ApiResponse<ForumReport>>(`/posts/${id}/report`, { reason }),
  },

  // 💬 Comments Management
  comments: {
    create: (postId: number, data: { content: string; parent_comment_id?: number }) => 
      api.post<ApiResponse<ForumComment>>(`/posts/${postId}/comments`, data),
    
    delete: (id: number) => 
      api.delete<ApiResponse>(`/comments/${id}`),
    
    toggleLike: (id: number) => 
      api.post<ApiResponse<LikeResponse>>(`/comments/${id}/like`),
    
    report: (id: number, reason: string) => 
      api.post<ApiResponse<ForumReport>>(`/comments/${id}/report`, { reason }),
  },
   categories: {
    getAll: () => 
      api.get<ApiResponse<ForumCategory[]>>('/categories'),
  },
};

export default forumApi;