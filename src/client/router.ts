// src/client/router.ts
import { createRouter as _createRouter, createMemoryHistory, createWebHistory } from "vue-router";
import AboutPage from "./pages/AboutPage.vue";
import ChatPage from "./pages/ChatPage.vue";
import HomePage from "./pages/HomePage.vue";
import NotFoundPage from "./pages/NotFoundPage.vue";
import ProfilePage from "./pages/ProfilePage.vue";
import LoginPage from "./pages/auth/LoginPage.vue";
import RegisterPage from "./pages/auth/RegisterPage.vue";

export function createRouter() {
  const isServer = typeof window === "undefined";
  return _createRouter({
    history: isServer ? createMemoryHistory() : createWebHistory(),
    routes: [
      { path: "/", component: HomePage },
      { path: "/profile", component: ProfilePage },
      { path: "/chat", component: ChatPage },
      { path: "/about", component: AboutPage },
      { path: "/auth/login", component: LoginPage },
      { path: "/auth/register", component: RegisterPage },
      { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFoundPage },
    ],
  });
}
