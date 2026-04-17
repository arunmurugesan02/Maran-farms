import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { clearToken, getMeApi, loginApi, registerApi, setToken } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
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

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedInUser } = await loginApi({ email, password });
    setToken(token);
    setUser(loggedInUser);
    return true;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token, user: registeredUser } = await registerApi({ name, email, password });
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
        login,
        register,
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
