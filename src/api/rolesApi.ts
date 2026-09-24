// src/api/rolesApi.ts

// ✅ Reuse your existing API URL logic
const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5444";

export const rolesApi = {
  // Fetch all roles and the specific admin role ID
  getRoles: async (): Promise<any> => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/roles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return await res.json();
  },

  // ✅ Helper: Just get the admin role ID directly (useful for quick checks)
  getAdminRoleId: async (): Promise<number | null> => {
    try {
      const response = await rolesApi.getRoles();
      return response?.data?.adminRoleId || null;
    } catch (error) {
      console.error("Failed to get admin role ID:", error);
      return null;
    }
  }
};