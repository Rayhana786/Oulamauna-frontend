import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES
// ==========================================

export interface User {
  id: number;
  username: string;
  email: string;
  name?: string | null;
  bio?: string | null;
  profile_picture?: string | null;
  contributorBadge?: boolean;
  role?: string;
  is_banned: boolean;
  is_active:boolean;
  strike_count?: number;
  created_at: string;
  allowed_to_contribute: boolean;
}
export interface ScholarSummary {
  scholarId: string;
  createdBy: string;
  createdAt: string;
  isFeatured: boolean;
  status: 'approved' | 'pending' | 'rejected';
  counts: { 
    approved: number; 
    pending: number; 
    rejected: number; 
    total: number;
  };
  primaryVersion: {
    canonical_name: string;
    image_url: string | null;
    language_code: string;
  } | null;
  versions: Array<{
    version_id: number;
    status: string;
    language_code: string;
    canonical_name: string;
    image_url: string | null;
  }>;
}

export interface ScholarVersion {
  version_id: number;
  scholar_id: number;
  language_id: number;
   
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  version_type: 'creation' | 'edition';
  canonical_name: string;
  
  biography?: string | null;
  century_gregorian_start?: number | null;
  century_gregorian_end?: number | null;
  century_hijri_start?: number | null;
  century_hijri_end?: number | null;
  region_id?: number | null;
  image_status?: string | null;
  image_uploaded_by?: number | null;
  
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
  
  scholar_disciplines?: Array<{
    disciplines?: { name: string };
  }>;
  
  scholar_relationships_as_source?: any[];
}

export interface DashboardStats {
  total_pending: number;
  overdue: number;
  new_today: number;
  this_week: number;
  avg_review_time?: string;
}

// Standard API Response Wrapper from your backend
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at?: string | null;
  replied_at?: string | null;
  admin_reply?: string | null;
  admin_note?: string | null;
}


export interface Report {
  report_id: number;
  reporter_id: number | null;
  content_type: 'forum_post' | 'forum_comment' | 'scholar' | 'comment';
  content_id: number;
  reason: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  users: { id: number; username: string; name: string | null } | null; // The reporter
  content: any; // The actual post or comment
  author: { id: number; username: string; name: string | null; strike_count: number; is_banned: boolean } | null; // Author of the content
}

export interface ResolveReportPayload {
  report_id: number;
  action: 'dismiss' | 'delete_and_strike';
}
export interface WorkSummary {
  workId: string;
  title: string;
  year: number | null;
  format: string;
  description: string | null; // ✅ ADDED
  isFeatured: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  mediaUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  sourceType: 'upload' | 'external' | null;
  createdBy: number | null;
  uploader: { id: number; username: string; name: string | null } | null; // ✅ ADDED
  scholarName: string;
  scholarId: number | null;
  languageCode: string;
}

export interface MediaSummary {
  mediaId: string;
  title: string;
  year: number | null; // ✅ ADDED
  description: string | null; // ✅ ADDED
  fileType: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  uploadedAt: string | null; // ✅ ADDED
  mediaUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  sourceType: 'upload' | 'external' | null;
  viewCount: number; // ✅ ADDED
  likeCount: number; // ✅ ADDED
  uploadedBy: number | null; // ✅ ADDED
  uploader: { id: number; username: string; name: string | null } | null; // ✅ ADDED
  scholarName: string;
  scholarId: number | null;
  languageCode: string;
}



// ==========================================
// 2. AXIOS INSTANCE & INTERCEPTORS
// ==========================================

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5444';
const API_BASE_URL = `${BASE_URL}/api/admin`;
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
// 3. ADMIN API ENDPOINTS (Updated with `reason` support)
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
    getContributions: (id: number) => api.get<ApiResponse<any[]>>(`/users/${id}/contributions`),
    getForumPosts: (id: number) => api.get<ApiResponse<any[]>>(`/users/${id}/posts`),
  },

  // 🎓 Scholars Management
  scholars: {
    getPendingCreated: () => 
      api.get<ApiResponse<ScholarVersion[]>>('/scholars/pending/created'),
    getPendingEdited: () => 
      api.get<ApiResponse<{ proposed: ScholarVersion; current: ScholarVersion | null }[]>>('/scholars/pending/edited'),
    
    // ✅ UPDATED: Added `reason` to payload so backend doesn't crash
    approve: (id: number, payload?: { 
      reason?: string;
      reject_images?: number[]; 
      reject_works?: number[]; 
      reject_references?: number[]; 
      reject_media?: number[] 
    }) => 
      api.put<ApiResponse<ScholarVersion>>(`/scholars/${id}/approve`, payload || {}),
    
    // ✅ UPDATED: Sends `reason` in body
    reject: (id: number, reason: string = '') => 
      api.put<ApiResponse<ScholarVersion>>(`/scholars/${id}/reject`, { reason }),
      
    getVersions: (id: number, lang?: string) => 
      api.get<ApiResponse<ScholarVersion[]>>(`/scholars/${id}/versions`, { 
        params: lang ? { lang } : undefined 
      }),
    getDashboardStats: () => 
      api.get<ApiResponse<DashboardStats>>('/scholars/states'),
    getAllSummary: () =>
      api.get<ApiResponse<ScholarSummary[]>>('/scholars/all'),
    // ✅ UPDATED: Accepts optional versionId
// ✅ UPDATED: 'id' in the URL is now the version_id
getVersionDetail: (versionId: number, lang: string) =>
  api.get<ApiResponse<ScholarVersion>>(`/scholars/${versionId}/${lang}`),
    getDashboardData: (params?: { graphView?: '30days' | 'yearly' | 'all' }) => 
      api.get<ApiResponse<any>>('/dashboard/data', { params }),
     toggleFeature: (id: number) => 
      api.patch<ApiResponse<{ is_featured: boolean }>>(`/scholars/${id}/feature`),
  },

  // 🖼️ Media Management
