import axios, { AxiosInstance, AxiosError } from 'axios';

// ==========================================
// 1. TYPESCRIPT INTERFACES (واجهات البيانات)
// ==========================================

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  type?: string;          // مثال: 'comment', 'order', 'system'
  is_read: boolean;
  created_at: string;
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
  type?: string;
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
  
  // 📥 1. جلب الإشعارات (مع دعم الفلترة والترقيم)
  getNotifications: (params?: { unread_only?: boolean; page?: number; limit?: number }) => 
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

export default notificationApi;