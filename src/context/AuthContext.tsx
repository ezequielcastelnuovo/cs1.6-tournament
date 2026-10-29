"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserPublicProfile } from "@/lib/types";

interface AuthContextType {
  user: UserPublicProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  isProfileModalOpen: boolean;
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
    displayName?: string,
    avatarColor?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "cs16_user_account";
const LOCAL_STORAGE_TOKEN_KEY = "cs16_session_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublicProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Synchronously initialize from localStorage on mount (eliminates F5 flicker)
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);

      if (savedUserStr && savedToken) {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        setToken(savedToken);
      }
    } catch (e) {
      console.warn("Error reading auth from localStorage:", e);
    } finally {
      setIsLoading(false);
    }

    // Background session verification with server
    async function verifySession() {
      try {
        const savedToken = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
        const res = await fetch("/api/auth/me", {
          headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setToken(data.token || savedToken);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
            if (data.token) {
              localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
            }
          } else {
            // Server revoked session
            setUser(null);
            setToken(null);
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
          }
        }
      } catch (err) {
        console.warn("Background auth validation failed (offline/network):", err);
      }
    }

    verifySession();
  }, []);

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => {
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Error al iniciar sesión" };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error de conexión" };
    }
  };

  const register = async (
    username: string,
    password: string,
    displayName?: string,
    avatarColor?: string
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName, avatarColor }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Error al registrar la cuenta" };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, data.token);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Error de conexión" };
    }
  };

  const logout = async () => {
    try {
      const savedToken = token || localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
      });
    } catch (e) {
      console.warn("Logout request failed:", e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      setIsProfileModalOpen(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
