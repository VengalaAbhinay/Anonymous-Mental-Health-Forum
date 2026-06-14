import { create } from "zustand";
import api from "../api/axiosInstance";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { data } = await api.get("/user-api/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/user-api/login", { email, password });
    set({ user: data.user });
    return data;
  },

  logout: async () => {
    await api.post("/user-api/logout");
    set({ user: null });
  },

  register: async (email, password, alias) => {
    const { data } = await api.post("/user-api/register", { email, password, alias });
    return data;
  },

  updateAlias: (alias) => set((s) => ({ user: { ...s.user, alias } })),
}));
