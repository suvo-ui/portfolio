import React, { createContext, useState, useEffect, ReactNode } from "react";

type AuthContextType = {
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshAuth: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      console.log("🔍 Checking auth...");
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
        {
          credentials: "include",
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      console.log("📡 /me response:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Auth check response:", data);
        setIsAdmin(data?.isAdmin === true);
      } else {
        console.log("❌ Not authenticated");
        setIsAdmin(false);
      }
    } catch (err) {
      console.error("🚨 Auth check error:", err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkAuthStatus();
      setIsLoading(false);
    };

    init();
  }, []); // Only run once on mount

  const refreshAuth = async () => {
    console.log("🔄 Refreshing auth...");
    await checkAuthStatus();
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAdmin(false);
      // Force a hard redirect to prevent back button issues
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ isAdmin, isLoading, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
