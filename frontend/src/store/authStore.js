import { create } from "zustand";
import api from "../api/axiosInstance";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { data } = await api.get("/user-api/me");
      set({ user: data.user, loading: false });
      return data;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
  },

  login: async (email, password) => {
    const { data } = await api.post("/user-api/login", { email, password });
    set({ user: data.user, loading: false });
    return data;
  },

  logout: async () => {
    try {
      await api.post("/user-api/logout");
    } catch {}
    set({ user: null, loading: false });
  },

  register: async (email, password, alias) => {
    const { data } = await api.post("/user-api/register", {
      email,
      password,
      alias,
    });
    return data;
  },

  updateAlias: (alias) =>
    set((s) => ({
      user: s.user ? { ...s.user, alias } : null,
    })),
}));