media: {
    getAllSummary: () => api.get<ApiResponse<MediaSummary[]>>('/media/summary'), // ✅ UPDATED
    getPending: () => api.get<ApiResponse<any[]>>('/media/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/media/${id}/approve`),
    reject: (id: number, reason: string = '') => api.put<ApiResponse>(`/media/${id}/reject`, { reason }),
    delete: (id: number) => api.delete<ApiResponse>(`/media/${id}`),
  },

  // 📚 References Management
  references: {
    getPending: () => api.get<ApiResponse<any[]>>('/reference/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/reference/${id}/approve`),
    
    // ✅ UPDATED: Sends `reason` in body
    reject: (id: number, reason: string = '') => api.put<ApiResponse>(`/reference/${id}/reject`, { reason }),
  },

  // 📝 Works Management
   works: {
    getAllSummary: () => api.get<ApiResponse<WorkSummary[]>>('/work/summary'), // ✅ UPDATED
    getPending: () => api.get<ApiResponse<any[]>>('/work/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/work/${id}/approve`),
    reject: (id: number, reason: string = '') => api.put<ApiResponse>(`/work/${id}/reject`, { reason }),
    toggleFeature: (id: number) => 
      api.patch<ApiResponse<{ is_featured: boolean }>>(`/work/${id}/feature`),
  },

  // 🖼️ Scholar Images Management
  scholarImages: {
    getPending: () => api.get<ApiResponse<any[]>>('/img/pending'),
    approve: (id: number) => api.put<ApiResponse>(`/img/${id}/approve`),
    reject: (id: number, reason: string = '') => api.put<ApiResponse>(`/img/${id}/reject`, { reason }),
  },

    // 📐 Discipline Management
  discipline: {
    getAll: () => api.get<ApiResponse<any[]>>('/discipline'), // ✅ Fixed: matches backend route
    create: (data: any) => api.post<ApiResponse>('/discipline', data), // ✅ Added
    update: (id: number, data: any) => api.put<ApiResponse>(`/discipline/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse>(`/discipline/${id}`),
    
    // ✅ CRITICAL FIX: Added multipart/form-data header so FormData uploads actually work!
    uploadImage: (id: number, formData: FormData) => 
      api.put<ApiResponse>(`/discipline/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
  },

  // 🌍 Region Management
  region: {
    getAll: () => api.get<ApiResponse<any[]>>('/region'), // ✅ Added: matches backend route
    create: (data: any) => api.post<ApiResponse>('/region', data), // ✅ Added
    update: (id: number, data: any) => api.put<ApiResponse>(`/region/${id}`, data),
    delete: (id: number) => api.delete<ApiResponse>(`/region/${id}`),
  },
  forum: {
    getAdminPosts: (params?: any) => api.get<ApiResponse<any>>('/posts', { params }),
    getPostDetails: (id: number) => api.get<ApiResponse<any>>(`/posts/${id}`),
    hidePost: (id: number) => api.put<ApiResponse<any>>(`/posts/${id}/hide`),
    restorePost: (id: number) => api.put<ApiResponse<any>>(`/posts/${id}/restore`),           // ✅ new
    deletePostPermanently: (id: number) => api.delete<ApiResponse<any>>(`/posts/${id}`),

    hideComment: (id: number) => api.put<ApiResponse<any>>(`/comments/${id}/hide`),            // ✅ new
    restoreComment: (id: number) => api.put<ApiResponse<any>>(`/comments/${id}/restore`),      // ✅ new
    deleteCommentPermanently: (id: number) => api.delete<ApiResponse<any>>(`/comments/${id}`), // ✅ new

    getCategories: () => api.get<ApiResponse<any>>('/categories'),
    createCategory: (data: any) => api.post<ApiResponse<any>>('/categories', data),
    updateCategory: (id: number, data: any) => api.put<ApiResponse<any>>(`/categories/${id}`, data),
    deleteCategory: (id: number) => api.delete<ApiResponse<any>>(`/categories/${id}`),
    reorderCategories: (categoryIds: number[]) => api.put<ApiResponse<any>>('/categories/reorder', { categoryIds }),
  },
  contactus: {
    getAll: () => api.get<ApiResponse<ContactMessage[]>>('/contactus'),
    getById: (id: number) => api.get<ApiResponse<ContactMessage>>(`/contactus/${id}`),
    reply: (id: number, data: { admin_reply: string; admin_note?: string }) => 
      api.post<ApiResponse<ContactMessage>>(`/contactus/${id}/reply`, data),
    archive: (id: number) => api.patch<ApiResponse>(`/contactus/${id}/archive`),
  },

  // 🚩 NEW: Reports & Moderation Management
  reports: {
    getPending: () => api.get<ApiResponse<Report[]>>('/reports/pending'),
    resolve: (report_id: number, action: 'dismiss' | 'delete_and_strike') => 
      api.post<ApiResponse>(`/reports/resolve`, { report_id, action }),
  },
};

export default adminApi;