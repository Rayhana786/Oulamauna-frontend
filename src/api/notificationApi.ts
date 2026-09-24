import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES (واجهات البيانات)
// ==========================================

export type NotificationType =
  | "NEW_SCHOLAR_SUBMISSION"
  | "EDIT_PROPOSAL"
  | "REPORT_SUBMITTED"
  | "SCHOLAR_APPROVED"
  | "SCHOLAR_REJECTED"
  | "MEDIA_APPROVED"
  | "MEDIA_REJECTED"
  | "IMAGE_APPROVED"
  | "IMAGE_REJECTED"
  | "WORK_APPROVED"
  | "WORK_REJECTED"
  | "REFERENCE_APPROVED"
  | "REFERENCE_REJECTED"
  | "NEW_DISCIPLINE_SUBMISSION"
  | "NEW_REGION_SUBMISSION"
  | "NEW_FORUM_POST"
  | "COMMENT_ON_POST"
  | "REPLY_TO_COMMENT";

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type?: NotificationType;
  is_read: boolean;
  created_at: string;
  related_entity?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  unread_count: number;   // عدد الإشعارات غير المقروءة للبادج 🔴
}

export interface CreateNotificationPayload {
  user_id: number;
  title: string;
  message: string;
  type?: NotificationType;
}

// واجهة موحدة للاستجابات (نفس المستخدمة في userApi)
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// ==========================================
// 2. AXIOS INSTANCE & INTERCEPTORS
// ==========================================

const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api/notification`; // تأكد أن هذا يطابق مسار الـ router في الباك إند

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

// Request Interceptor: إرفاق توكن JWT تلقائياً
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

// Response Interceptor: التعامل مع انتهاء صلاحية التوكن (401)
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
// 3. NOTIFICATION API ENDPOINTS
// ==========================================

export const notificationApi = {
  
 getNotifications: (params?: { unread_only?: boolean; page?: number; limit?: number; scope?: "public" | "admin" }) => 
  api.get<NotificationListResponse>('/', { params }),

  // ✅ 2. تحديد إشعار واحد كمقروء
  markAsRead: (id: number) => 
    api.post<ApiResponse<Notification>>(`/${id}`),

  // ✅✅ 3. تحديد جميع الإشعارات كمقروءة
  markAllAsRead: () => 
    api.post<ApiResponse<{ message: string }>>('/All'),

  // ➕ 4. إنشاء إشعار جديد (للاستخدام الداخلي أو من قبل الأدمن)
  createNotification: (payload: CreateNotificationPayload) => 
    api.post<ApiResponse<Notification>>('/', payload),
};

// ==========================================
// 4. SCOPE FILTERING (public vs admin)
// ==========================================

export const ADMIN_ONLY_TYPES: Set<NotificationType> = new Set([
  "NEW_SCHOLAR_SUBMISSION",
  "EDIT_PROPOSAL",
  "REPORT_SUBMITTED",
  "NEW_DISCIPLINE_SUBMISSION",
  "NEW_REGION_SUBMISSION",
  "NEW_FORUM_POST",
]);

export const isAdminNotification = (type?: NotificationType): boolean =>
  !!type && ADMIN_ONLY_TYPES.has(type);

export default notificationApi;