import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { authAPI } from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "motorista" | "embarcador" | "admin";
  phone?: string;
  company?: string;
  city?: string;
  state?: string;
  verified?: boolean;
  credits?: number;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const res = await authAPI.login(email, password);
    set({ user: res.data.user });
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    set({ user: res.data.user });
  },

  logout: async () => {
    await authAPI.logout();
    await SecureStore.deleteItemAsync("ft_session");
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const res = await authAPI.me();
      set({ user: res.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  updateProfile: async (data) => {
    const res = await authAPI.updateProfile(data);
    set({ user: res.data.user });
  },
}));
