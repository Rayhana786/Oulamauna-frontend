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

  const fetchMe = useCallback(async (): Promise<any | null> => {
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Auth check failed:", error);
      return null;
    }
  }, []);

  const checkUserStatus = useCallback(async (): Promise<boolean> => {
    const userData = await fetchMe();
    if (userData && (userData.id || userData._id)) {
      setUser(userData);
      setIsLoggedIn(true);
      return true;
    }
    setUser(null);
    setIsLoggedIn(false);
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

  // Accepts user data directly from login response — avoids race condition with cookie
  const login = useCallback((userData: any, redirectTo?: string) => {
    setUser(userData);
    setIsLoggedIn(true);
    if (redirectTo) {
      navigate(redirectTo);
    }
  }, [navigate]);

  // ✅ wrapped in useCallback so it doesn't re-create on every render
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