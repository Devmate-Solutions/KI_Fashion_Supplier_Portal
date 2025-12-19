"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, login as loginRequest, register as registerRequest } from "@/lib/api/auth";
import { SUPPLIER_TOKEN_COOKIE } from "@/lib/constants";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearSession = useCallback(() => {
    Cookies.remove(SUPPLIER_TOKEN_COOKIE);
    setToken(null);
    setUser(null);
  }, []);

  const boot = useCallback(async () => {
    const storedToken = Cookies.get(SUPPLIER_TOKEN_COOKIE);
    if (!storedToken) {
      clearSession();
      setIsLoading(false);
      return;
    }

    try {
      const { user: profile } = await getCurrentUser();
      if (!profile || profile.role !== "supplier") {
        clearSession();
        setIsLoading(false);
        return;
      }

      setUser(profile);
      setToken(storedToken);
    } catch (error) {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    boot();
  }, [boot]);

  useEffect(() => {
    if (!isLoading && user && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, pathname, router]);

  const login = useCallback(
    async (credentials) => {
      const response = await loginRequest(credentials);
      if (!response?.token || !response?.user) {
        throw new Error(response?.message || "Unable to sign in");
      }

      if (response.user.role !== "supplier") {
        throw new Error("Supplier access required");
      }

      const isSecureContext = typeof window !== "undefined" && window.location.protocol === "https:";
      Cookies.set(SUPPLIER_TOKEN_COOKIE, response.token, {
        expires: 1,
        sameSite: "lax",
        secure: isSecureContext,
        path: "/",
      });

      setUser(response.user);
      setToken(response.token);
      return response.user;
    },
    []
  );

  const register = useCallback(async (payload) => {
    const response = await registerRequest({
      ...payload,
      role: "supplier",
      signupSource: "supplier-portal",
      portalAccess: ["supplier"],
    });

    if (!response?.token || !response?.user) {
      throw new Error(response?.message || "Unable to create account");
    }

    if (response.user.role !== "supplier") {
      throw new Error("Supplier access required");
    }

    const isSecureContext = typeof window !== "undefined" && window.location.protocol === "https:";
    Cookies.set(SUPPLIER_TOKEN_COOKIE, response.token, {
      expires: 1,
      sameSite: "lax",
      secure: isSecureContext,
      path: "/",
    });

    setUser(response.user);
    setToken(response.token);
    return response.user;
  }, []);

  const logout = useCallback(
    (redirectToLogin = true) => {
      clearSession();
      if (redirectToLogin) {
        router.push("/login");
      }
    },
    [clearSession, router]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
      register,
      refreshProfile: boot,
    }),
    [user, token, isLoading, login, logout, register, boot]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
