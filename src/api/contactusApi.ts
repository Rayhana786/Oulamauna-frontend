import axios from 'axios';

// Use the same base URL logic
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5444';

// Create a public axios instance (no /admin in the URL)
const publicApi = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interface for the form data
export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

// Interface for the API response
export interface ContactResponse {
  success: boolean;
  message: string;
}

// The function to submit the form
export const submitContactForm = (data: ContactFormData) => {
  return publicApi.post<ContactResponse>('/contactus', data);
};