"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  department?: string;
};

type UserContextType = {
  user: User | null;
  token: string | null;
  role: "admin" | "manager" | "employee";
  setRole: (role: "admin" | "manager" | "employee") => void;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  token: null,
  role: "employee",
  setRole: () => {},
  login: () => {},
  logout: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");

  // LocalStorage’dan geri yükleme
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    if (storedRole) {
      setRole(storedRole as any);
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    setRole(user.role);

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    localStorage.setItem("role", user.role);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole("employee");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  return (
    <UserContext.Provider value={{ user, token, role, setRole, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
