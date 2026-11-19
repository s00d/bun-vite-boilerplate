import { createRouter as _createRouter, createMemoryHistory, createWebHistory, type RouteRecordRaw } from "vue-router";
import { I18N_CONFIG, LOCALE_CODES } from "../../config/i18n.config";
import AboutPage from "./pages/AboutPage.vue";
import ChatPage from "./pages/ChatPage.vue";
import HomePage from "./pages/HomePage.vue";
import NotFoundPage from "./pages/NotFoundPage.vue";
import ProfilePage from "./pages/ProfilePage.vue";
import LoginPage from "./pages/auth/LoginPage.vue";
import RegisterPage from "./pages/auth/RegisterPage.vue";

// Names are the route dictionary names: locales/pages/<name with / for ->/<locale>.json.
const baseRoutes: RouteRecordRaw[] = [
  { path: "", name: "home", component: HomePage },
  { path: "profile", name: "profile", component: ProfilePage },
  { path: "chat", name: "chat", component: ChatPage },
  { path: "about", name: "about", component: AboutPage },
  { path: "auth/login", name: "auth-login", component: LoginPage },
  { path: "auth/register", name: "auth-register", component: RegisterPage },
];

// The default locale is unprefixed, every other one is a prefix (/ru/about).
const prefixed = LOCALE_CODES.filter((code) => code !== I18N_CONFIG.defaultLocale).join("|");

const routes: RouteRecordRaw[] = [
  { path: `/:locale(${prefixed})?`, children: baseRoutes },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFoundPage },
];

export function createRouter() {
  return _createRouter({
    history: typeof window === "undefined" ? createMemoryHistory() : createWebHistory(),
    routes,
  });
}
