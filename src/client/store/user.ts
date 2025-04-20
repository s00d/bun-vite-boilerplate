import { api } from "@/shared/axios";
import { getEnv } from "@/shared/env";
// src/client/store/user.ts
import { defineStore } from "pinia";

interface UserInfo {
  id: number;
  email: string;
  apiKey: string;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as UserInfo | null, // null, если не авторизован
  }),

  getters: {
    isLoggedIn: (state) => !!state.user, // true, если user не null
  },

  actions: {
    async get() {
      try {
        const res = await api.get("/api/profile");

        this.user = await res.data;
      } catch (e) {
        this.user = null;
      }
    },
  },
});
