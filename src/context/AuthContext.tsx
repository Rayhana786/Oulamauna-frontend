// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api/auth";

type AuthContextType = {
  user: any;
  isLoggedIn: boolean;
  login: (userData: any, redirectTo?: string) => void;
  logout: () => Promise<void>;
  checkUserStatus: () => Promise<boolean>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMe = useCallback(async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      // 401 = no token = definitely logged out
      if (response.status === 401) return null;

      // 500 or anything else = server problem, don't log out
      return undefined;
    } catch (error) {
      console.error("Auth check failed:", error);
      // Network error — don't log out, server might be temporarily down
      return undefined;
    }
  }, []);

  const checkUserStatus = useCallback(async (): Promise<boolean> => {
    const userData = await fetchMe();

    if (userData && (userData.id || userData._id)) {
      // ✅ Got valid user data
      setUser(userData);
      setIsLoggedIn(true);
      return true;
    }

    if (userData === null) {
      // ✅ Definitely no token (401) — log out
      setUser(null);
      setIsLoggedIn(false);
      return false;
    }

    // undefined = server error or network issue — keep current state, don't log out
    return false;
  }, [fetchMe]);

  // On app start: restore session from cookie
  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      setLoading(true);
      await checkUserStatus();
      if (mounted) setLoading(false);
    };
    initAuth();
    return () => { mounted = false; };
  }, [checkUserStatus]);

  const login = useCallback((userData: any, redirectTo?: string) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {
      // ignore network errors — still clear state
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      navigate("/");
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, checkUserStatus, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};