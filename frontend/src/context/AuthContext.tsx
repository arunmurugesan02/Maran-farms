import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearToken, getMeApi, getToken, requestOtpApi, setToken, verifyOtpApi } from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  requestOtp: (phone: string) => Promise<{ phone: string; expiresIn: number; otp?: string }>;
  verifyOtp: (phone: string, otp: string, name?: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    async function hydrateUser() {
      const token = getToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const me = await getMeApi();
        setUser(me);
      } catch (_error) {
        clearToken();
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    hydrateUser();
  }, []);

  const requestOtp = useCallback(async (phone: string) => {
    return requestOtpApi({ phone });
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string, name?: string) => {
    const { token, user: registeredUser } = await verifyOtpApi({ phone, otp, name });
    setToken(token);
    setUser(registeredUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        requestOtp,
        verifyOtp,
        logout,
        isAdmin: user?.isAdmin ?? false,
        isAuthLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
